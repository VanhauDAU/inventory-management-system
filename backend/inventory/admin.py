from django.contrib import admin

from .models import StockTransaction, StockTransactionItem, Warehouse


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ("name", "manager_name", "phone", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name", "address", "phone", "manager_name")


class StockTransactionItemInline(admin.TabularInline):
    model = StockTransactionItem
    extra = 0


@admin.register(StockTransaction)
class StockTransactionAdmin(admin.ModelAdmin):
    list_display = (
        "transaction_code",
        "transaction_type",
        "warehouse",
        "created_by",
        "created_at",
    )
    list_filter = ("transaction_type", "warehouse")
    search_fields = ("transaction_code", "reason", "note")
    inlines = [StockTransactionItemInline]


@admin.register(StockTransactionItem)
class StockTransactionItemAdmin(admin.ModelAdmin):
    list_display = (
        "stock_transaction",
        "product",
        "quantity",
        "unit_price",
        "total_amount",
    )
    search_fields = ("stock_transaction__transaction_code", "product__name", "product__sku")
