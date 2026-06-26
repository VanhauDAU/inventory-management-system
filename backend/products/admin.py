from django.contrib import admin

from .models import Product, ProductImage


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 0
    fields = ("image", "alt_text", "is_primary", "sort_order")


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "sku",
        "name",
        "category",
        "supplier",
        "selling_price",
        "quantity",
        "status",
    )
    list_filter = ("status", "category", "supplier")
    search_fields = ("sku", "barcode", "name", "description")
    inlines = [ProductImageInline]


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ("product", "image", "is_primary", "sort_order", "created_at")
    list_filter = ("is_primary",)
    search_fields = ("product__sku", "product__name", "alt_text")
