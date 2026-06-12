from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import ProtectedError
from drf_spectacular.utils import OpenApiResponse, extend_schema, extend_schema_view
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import ViewDjangoModelPermissions
from .models import StockTransaction, StockTransactionItem, Warehouse, WarehouseStock
from .serializers import (
    StockTransactionItemSerializer,
    StockTransactionSerializer,
    WarehouseSerializer,
    WarehouseStockSerializer,
)


@extend_schema_view(
    list=extend_schema(
        tags=["Warehouses"],
        summary="List warehouses",
        description=(
            "Return warehouses with aggregated inventory information: "
            "number of product kinds, total quantity, and stock transaction count."
        ),
    ),
    retrieve=extend_schema(
        tags=["Warehouses"],
        summary="Retrieve warehouse",
        description="Return one warehouse with aggregated stock counters.",
    ),
    create=extend_schema(
        tags=["Warehouses"],
        summary="Create warehouse",
        description="Create a new warehouse. Inventory quantities are managed through stock transactions.",
    ),
    update=extend_schema(
        tags=["Warehouses"],
        summary="Replace warehouse",
        description="Replace all editable warehouse fields.",
    ),
    partial_update=extend_schema(
        tags=["Warehouses"],
        summary="Update warehouse",
        description="Partially update warehouse information such as name, address, manager, phone, or status.",
    ),
    destroy=extend_schema(
        tags=["Warehouses"],
        summary="Delete warehouse",
        description=(
            "Delete a warehouse only when it has no stock transactions and no remaining stock. "
            "If the warehouse has transaction history or stock quantity, the API returns HTTP 409."
        ),
        responses={
            204: OpenApiResponse(description="Warehouse deleted."),
            409: OpenApiResponse(
                description=(
                    "Warehouse cannot be deleted because it has stock transactions, "
                    "remaining stock, or related business data."
                )
            ),
        },
    ),
)
class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.prefetch_related("stock_items").all().order_by("id")
    serializer_class = WarehouseSerializer
    permission_classes = [ViewDjangoModelPermissions]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["is_active"]
    search_fields = ["name", "address", "phone", "manager_name"]
    ordering_fields = ["id", "name", "created_at", "updated_at"]

    @extend_schema(
        tags=["Warehouses"],
        summary="List stock items in a warehouse",
        description=(
            "Return current positive stock quantities for products in the selected warehouse. "
            "This endpoint answers: which products are currently in this warehouse and how many."
        ),
        responses={200: WarehouseStockSerializer(many=True)},
    )
    @action(detail=True, methods=["get"], url_path="stocks")
    def stocks(self, request, pk=None):
        warehouse = self.get_object()
        queryset = (
            WarehouseStock.objects.select_related(
                "warehouse",
                "product",
                "product__category",
                "product__supplier",
            )
            .filter(warehouse=warehouse, quantity__gt=0)
            .order_by("product__name")
        )

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = WarehouseStockSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = WarehouseStockSerializer(queryset, many=True)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        warehouse = self.get_object()

        if warehouse.stock_transactions.exists():
            return Response(
                {
                    "detail": (
                        "Không thể xóa kho vì đã có phiếu nhập/xuất/điều chỉnh. "
                        "Hãy tắt trạng thái kho nếu không còn sử dụng."
                    )
                },
                status=status.HTTP_409_CONFLICT,
            )

        if warehouse.stock_items.filter(quantity__gt=0).exists():
            return Response(
                {
                    "detail": (
                        "Không thể xóa kho vì vẫn còn sản phẩm tồn. "
                        "Hãy xuất/chuyển/điều chỉnh hết tồn kho trước."
                    )
                },
                status=status.HTTP_409_CONFLICT,
            )

        try:
            warehouse.delete()
        except ProtectedError:
            return Response(
                {"detail": "Không thể xóa kho vì đang được sử dụng bởi dữ liệu khác."},
                status=status.HTTP_409_CONFLICT,
            )

        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema_view(
    list=extend_schema(
        tags=["Warehouse Stocks"],
        summary="List warehouse stock records",
        description=(
            "Read-only endpoint for per-warehouse product quantities. "
            "Filter by warehouse or product to inspect where products are stored."
        ),
    ),
    retrieve=extend_schema(
        tags=["Warehouse Stocks"],
        summary="Retrieve warehouse stock record",
        description="Return one per-warehouse stock record with warehouse and product details.",
    ),
)
class WarehouseStockViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = (
        WarehouseStock.objects.select_related(
            "warehouse",
            "product",
            "product__category",
            "product__supplier",
        )
        .all()
        .order_by("warehouse__name", "product__name")
    )
    serializer_class = WarehouseStockSerializer
    permission_classes = [ViewDjangoModelPermissions]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["warehouse", "product"]
    search_fields = ["warehouse__name", "product__sku", "product__name"]
    ordering_fields = ["id", "quantity", "updated_at"]


@extend_schema_view(
    list=extend_schema(
        tags=["Stock Transactions"],
        summary="List stock transactions",
        description="Return import, export, and adjustment transactions with their item lines.",
    ),
    retrieve=extend_schema(
        tags=["Stock Transactions"],
        summary="Retrieve stock transaction",
        description="Return one stock transaction with warehouse, creator, and item details.",
    ),
    create=extend_schema(
        tags=["Stock Transactions"],
        summary="Create stock transaction",
        description=(
            "Create an import, export, or adjustment transaction. "
            "The API updates both the global product quantity and the per-warehouse stock quantity."
        ),
    ),
    update=extend_schema(
        tags=["Stock Transactions"],
        summary="Replace stock transaction metadata",
        description="Update transaction metadata. Item lines cannot be changed after creation.",
    ),
    partial_update=extend_schema(
        tags=["Stock Transactions"],
        summary="Update stock transaction metadata",
        description="Partially update transaction metadata. Item lines cannot be changed after creation.",
    ),
    destroy=extend_schema(
        tags=["Stock Transactions"],
        summary="Delete stock transaction",
        description="Delete a stock transaction record. Use with care because stock changes are applied at creation time.",
    ),
)
class StockTransactionViewSet(viewsets.ModelViewSet):
    queryset = (
        StockTransaction.objects.select_related("warehouse", "created_by")
        .prefetch_related("items__product__category", "items__product__supplier")
        .all()
        .order_by("-created_at", "-id")
    )
    serializer_class = StockTransactionSerializer
    permission_classes = [ViewDjangoModelPermissions]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["warehouse", "transaction_type", "created_by"]
    search_fields = ["transaction_code", "reason", "note"]
    ordering_fields = ["id", "transaction_code", "transaction_type", "created_at", "updated_at"]


@extend_schema_view(
    list=extend_schema(
        tags=["Stock Transaction Items"],
        summary="List stock transaction items",
        description="Read-only list of transaction item lines with product details.",
    ),
    retrieve=extend_schema(
        tags=["Stock Transaction Items"],
        summary="Retrieve stock transaction item",
        description="Return one transaction item line.",
    ),
)
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
    permission_classes = [ViewDjangoModelPermissions]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["stock_transaction", "product"]
    search_fields = [
        "stock_transaction__transaction_code",
        "product__sku",
        "product__name",
        "note",
    ]
    ordering_fields = ["id", "quantity", "unit_price", "total_amount"]
