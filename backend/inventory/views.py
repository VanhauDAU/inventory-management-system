from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.permissions import IsAuthenticated

from .models import StockTransaction, StockTransactionItem, Warehouse
from .serializers import (
    StockTransactionItemSerializer,
    StockTransactionSerializer,
    WarehouseSerializer,
)


class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.all().order_by("id")
    serializer_class = WarehouseSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["is_active"]
    search_fields = ["name", "address", "phone", "manager_name"]
    ordering_fields = ["id", "name", "created_at", "updated_at"]


class StockTransactionViewSet(viewsets.ModelViewSet):
    queryset = (
        StockTransaction.objects.select_related("warehouse", "created_by")
        .prefetch_related("items__product__category", "items__product__supplier")
        .all()
        .order_by("-created_at", "-id")
    )
    serializer_class = StockTransactionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["warehouse", "transaction_type", "created_by"]
    search_fields = ["transaction_code", "reason", "note"]
    ordering_fields = ["id", "transaction_code", "transaction_type", "created_at", "updated_at"]


class StockTransactionItemViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = (
        StockTransactionItem.objects.select_related(
            "stock_transaction",
            "product",
            "product__category",
            "product__supplier",
        )
        .all()
        .order_by("id")
    )
    serializer_class = StockTransactionItemSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["stock_transaction", "product"]
    search_fields = [
        "stock_transaction__transaction_code",
        "product__sku",
        "product__name",
        "note",
    ]
    ordering_fields = ["id", "quantity", "unit_price", "total_amount"]
