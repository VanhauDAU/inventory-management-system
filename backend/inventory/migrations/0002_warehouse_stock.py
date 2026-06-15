# Generated manually for per-warehouse stock tracking

import django.db.models.deletion
from django.db import migrations, models


def populate_warehouse_stocks(apps, schema_editor):
    StockTransaction = apps.get_model("inventory", "StockTransaction")
    StockTransactionItem = apps.get_model("inventory", "StockTransactionItem")
    WarehouseStock = apps.get_model("inventory", "WarehouseStock")

    transactions = StockTransaction.objects.order_by("created_at", "id")
    for stock_transaction in transactions.iterator():
        items = StockTransactionItem.objects.filter(
            stock_transaction=stock_transaction
        ).order_by("id")

        for item in items:
            stock, _ = WarehouseStock.objects.get_or_create(
                warehouse_id=stock_transaction.warehouse_id,
                product_id=item.product_id,
                defaults={"quantity": 0},
            )

            if stock_transaction.transaction_type == "import":
                stock.quantity += item.quantity
            elif stock_transaction.transaction_type == "export":
                stock.quantity = max(0, stock.quantity - item.quantity)
            elif stock_transaction.transaction_type == "adjustment":
                stock.quantity = item.quantity

            stock.save(update_fields=["quantity", "updated_at"])


class Migration(migrations.Migration):

    dependencies = [
        ("inventory", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="WarehouseStock",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("quantity", models.PositiveIntegerField(default=0)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "product",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="warehouse_stocks",
                        to="products.product",
                    ),
                ),
                (
                    "warehouse",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="stock_items",
                        to="inventory.warehouse",
                    ),
                ),
            ],
            options={
                "db_table": "warehouse_stocks",
                "ordering": ["warehouse__name", "product__name"],
            },
        ),
        migrations.AddConstraint(
            model_name="warehousestock",
            constraint=models.UniqueConstraint(
                fields=("warehouse", "product"),
                name="unique_product_per_warehouse",
            ),
        ),
        migrations.RunPython(
            populate_warehouse_stocks,
            migrations.RunPython.noop,
        ),
    ]
