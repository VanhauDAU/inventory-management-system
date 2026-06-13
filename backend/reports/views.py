from decimal import Decimal

from django.db.models import Count, DecimalField, ExpressionWrapper, F, Q, Sum
from rest_framework import generics
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from inventory.models import StockTransaction, Warehouse
from inventory.serializers import StockTransactionSerializer
from products.models import Product

from .serializers import InventorySummarySerializer


class HasRequiredModelPermissions(BasePermission):
    required_permissions = []

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        required_permissions = getattr(view, "required_permissions", self.required_permissions)
        return request.user.has_perms(required_permissions)


class InventorySummaryAPIView(APIView):
    permission_classes = [IsAuthenticated, HasRequiredModelPermissions]
    required_permissions = [
        "products.view_product",
        "inventory.view_warehouse",
        "inventory.view_stocktransaction",
    ]

    def get(self, request):
        stock_value_expression = ExpressionWrapper(
            F("quantity") * F("cost_price"),
            output_field=DecimalField(max_digits=14, decimal_places=2),
        )
        product_summary = Product.objects.aggregate(
            total_products=Count("id"),
            total_quantity=Sum("quantity"),
            total_stock_value=Sum(stock_value_expression),
            low_stock_products=Count(
                "id",
                filter=Q(quantity__lte=F("minimum_stock")),
            ),
        )
        transaction_summary = StockTransaction.objects.aggregate(
            import_transactions=Count(
                "id",
                filter=Q(transaction_type=StockTransaction.TransactionType.IMPORT),
            ),
            export_transactions=Count(
                "id",
                filter=Q(transaction_type=StockTransaction.TransactionType.EXPORT),
            ),
            adjustment_transactions=Count(
                "id",
                filter=Q(transaction_type=StockTransaction.TransactionType.ADJUSTMENT),
            ),
        )
        data = {
            "total_products": product_summary["total_products"] or 0,
            "total_quantity": product_summary["total_quantity"] or 0,
            "total_stock_value": product_summary["total_stock_value"] or Decimal("0.00"),
            "low_stock_products": product_summary["low_stock_products"] or 0,
            "warehouses_count": Warehouse.objects.count(),
            **transaction_summary,
        }
        serializer = InventorySummarySerializer(data)
        return Response(serializer.data)


class InventoryImportReportAPIView(generics.ListAPIView):
    serializer_class = StockTransactionSerializer
    permission_classes = [IsAuthenticated, HasRequiredModelPermissions]
    required_permissions = ["inventory.view_stocktransaction"]

    def get_queryset(self):
        return (
            StockTransaction.objects.select_related("warehouse", "created_by")
            .prefetch_related("items__product__category", "items__product__supplier")
            .filter(transaction_type=StockTransaction.TransactionType.IMPORT)
            .order_by("-created_at", "-id")
        )


class InventoryExportReportAPIView(generics.ListAPIView):
    serializer_class = StockTransactionSerializer
    permission_classes = [IsAuthenticated, HasRequiredModelPermissions]
    required_permissions = ["inventory.view_stocktransaction"]

    def get_queryset(self):
        return (
            StockTransaction.objects.select_related("warehouse", "created_by")
            .prefetch_related("items__product__category", "items__product__supplier")
            .filter(transaction_type=StockTransaction.TransactionType.EXPORT)
            .order_by("-created_at", "-id")
        )
