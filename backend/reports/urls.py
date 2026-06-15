from django.urls import path

from .views import (
    InventoryExportReportAPIView,
    InventoryImportReportAPIView,
    InventoryLowStockReportAPIView,
    InventorySummaryAPIView,
    InventoryValueReportAPIView,
    StockMovementReportAPIView,
)

urlpatterns = [
    path("inventory/summary/", InventorySummaryAPIView.as_view(), name="inventory-summary"),
    path("inventory/low-stock/", InventoryLowStockReportAPIView.as_view(), name="inventory-low-stock"),
    path("inventory/value/", InventoryValueReportAPIView.as_view(), name="inventory-value"),
    path("inventory/transactions/", StockMovementReportAPIView.as_view(), name="inventory-transactions"),
    path("inventory/imports/", InventoryImportReportAPIView.as_view(), name="inventory-imports"),
    path("inventory/exports/", InventoryExportReportAPIView.as_view(), name="inventory-exports"),
    path("summary/", InventorySummaryAPIView.as_view(), name="reports-summary"),
    path("low-stock/", InventoryLowStockReportAPIView.as_view(), name="reports-low-stock"),
    path("inventory-value/", InventoryValueReportAPIView.as_view(), name="reports-inventory-value"),
    path("stock-movement/", StockMovementReportAPIView.as_view(), name="reports-stock-movement"),
]
