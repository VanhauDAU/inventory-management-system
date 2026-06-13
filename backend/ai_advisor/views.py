from drf_spectacular.utils import extend_schema
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import build_inventory_advice


class CanViewInventoryAdvice(BasePermission):
    message = "Bạn cần quyền xem sản phẩm và giao dịch kho để sử dụng gợi ý nhập hàng AI."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.has_perms(
                [
                    "products.view_product",
                    "inventory.view_stocktransaction",
                ]
            )
        )


class InventoryAdviceAPIView(APIView):
    permission_classes = [IsAuthenticated, CanViewInventoryAdvice]

    @extend_schema(tags=["AI Advisor"], summary="Get AI inventory restock advice")
    def get(self, request):
        return Response(build_inventory_advice())
