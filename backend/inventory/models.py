from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from products.models import Product


class Warehouse(models.Model):
    name = models.CharField(max_length=255)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    manager_name = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "warehouses"
        ordering = ["name"]

    def __str__(self):
        return self.name


class WarehouseStock(models.Model):
    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.CASCADE,
        related_name="stock_items",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="warehouse_stocks",
    )
    quantity = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "warehouse_stocks"
        ordering = ["warehouse__name", "product__name"]
        constraints = [
            models.UniqueConstraint(
                fields=["warehouse", "product"],
                name="unique_product_per_warehouse",
            )
        ]

    def __str__(self):
        return f"{self.warehouse} - {self.product}: {self.quantity}"


class StockTransaction(models.Model):
    class TransactionType(models.TextChoices):
        IMPORT = "import", "Import"
        EXPORT = "export", "Export"
        ADJUSTMENT = "adjustment", "Adjustment"

    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.PROTECT,
        related_name="stock_transactions",
    )
    transaction_type = models.CharField(
        max_length=20,
        choices=TransactionType.choices,
    )
    transaction_code = models.CharField(max_length=100, unique=True)
    reason = models.CharField(max_length=255, blank=True)
    note = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="stock_transactions",
        blank=True,
        null=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "stock_transactions"
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return self.transaction_code


class StockTransactionItem(models.Model):
    stock_transaction = models.ForeignKey(
        StockTransaction,
        on_delete=models.CASCADE,
        related_name="items",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="stock_transaction_items",
    )
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    total_amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        editable=False,
    )
    note = models.TextField(blank=True)

    class Meta:
        db_table = "stock_transaction_items"
        constraints = [
            models.UniqueConstraint(
                fields=["stock_transaction", "product"],
                name="unique_product_per_stock_transaction",
            )
        ]

    def save(self, *args, **kwargs):
        self.total_amount = self.quantity * self.unit_price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.stock_transaction} - {self.product}"
