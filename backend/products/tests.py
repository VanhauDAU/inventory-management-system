from decimal import Decimal

from django.contrib.auth.models import Permission, User
from rest_framework import status
from rest_framework.test import APITestCase

from categories.models import Category
from inventory.models import StockTransaction, StockTransactionItem, Warehouse

from .models import Product


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
                "quantity": 12,
                "category": self.category.id,
            },
            format="json",
        )

        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        product_id = create_response.data["id"]
        self.assertEqual(create_response.data["category_detail"]["name"], "Electronics")
        self.assertEqual(create_response.data["price"], "49.99")
        self.assertTrue(create_response.data["sku"].startswith("PRD-"))

        list_response = self.client.get("/api/products/?search=Keyboard")
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(list_response.data["count"], 1)

        update_response = self.client.patch(
            f"/api/products/{product_id}/",
            {"quantity": 8},
            format="json",
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data["quantity"], 8)

        delete_response = self.client.delete(f"/api/products/{product_id}/")
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Product.objects.filter(id=product_id).exists())

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
