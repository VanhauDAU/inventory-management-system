from django.db.models import ProtectedError
from drf_spectacular.utils import OpenApiResponse, extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Category
from .serializers import CategorySerializer


@extend_schema_view(
    list=extend_schema(
        tags=["Categories"],
        summary="List product categories",
        description="Return product categories with parent/category tree fields and product counts.",
    ),
    retrieve=extend_schema(
        tags=["Categories"],
        summary="Retrieve product category",
        description="Return one category with parent, child count, product count, and status.",
    ),
    create=extend_schema(
        tags=["Categories"],
        summary="Create product category",
        description="Create a category. Parent can be null for a root category.",
    ),
    update=extend_schema(
        tags=["Categories"],
        summary="Replace product category",
        description="Replace all editable category fields.",
    ),
    partial_update=extend_schema(
        tags=["Categories"],
        summary="Update product category",
        description="Partially update category name, description, parent, or status.",
    ),
    destroy=extend_schema(
        tags=["Categories"],
        summary="Delete product category",
        description=(
            "Delete a category only when it has no products. "
            "If products still reference the category, the API returns HTTP 409."
        ),
        responses={
            204: OpenApiResponse(description="Category deleted."),
            409: OpenApiResponse(description="Category cannot be deleted because it is in use."),
        },
    ),
)
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by("id")
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def destroy(self, request, *args, **kwargs):
        category = self.get_object()

        if category.products.exists():
            return Response(
                {
                    "detail": (
                        "Không thể xóa danh mục vì đang có sản phẩm. "
                        "Hãy chuyển sản phẩm sang danh mục khác hoặc tắt trạng thái danh mục."
                    )
                },
                status=status.HTTP_409_CONFLICT,
            )

        try:
            category.delete()
        except ProtectedError:
            return Response(
                {
                    "detail": (
                        "Không thể xóa danh mục vì đang được sử dụng bởi dữ liệu nghiệp vụ khác."
                    )
                },
                status=status.HTTP_409_CONFLICT,
            )

        return Response(status=status.HTTP_204_NO_CONTENT)
