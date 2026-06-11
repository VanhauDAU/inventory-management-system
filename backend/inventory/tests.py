from decimal import Decimal

from django.contrib.auth.models import User
from django.test import TestCase

from categories.models import Category
from products.models import Product
from suppliers.models import Supplier

from .models import StockTransaction, StockTransactionItem, Warehouse


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
