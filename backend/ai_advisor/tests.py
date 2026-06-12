from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth.models import Permission, User
from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from categories.models import Category
from inventory.models import StockTransaction, StockTransactionItem, Warehouse, WarehouseStock
from products.models import Product
from ai_advisor.openai_client import OpenAIClientError


@override_settings(OPENAI_API_KEY="")
class InventoryAdviceAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="advisor", password="password123")
        self.user.user_permissions.add(
            *Permission.objects.filter(
                content_type__app_label__in=["products", "inventory"],
                codename__in=["view_product", "view_stocktransaction"],
            )
        )
        self.category = Category.objects.create(name="Electronics")
        self.warehouse = Warehouse.objects.create(name="Main Warehouse")

    def test_inventory_advice_requires_authentication(self):
        response = self.client.get("/api/ai/inventory-advice/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_inventory_advice_requires_view_permissions(self):
        user_without_permissions = User.objects.create_user(username="no-perms")
        self.client.force_authenticate(user=user_without_permissions)

        response = self.client.get("/api/ai/inventory-advice/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_low_stock_product_returns_recommendation(self):
        self.client.force_authenticate(user=self.user)
        product = Product.objects.create(
            sku="LOW-001",
            name="Low stock product",
            category=self.category,
            cost_price=Decimal("10.00"),
            selling_price=Decimal("15.00"),
            quantity=3,
            minimum_stock=10,
        )
        WarehouseStock.objects.create(warehouse=self.warehouse, product=product, quantity=3)
        transaction = StockTransaction.objects.create(
            warehouse=self.warehouse,
            transaction_type=StockTransaction.TransactionType.EXPORT,
            transaction_code="EXPORT-LOW",
            created_by=self.user,
        )
        StockTransactionItem.objects.create(
            stock_transaction=transaction,
            product=product,
            quantity=6,
            unit_price=Decimal("15.00"),
        )

        response = self.client.get("/api/ai/inventory-advice/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["summary"]["total_alerts"], 1)
        self.assertEqual(response.data["summary"]["high_priority"], 1)
        recommendation = response.data["recommendations"][0]
        self.assertEqual(recommendation["product_id"], product.id)
        self.assertEqual(recommendation["suggested_quantity"], 17)
        self.assertEqual(recommendation["warehouse_stocks"][0]["warehouse_name"], "Main Warehouse")

    def test_healthy_stock_product_is_not_recommended(self):
        self.client.force_authenticate(user=self.user)
        Product.objects.create(
            sku="OK-001",
            name="Healthy stock product",
            category=self.category,
            cost_price=Decimal("10.00"),
            selling_price=Decimal("15.00"),
            quantity=50,
            minimum_stock=10,
        )

        response = self.client.get("/api/ai/inventory-advice/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["summary"]["total_alerts"], 0)
        self.assertEqual(response.data["recommendations"], [])

    def test_fast_moving_product_near_stockout_returns_recommendation(self):
        self.client.force_authenticate(user=self.user)
        product = Product.objects.create(
            sku="FAST-001",
            name="Fast moving product",
            category=self.category,
            cost_price=Decimal("20.00"),
            selling_price=Decimal("28.00"),
            quantity=20,
            minimum_stock=10,
        )
        transaction = StockTransaction.objects.create(
            warehouse=self.warehouse,
            transaction_type=StockTransaction.TransactionType.EXPORT,
            transaction_code="EXPORT-FAST",
            created_by=self.user,
            created_at=timezone.now(),
        )
        StockTransactionItem.objects.create(
            stock_transaction=transaction,
            product=product,
            quantity=60,
            unit_price=Decimal("28.00"),
        )

        response = self.client.get("/api/ai/inventory-advice/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["summary"]["total_alerts"], 1)
        self.assertEqual(response.data["recommendations"][0]["priority"], "medium")


class InventoryAdviceOpenAITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="advisor-ai", password="password123")
        self.user.user_permissions.add(
            *Permission.objects.filter(
                content_type__app_label__in=["products", "inventory"],
                codename__in=["view_product", "view_stocktransaction"],
            )
        )
        self.category = Category.objects.create(name="Electronics")
        self.warehouse = Warehouse.objects.create(name="Main Warehouse")

    @override_settings(OPENAI_API_KEY="test-key", OPENAI_MODEL="gpt-test")
    @patch("ai_advisor.services.create_inventory_analysis")
    def test_openai_analysis_is_merged_into_recommendations(self, mock_create_inventory_analysis):
        self.client.force_authenticate(user=self.user)
        product = Product.objects.create(
            sku="AI-001",
            name="AI suggested product",
            category=self.category,
            cost_price=Decimal("10.00"),
            selling_price=Decimal("15.00"),
            quantity=2,
            minimum_stock=10,
        )
        mock_create_inventory_analysis.return_value = {
            "ai_summary": "AI nhận định cần nhập gấp sản phẩm AI-001.",
            "recommendations": [
                {
                    "product_id": product.id,
                    "ai_reason": "Tồn kho thấp và dưới ngưỡng an toàn.",
                    "risk": "Có nguy cơ hết hàng trong các đơn xuất tiếp theo.",
                    "suggested_action": "Tạo phiếu nhập ưu tiên trong ngày.",
                }
            ],
        }

        response = self.client.get("/api/ai/inventory-advice/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["meta"]["mode"], "openai")
        self.assertEqual(response.data["meta"]["provider"], "openai")
        self.assertEqual(response.data["meta"]["model"], "gpt-test")
        self.assertEqual(response.data["ai_summary"], "AI nhận định cần nhập gấp sản phẩm AI-001.")
        recommendation = response.data["recommendations"][0]
        self.assertEqual(recommendation["ai_reason"], "Tồn kho thấp và dưới ngưỡng an toàn.")
        self.assertEqual(recommendation["risk"], "Có nguy cơ hết hàng trong các đơn xuất tiếp theo.")
        self.assertEqual(recommendation["suggested_action"], "Tạo phiếu nhập ưu tiên trong ngày.")
        mock_create_inventory_analysis.assert_called_once()

    @override_settings(OPENAI_API_KEY="test-key", OPENAI_MODEL="gpt-test")
    @patch("ai_advisor.services.create_inventory_analysis")
    def test_openai_failure_returns_rule_based_advice_with_reason(self, mock_create_inventory_analysis):
        self.client.force_authenticate(user=self.user)
        Product.objects.create(
            sku="FAIL-001",
            name="Fallback product",
            category=self.category,
            cost_price=Decimal("10.00"),
            selling_price=Decimal("15.00"),
            quantity=2,
            minimum_stock=10,
        )
        mock_create_inventory_analysis.side_effect = OpenAIClientError("HTTP 401: invalid api key")

        response = self.client.get("/api/ai/inventory-advice/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["meta"]["mode"], "rule_based")
        self.assertIn("ai_fallback", response.data["meta"])
        self.assertEqual(response.data["meta"]["ai_fallback_reason"], "HTTP 401: invalid api key")
