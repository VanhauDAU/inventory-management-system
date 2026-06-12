from django.db.models import ProtectedError
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Category
from .serializers import CategorySerializer


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
