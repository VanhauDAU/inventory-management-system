from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from drf_spectacular.utils import extend_schema, extend_schema_view, inline_serializer
from rest_framework import filters, serializers, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response

from .serializers import PermissionSerializer, RoleSerializer, UserSerializer


User = get_user_model()


class IsAccountAdmin(BasePermission):
    message = "Bạn cần quyền quản trị hệ thống để quản lý người dùng và nhóm quyền."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_staff or request.user.is_superuser)
        )


@extend_schema_view(
    list=extend_schema(tags=["Accounts"], summary="List users"),
    retrieve=extend_schema(tags=["Accounts"], summary="Retrieve user"),
    create=extend_schema(tags=["Accounts"], summary="Create user"),
    update=extend_schema(tags=["Accounts"], summary="Replace user"),
    partial_update=extend_schema(tags=["Accounts"], summary="Update user"),
    destroy=extend_schema(tags=["Accounts"], summary="Delete user"),
)
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.prefetch_related("groups").all().order_by("id")
    serializer_class = UserSerializer
    permission_classes = [IsAccountAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["username", "email", "first_name", "last_name", "groups__name"]
    ordering_fields = [
        "id",
        "username",
        "email",
        "first_name",
        "last_name",
        "is_active",
        "is_staff",
        "is_superuser",
        "last_login",
        "date_joined",
    ]

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()

        if user == request.user:
            return Response(
                {"detail": "Không thể xóa chính tài khoản đang đăng nhập."},
                status=status.HTTP_409_CONFLICT,
            )

        if user.is_superuser and not request.user.is_superuser:
            return Response(
                {"detail": "Chỉ superuser mới có thể xóa tài khoản superuser."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return super().destroy(request, *args, **kwargs)


@extend_schema_view(
    list=extend_schema(tags=["Accounts"], summary="List roles"),
    retrieve=extend_schema(tags=["Accounts"], summary="Retrieve role"),
    create=extend_schema(tags=["Accounts"], summary="Create role"),
    update=extend_schema(tags=["Accounts"], summary="Replace role"),
    partial_update=extend_schema(tags=["Accounts"], summary="Update role"),
    destroy=extend_schema(tags=["Accounts"], summary="Delete role"),
)
class RoleViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.prefetch_related("permissions", "permissions__content_type").all().order_by("name")
    serializer_class = RoleSerializer
    permission_classes = [IsAccountAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "permissions__name", "permissions__codename"]
    ordering_fields = ["id", "name"]

    def destroy(self, request, *args, **kwargs):
        role = self.get_object()
        if role.user_set.exists():
            return Response(
                {"detail": "Không thể xóa nhóm quyền đang có người dùng. Hãy chuyển người dùng sang nhóm khác trước."},
                status=status.HTTP_409_CONFLICT,
            )
        return super().destroy(request, *args, **kwargs)


@extend_schema_view(
    list=extend_schema(tags=["Accounts"], summary="List assignable permissions"),
    retrieve=extend_schema(tags=["Accounts"], summary="Retrieve permission"),
)
class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Permission.objects.select_related("content_type").all().order_by(
        "content_type__app_label",
        "content_type__model",
        "codename",
    )
    serializer_class = PermissionSerializer
    permission_classes = [IsAccountAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "codename", "content_type__app_label", "content_type__model"]
    ordering_fields = ["id", "name", "codename", "content_type__app_label", "content_type__model"]


@extend_schema(
    tags=["Accounts"],
    summary="Get current authenticated user",
    description=(
        "Return the profile of the user represented by the current JWT access token. "
        "Used by the frontend sidebar to display the logged-in user's name and role."
    ),
    responses={
        200: inline_serializer(
            name="CurrentUser",
            fields={
                "id": serializers.IntegerField(),
                "username": serializers.CharField(),
                "email": serializers.EmailField(allow_blank=True),
                "first_name": serializers.CharField(allow_blank=True),
                "last_name": serializers.CharField(allow_blank=True),
                "full_name": serializers.CharField(),
                "is_staff": serializers.BooleanField(),
                "is_superuser": serializers.BooleanField(),
                "groups": serializers.ListField(child=serializers.CharField()),
                "permissions": serializers.ListField(child=serializers.CharField()),
            },
        )
    },
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user(request):
    user = request.user
    full_name = user.get_full_name().strip()

    return Response(
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "full_name": full_name or user.username,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
            "groups": [group.name for group in user.groups.all()],
            "permissions": sorted(user.get_all_permissions()),
        }
    )
