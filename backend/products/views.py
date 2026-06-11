from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from inventory.models import StockTransactionItem
from inventory.serializers import StockTransactionItemSerializer

from .models import Product
from .serializers import ProductSerializer


class ProductOrderingFilter(filters.OrderingFilter):
    def get_ordering(self, request, queryset, view):
        ordering = super().get_ordering(request, queryset, view)
        if not ordering:
            return ordering

        return [
            "-selling_price" if field == "-price" else
            "selling_price" if field == "price" else field
            for field in ordering
        ]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related("category", "supplier").all().order_by("id")
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        ProductOrderingFilter,
    ]
    filterset_fields = ["category", "supplier", "status"]
    search_fields = ["sku", "barcode", "name", "description"]
    ordering_fields = [
        "id",
        "sku",
        "name",
        "price",
        "selling_price",
        "cost_price",
        "quantity",
        "minimum_stock",
        "created_at",
        "updated_at",
    ]

    @action(detail=True, methods=["get"], url_path="stock-history")
    def stock_history(self, request, pk=None):
        product = self.get_object()
        queryset = (
            StockTransactionItem.objects.select_related(
                "stock_transaction",
                "product",
                "product__category",
                "product__supplier",
            )
            .filter(product=product)
            .order_by("-stock_transaction__created_at", "-id")
        )

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = StockTransactionItemSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = StockTransactionItemSerializer(queryset, many=True)
        return Response(serializer.data)
