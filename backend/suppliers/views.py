from django.db.models import ProtectedError
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import OpenApiResponse, extend_schema, extend_schema_view
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from products.serializers import ProductSerializer
from .models import Supplier
from .serializers import SupplierSerializer


@extend_schema_view(
    list=extend_schema(
        tags=["Suppliers"],
        summary="List suppliers",
        description=(
            "Return suppliers/distributors with contact information, status, tax code, "
            "and linked product count. Supports search, status filter, ordering, and pagination."
        ),
    ),
    retrieve=extend_schema(
        tags=["Suppliers"],
        summary="Retrieve supplier",
        description="Return one supplier with contact information and linked product count.",
    ),
    create=extend_schema(
        tags=["Suppliers"],
        summary="Create supplier",
        description="Create a supplier/distributor. Supplier name and tax code are validated for duplicates.",
    ),
    update=extend_schema(
        tags=["Suppliers"],
        summary="Replace supplier",
        description="Replace all editable supplier fields.",
    ),
    partial_update=extend_schema(
        tags=["Suppliers"],
        summary="Update supplier",
        description="Partially update supplier contact, address, tax code, note, or status.",
    ),
    destroy=extend_schema(
        tags=["Suppliers"],
        summary="Delete supplier",
        description=(
            "Delete a supplier only when no product references it. "
            "If products still use this supplier, the API returns HTTP 409."
        ),
        responses={
            204: OpenApiResponse(description="Supplier deleted."),
            409: OpenApiResponse(description="Supplier cannot be deleted because it is in use."),
        },
    ),
)
class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all().order_by("id")
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["is_active"]
    search_fields = ["name", "contact_name", "phone", "email", "address", "tax_code", "note"]
    ordering_fields = ["id", "name", "created_at", "updated_at"]

    @extend_schema(
        tags=["Suppliers"],
        summary="List supplier products",
        description="Return products currently linked to the selected supplier.",
        responses={200: ProductSerializer(many=True)},
    )
    @action(detail=True, methods=["get"], url_path="products")
    def products(self, request, pk=None):
        supplier = self.get_object()
        queryset = supplier.products.select_related("category", "supplier").all().order_by("name")

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = ProductSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = ProductSerializer(queryset, many=True)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        supplier = self.get_object()

        if supplier.products.exists():
            return Response(
                {
                    "detail": (
                        "Không thể xóa nhà phân phối vì đang có sản phẩm liên kết. "
                        "Hãy chuyển sản phẩm sang nhà phân phối khác hoặc tắt trạng thái nhà phân phối."
                    )
                },
                status=status.HTTP_409_CONFLICT,
            )

        try:
            supplier.delete()
        except ProtectedError:
            return Response(
                {"detail": "Không thể xóa nhà phân phối vì đang được sử dụng bởi dữ liệu khác."},
                status=status.HTTP_409_CONFLICT,
            )

        return Response(status=status.HTTP_204_NO_CONTENT)
