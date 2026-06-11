from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Product
from .serializers import ProductSerializer


<<<<<<< HEAD
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
=======
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related("category").all().order_by("id")
>>>>>>> feature/frontend-crud
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
<<<<<<< HEAD
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
=======
        filters.OrderingFilter,
    ]
    filterset_fields = ["category"]
    search_fields = ["name", "description"]
    ordering_fields = ["id", "name", "price", "quantity", "created_at", "updated_at"]
>>>>>>> feature/frontend-crud
