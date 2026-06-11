import django_filters
from django.db import models
from django.db.models import ProtectedError
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
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


class ProductFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(field_name="selling_price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="selling_price", lookup_expr="lte")
    min_quantity = django_filters.NumberFilter(field_name="quantity", lookup_expr="gte")
    max_quantity = django_filters.NumberFilter(field_name="quantity", lookup_expr="lte")
    low_stock = django_filters.BooleanFilter(method="filter_low_stock")

    class Meta:
        model = Product
        fields = ["category", "supplier", "status"]

    def filter_low_stock(self, queryset, name, value):
        if not value:
            return queryset

        return queryset.filter(quantity__lte=models.F("minimum_stock"))


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related("category", "supplier").all().order_by("id")
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        ProductOrderingFilter,
    ]
    filterset_class = ProductFilter
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

    def destroy(self, request, *args, **kwargs):
        product = self.get_object()
        try:
            product.delete()
        except ProtectedError:
            return Response(
                {
                    "detail": (
                        "Không thể xóa sản phẩm vì đã được sử dụng trong phiếu kho "
                        "hoặc dữ liệu nghiệp vụ khác. Hãy chuyển trạng thái sản phẩm "
                        "sang inactive/discontinued nếu không còn kinh doanh."
                    )
                },
                status=status.HTTP_409_CONFLICT,
            )

        return Response(status=status.HTTP_204_NO_CONTENT)

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
