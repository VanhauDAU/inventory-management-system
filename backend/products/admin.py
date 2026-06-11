from django.contrib import admin
<<<<<<< HEAD

from .models import Product


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
=======
from .models import Product

# Register your models here.
admin.site.register(Product)
>>>>>>> feature/frontend-crud
