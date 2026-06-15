from decimal import Decimal
from datetime import datetime, timezone as datetime_timezone

from django.contrib.auth.models import Permission, User
from rest_framework import status
from rest_framework.test import APITestCase

from categories.models import Category
from inventory.models import (
    StockTransaction,
    StockTransactionItem,
    Warehouse,
    WarehouseStock,
)
from products.models import Product


class InventoryReportAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="report-manager",
            password="managerpass123",
        )
        self.user.user_permissions.add(
            *Permission.objects.filter(content_type__app_label__in=["inventory", "products"])
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
        self.healthy_product = Product.objects.create(
            sku="MOUSE-001",
            name="Mouse",
            category=self.category,
            cost_price=Decimal("20.00"),
            selling_price=Decimal("35.00"),
            quantity=15,
            minimum_stock=5,
        )
        WarehouseStock.objects.create(
            warehouse=self.warehouse,
            product=self.product,
            quantity=8,
        )
        WarehouseStock.objects.create(
            warehouse=self.warehouse,
            product=self.healthy_product,
            quantity=15,
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
        StockTransaction.objects.filter(id=self.import_transaction.id).update(
            created_at=datetime(2026, 6, 1, 9, 0, tzinfo=datetime_timezone.utc)
        )
        StockTransaction.objects.filter(id=self.export_transaction.id).update(
            created_at=datetime(2026, 6, 10, 9, 0, tzinfo=datetime_timezone.utc)
        )
        self.import_transaction.refresh_from_db()
        self.export_transaction.refresh_from_db()
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
        self.assertEqual(response.data["total_products"], 2)
        self.assertEqual(response.data["total_quantity"], 23)
        self.assertEqual(response.data["total_stock_value"], "620.00")
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

    def test_authenticated_user_can_view_low_stock_report(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get("/api/reports/inventory/low-stock/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        item = response.data["results"][0]
        self.assertEqual(item["sku"], "KEYBOARD-001")
        self.assertEqual(item["quantity"], 8)
        self.assertEqual(item["minimum_stock"], 10)
        self.assertEqual(item["missing_quantity"], 2)
        self.assertEqual(item["stock_cost_value"], "320.00")

    def test_authenticated_user_can_view_inventory_value_report(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get("/api/reports/inventory/value/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["products_count"], 2)
        self.assertEqual(response.data["total_quantity"], 23)
        self.assertEqual(response.data["total_cost_value"], "620.00")
        self.assertEqual(response.data["total_selling_value"], "965.00")
        self.assertEqual(response.data["by_category"][0]["name"], "Electronics")
        self.assertEqual(response.data["by_category"][0]["total_cost_value"], "620.00")
        self.assertEqual(response.data["by_warehouse"][0]["name"], "Main Warehouse")
        self.assertEqual(response.data["by_warehouse"][0]["total_quantity"], 23)

    def test_authenticated_user_can_filter_stock_movement_report(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(
            "/api/reports/inventory/transactions/"
            f"?warehouse={self.warehouse.id}"
            "&transaction_type=export"
            "&date_from=2026-06-05"
            "&date_to=2026-06-30"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["transaction_code"], "EXPORT-001")

    def test_legacy_report_urls_are_available(self):
        self.client.force_authenticate(user=self.user)

        low_stock_response = self.client.get("/api/reports/low-stock/")
        value_response = self.client.get("/api/reports/inventory-value/")
        movement_response = self.client.get("/api/reports/stock-movement/")

        self.assertEqual(low_stock_response.status_code, status.HTTP_200_OK)
        self.assertEqual(value_response.status_code, status.HTTP_200_OK)
        self.assertEqual(movement_response.status_code, status.HTTP_200_OK)
