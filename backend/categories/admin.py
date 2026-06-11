from django.contrib import admin
<<<<<<< HEAD

from .models import Category


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "parent", "is_active", "updated_at")
    list_filter = ("is_active",)
    search_fields = ("name", "description")
=======
from .models import Category
# Register your models here.
admin.site.register(Category)
>>>>>>> feature/frontend-crud
