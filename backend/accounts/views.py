from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


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
        }
    )
