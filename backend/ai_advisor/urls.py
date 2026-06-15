from django.urls import path

from .views import InventoryAdviceAPIView


urlpatterns = [
    path("inventory-advice/", InventoryAdviceAPIView.as_view(), name="inventory-advice"),
]
