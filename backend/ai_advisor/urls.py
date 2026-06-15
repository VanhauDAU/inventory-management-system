from django.urls import path

from .views import ChatAPIView, InventoryAdviceAPIView


urlpatterns = [
    path("chat/", ChatAPIView.as_view(), name="chat"),
    path("inventory-advice/", InventoryAdviceAPIView.as_view(), name="inventory-advice"),
]
