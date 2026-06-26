import base64
import tempfile
from decimal import Decimal
from pathlib import Path

from django.contrib.auth.models import Permission, User
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from categories.models import Category
from inventory.models import StockTransaction, StockTransactionItem, Warehouse

from .models import Product, ProductImage


SMALL_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
)


class ProductAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="manager",
            password="managerpass123",
        )
        self.user.user_permissions.add(
            *Permission.objects.filter(content_type__app_label__in=["products", "inventory"])
        )
        self.category = Category.objects.create(name="Electronics")

    def make_test_image(self, name):
        return SimpleUploadedFile(name, SMALL_PNG, content_type="image/png")

    def test_product_api_requires_authentication(self):
        response = self.client.get("/api/products/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_user_can_create_list_update_and_delete_product(self):
        self.client.force_authenticate(user=self.user)

        create_response = self.client.post(
            "/api/products/",
            {
                "name": "Keyboard",
                "description": "Mechanical keyboard",
                "price": "49.99",
                "category": self.category.id,
            },
            format="json",
        )

        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        product_id = create_response.data["id"]
        self.assertEqual(create_response.data["category_detail"]["name"], "Electronics")
        self.assertEqual(create_response.data["price"], "49.99")
        self.assertEqual(create_response.data["quantity"], 0)
        self.assertTrue(create_response.data["sku"].startswith("PRD-"))

        list_response = self.client.get("/api/products/?search=Keyboard")
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(list_response.data["count"], 1)

        update_response = self.client.patch(
            f"/api/products/{product_id}/",
            {"name": "Keyboard Pro", "quantity": 8},
            format="json",
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data["name"], "Keyboard Pro")
        self.assertEqual(update_response.data["quantity"], 0)

        delete_response = self.client.delete(f"/api/products/{product_id}/")
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Product.objects.filter(id=product_id).exists())

    def test_authenticated_user_can_upload_multiple_product_images(self):
        self.client.force_authenticate(user=self.user)

        with tempfile.TemporaryDirectory() as media_root:
            with self.settings(MEDIA_ROOT=media_root):
                response = self.client.post(
                    "/api/products/",
                    {
                        "name": "Camera",
                        "description": "Camera with gallery",
                        "selling_price": "199.99",
                        "category": self.category.id,
                        "uploaded_images": [
                            self.make_test_image("front.png"),
                            self.make_test_image("back.png"),
                        ],
                    },
                    format="multipart",
                )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data["images"]), 2)
        self.assertEqual(response.data["images"][0]["is_primary"], True)
        self.assertIn("/media/products/gallery/", response.data["image"])
        self.assertEqual(
            ProductImage.objects.filter(product_id=response.data["id"]).count(),
            2,
        )

    def test_product_image_upload_rejects_too_many_images(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            "/api/products/",
            {
                "name": "Camera",
                "selling_price": "199.99",
                "category": self.category.id,
                "uploaded_images": [
                    self.make_test_image(f"image-{index}.png")
                    for index in range(9)
                ],
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Product.objects.filter(name="Camera").count(), 0)
        self.assertIn("images", response.data)

    def test_product_image_update_replaces_gallery_and_deletes_old_files(self):
        self.client.force_authenticate(user=self.user)

        with tempfile.TemporaryDirectory() as media_root:
            with self.settings(MEDIA_ROOT=media_root):
                create_response = self.client.post(
                    "/api/products/",
                    {
                        "name": "Camera",
                        "selling_price": "199.99",
                        "category": self.category.id,
                        "uploaded_images": [
                            self.make_test_image("front.png"),
                            self.make_test_image("back.png"),
                        ],
                    },
                    format="multipart",
                )

                product_id = create_response.data["id"]
                old_files = [
                    Path(media_root) / image.image.name
                    for image in ProductImage.objects.filter(product_id=product_id)
                ]
                self.assertTrue(all(path.exists() for path in old_files))

                with self.captureOnCommitCallbacks(execute=True):
                    update_response = self.client.patch(
                        f"/api/products/{product_id}/",
                        {
                            "name": "Camera Pro",
                            "uploaded_images": [self.make_test_image("new.png")],
                        },
                        format="multipart",
                    )

                self.assertEqual(update_response.status_code, status.HTTP_200_OK)
                self.assertEqual(update_response.data["name"], "Camera Pro")
                self.assertEqual(len(update_response.data["images"]), 1)
                self.assertEqual(
                    ProductImage.objects.filter(product_id=product_id).count(),
                    1,
                )
                self.assertTrue(all(not path.exists() for path in old_files))

    def test_authenticated_user_can_filter_products_by_category(self):
        self.client.force_authenticate(user=self.user)
        other_category = Category.objects.create(name="Stationery")
        Product.objects.create(
            sku="MOUSE-001",
            name="Mouse",
            description="Wireless mouse",
            selling_price="19.99",
            quantity=5,
            category=self.category,
        )
        Product.objects.create(
            sku="NOTEBOOK-001",
            name="Notebook",
            description="A5 notebook",
            selling_price="3.50",
            quantity=20,
            category=other_category,
        )

        response = self.client.get(f"/api/products/?category={self.category.id}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["name"], "Mouse")

    def test_authenticated_user_can_filter_products_by_price_quantity_status_and_low_stock(self):
        self.client.force_authenticate(user=self.user)
        Product.objects.create(
            sku="ACTIVE-001",
            name="Active Product",
            selling_price="100.00",
            quantity=10,
            minimum_stock=3,
            status=Product.Status.ACTIVE,
            category=self.category,
        )
        Product.objects.create(
            sku="LOW-001",
            name="Low Stock Product",
            selling_price="20.00",
            quantity=2,
            minimum_stock=5,
            status=Product.Status.INACTIVE,
            category=self.category,
        )

        response = self.client.get(
            "/api/products/?min_price=50&max_price=150&min_quantity=5&status=active"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["name"], "Active Product")

        low_stock_response = self.client.get("/api/products/?low_stock=true")

        self.assertEqual(low_stock_response.status_code, status.HTTP_200_OK)
        self.assertEqual(low_stock_response.data["count"], 1)
        self.assertEqual(low_stock_response.data["results"][0]["name"], "Low Stock Product")

    def test_authenticated_user_can_view_product_stock_history(self):
        self.client.force_authenticate(user=self.user)
        product = Product.objects.create(
            sku="KEYBOARD-001",
            name="Keyboard",
            selling_price="49.99",
            quantity=10,
            category=self.category,
        )
        warehouse = Warehouse.objects.create(name="Main Warehouse")
        stock_transaction = StockTransaction.objects.create(
            warehouse=warehouse,
            transaction_type=StockTransaction.TransactionType.IMPORT,
            transaction_code="IMPORT-001",
            created_by=self.user,
        )
        StockTransactionItem.objects.create(
            stock_transaction=stock_transaction,
            product=product,
            quantity=5,
            unit_price=Decimal("40.00"),
        )

        response = self.client.get(f"/api/products/{product.id}/stock-history/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["product"], product.id)
        self.assertEqual(response.data["results"][0]["total_amount"], "200.00")

    def test_delete_product_used_in_stock_transaction_returns_conflict(self):
        self.client.force_authenticate(user=self.user)
        product = Product.objects.create(
            sku="LOCKED-001",
            name="Locked product",
            selling_price="49.99",
            quantity=10,
            category=self.category,
        )
        warehouse = Warehouse.objects.create(name="Main Warehouse")
        stock_transaction = StockTransaction.objects.create(
            warehouse=warehouse,
            transaction_type=StockTransaction.TransactionType.IMPORT,
            transaction_code="IMPORT-LOCKED",
            created_by=self.user,
        )
        StockTransactionItem.objects.create(
            stock_transaction=stock_transaction,
            product=product,
            quantity=1,
            unit_price=Decimal("40.00"),
        )

        response = self.client.delete(f"/api/products/{product.id}/")

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertTrue(Product.objects.filter(id=product.id).exists())


class HealthCheckAPITests(APITestCase):
    def test_health_check_does_not_require_authentication(self):
        response = self.client.get("/api/health/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"status": "ok"})
