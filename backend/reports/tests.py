from decimal import Decimal

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from categories.models import Category
from inventory.models import StockTransaction, StockTransactionItem, Warehouse
from products.models import Product


class InventoryReportAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="report-manager",
            password="managerpass123",
        )
        self.category = Category.objects.create(name="Electronics")
        self.warehouse = Warehouse.objects.create(name="Main Warehouse")
        self.product = Product.objects.create(
            sku="KEYBOARD-001",
            name="Keyboard",
            category=self.category,
            cost_price=Decimal("40.00"),
            selling_price=Decimal("55.00"),
            quantity=8,
            minimum_stock=10,
        )
        self.import_transaction = StockTransaction.objects.create(
            warehouse=self.warehouse,
            transaction_type=StockTransaction.TransactionType.IMPORT,
            transaction_code="IMPORT-001",
            created_by=self.user,
        )
        self.export_transaction = StockTransaction.objects.create(
            warehouse=self.warehouse,
            transaction_type=StockTransaction.TransactionType.EXPORT,
            transaction_code="EXPORT-001",
            created_by=self.user,
        )
        StockTransactionItem.objects.create(
            stock_transaction=self.import_transaction,
            product=self.product,
            quantity=5,
            unit_price=Decimal("40.00"),
        )
        StockTransactionItem.objects.create(
            stock_transaction=self.export_transaction,
            product=self.product,
            quantity=2,
            unit_price=Decimal("55.00"),
        )

    def test_inventory_reports_require_authentication(self):
        response = self.client.get("/api/reports/inventory/summary/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_user_can_view_inventory_summary(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get("/api/reports/inventory/summary/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_products"], 1)
        self.assertEqual(response.data["total_quantity"], 8)
        self.assertEqual(response.data["total_stock_value"], "320.00")
        self.assertEqual(response.data["low_stock_products"], 1)
        self.assertEqual(response.data["warehouses_count"], 1)
        self.assertEqual(response.data["import_transactions"], 1)
        self.assertEqual(response.data["export_transactions"], 1)
        self.assertEqual(response.data["adjustment_transactions"], 0)

    def test_authenticated_user_can_view_import_and_export_reports(self):
        self.client.force_authenticate(user=self.user)

        import_response = self.client.get("/api/reports/inventory/imports/")
        export_response = self.client.get("/api/reports/inventory/exports/")

        self.assertEqual(import_response.status_code, status.HTTP_200_OK)
        self.assertEqual(import_response.data["count"], 1)
        self.assertEqual(import_response.data["results"][0]["transaction_code"], "IMPORT-001")

        self.assertEqual(export_response.status_code, status.HTTP_200_OK)
        self.assertEqual(export_response.data["count"], 1)
        self.assertEqual(export_response.data["results"][0]["transaction_code"], "EXPORT-001")
