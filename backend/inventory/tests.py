from decimal import Decimal

from django.contrib.auth.models import Permission, User
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from categories.models import Category
from products.models import Product
from suppliers.models import Supplier

from .models import StockTransaction, StockTransactionItem, Warehouse, WarehouseStock


class InventoryModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="inventory-manager")
        self.category = Category.objects.create(name="Electronics")
        self.supplier = Supplier.objects.create(name="Supplier A")
        self.product = Product.objects.create(
            sku="PRODUCT-001",
            name="Keyboard",
            category=self.category,
            supplier=self.supplier,
            cost_price=Decimal("40.00"),
            selling_price=Decimal("55.00"),
        )
        self.warehouse = Warehouse.objects.create(name="Main Warehouse")

    def test_category_and_supplier_relationships(self):
        child = Category.objects.create(name="Accessories", parent=self.category)

        self.assertEqual(child.parent, self.category)
        self.assertEqual(self.product.supplier, self.supplier)
        self.assertIn(self.product, self.category.products.all())

    def test_stock_transaction_item_calculates_total_amount(self):
        stock_transaction = StockTransaction.objects.create(
            warehouse=self.warehouse,
            transaction_type=StockTransaction.TransactionType.IMPORT,
            transaction_code="IMPORT-001",
            created_by=self.user,
        )

        item = StockTransactionItem.objects.create(
            stock_transaction=stock_transaction,
            product=self.product,
            quantity=3,
            unit_price=Decimal("40.00"),
        )

        self.assertEqual(item.total_amount, Decimal("120.00"))
        self.assertEqual(stock_transaction.items.get(), item)


class InventoryAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="inventory-manager",
            password="managerpass123",
        )
        self.user.user_permissions.add(
            *Permission.objects.filter(content_type__app_label__in=["inventory", "products"])
        )
        self.category = Category.objects.create(name="Electronics")
        self.supplier = Supplier.objects.create(name="Supplier A")
        self.product = Product.objects.create(
            sku="PRODUCT-001",
            name="Keyboard",
            category=self.category,
            supplier=self.supplier,
            cost_price=Decimal("40.00"),
            selling_price=Decimal("55.00"),
            quantity=10,
        )
        self.warehouse = Warehouse.objects.create(name="Main Warehouse")

    def test_inventory_api_requires_authentication(self):
        warehouse_response = self.client.get("/api/warehouses/")
        transaction_response = self.client.get("/api/stock-transactions/")

        self.assertEqual(warehouse_response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(transaction_response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_user_can_create_list_update_and_delete_warehouse(self):
        self.client.force_authenticate(user=self.user)

        create_response = self.client.post(
            "/api/warehouses/",
            {
                "name": "Secondary Warehouse",
                "address": "Da Nang",
                "phone": "0900000000",
                "manager_name": "Tran Van B",
                "is_active": True,
            },
            format="json",
        )

        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        warehouse_id = create_response.data["id"]
        self.assertEqual(create_response.data["stock_transactions_count"], 0)

        list_response = self.client.get("/api/warehouses/?search=Secondary")
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(list_response.data["count"], 1)

        update_response = self.client.patch(
            f"/api/warehouses/{warehouse_id}/",
            {"manager_name": "Le Van C", "is_active": False},
            format="json",
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data["manager_name"], "Le Van C")
        self.assertFalse(update_response.data["is_active"])

        delete_response = self.client.delete(f"/api/warehouses/{warehouse_id}/")
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Warehouse.objects.filter(id=warehouse_id).exists())

    def test_authenticated_user_can_create_import_transaction(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            "/api/stock-transactions/",
            {
                "warehouse": self.warehouse.id,
                "transaction_type": StockTransaction.TransactionType.IMPORT,
                "transaction_code": "IMPORT-001",
                "reason": "Initial import",
                "items": [
                    {
                        "product": self.product.id,
                        "quantity": 5,
                        "unit_price": "40.00",
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["created_by_username"], "inventory-manager")
        self.assertEqual(response.data["items"][0]["total_amount"], "200.00")

        self.product.refresh_from_db()
        self.assertEqual(self.product.quantity, 15)

    def test_authenticated_user_can_create_export_transaction(self):
        self.client.force_authenticate(user=self.user)
        WarehouseStock.objects.create(
            warehouse=self.warehouse,
            product=self.product,
            quantity=10,
        )

        response = self.client.post(
            "/api/stock-transactions/",
            {
                "warehouse": self.warehouse.id,
                "transaction_type": StockTransaction.TransactionType.EXPORT,
                "transaction_code": "EXPORT-001",
                "reason": "Customer order",
                "items": [
                    {
                        "product": self.product.id,
                        "quantity": 4,
                        "unit_price": "55.00",
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.product.refresh_from_db()
        self.assertEqual(self.product.quantity, 6)

    def test_export_transaction_rejects_insufficient_stock(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            "/api/stock-transactions/",
            {
                "warehouse": self.warehouse.id,
                "transaction_type": StockTransaction.TransactionType.EXPORT,
                "transaction_code": "EXPORT-TOO-MUCH",
                "items": [
                    {
                        "product": self.product.id,
                        "quantity": 11,
                        "unit_price": "55.00",
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        self.product.refresh_from_db()
        self.assertEqual(self.product.quantity, 10)

    def test_authenticated_user_can_list_stock_transaction_items(self):
        self.client.force_authenticate(user=self.user)
        stock_transaction = StockTransaction.objects.create(
            warehouse=self.warehouse,
            transaction_type=StockTransaction.TransactionType.IMPORT,
            transaction_code="IMPORT-ITEMS",
            created_by=self.user,
        )
        StockTransactionItem.objects.create(
            stock_transaction=stock_transaction,
            product=self.product,
            quantity=3,
            unit_price=Decimal("40.00"),
        )

        response = self.client.get(
            f"/api/stock-transaction-items/?stock_transaction={stock_transaction.id}"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["product"], self.product.id)
