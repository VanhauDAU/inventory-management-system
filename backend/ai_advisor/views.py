from django.conf import settings
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView

from .chat_service import build_chat_reply
from .openai_client import OpenAIClientError
from .serializers import ChatRequestSerializer
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


class ChatAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["AI Advisor"],
        summary="Chat with the ProductMS assistant",
        request=ChatRequestSerializer,
    )
    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            reply = build_chat_reply(
                user=request.user,
                message=serializer.validated_data["message"],
                history=serializer.validated_data["history"],
            )
        except OpenAIClientError as exc:
            return Response(
                {
                    "detail": "Chatbot hiện chưa thể phản hồi. Vui lòng kiểm tra cấu hình OpenAI.",
                    "reason": str(exc),
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(
            {
                "reply": reply,
                "model": getattr(settings, "OPENAI_CHAT_MODEL", settings.OPENAI_MODEL),
            }
        )
