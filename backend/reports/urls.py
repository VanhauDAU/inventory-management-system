from django.urls import path

from .views import (
    InventoryExportReportAPIView,
    InventoryImportReportAPIView,
    InventorySummaryAPIView,
)

urlpatterns = [
    path("inventory/summary/", InventorySummaryAPIView.as_view(), name="inventory-summary"),
    path("inventory/imports/", InventoryImportReportAPIView.as_view(), name="inventory-imports"),
    path("inventory/exports/", InventoryExportReportAPIView.as_view(), name="inventory-exports"),
]
