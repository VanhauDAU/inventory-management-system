from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from rest_framework import serializers


User = get_user_model()


class PermissionSerializer(serializers.ModelSerializer):
    app_label = serializers.CharField(source="content_type.app_label", read_only=True)
    model = serializers.CharField(source="content_type.model", read_only=True)

    class Meta:
        model = Permission
        fields = ["id", "name", "codename", "app_label", "model"]


class RoleSerializer(serializers.ModelSerializer):
    permissions = serializers.PrimaryKeyRelatedField(
        queryset=Permission.objects.select_related("content_type").all(),
        many=True,
        required=False,
    )
    permission_details = PermissionSerializer(source="permissions", many=True, read_only=True)
    users_count = serializers.IntegerField(source="user_set.count", read_only=True)

    class Meta:
        model = Group
        fields = ["id", "name", "permissions", "permission_details", "users_count"]

    def validate_name(self, value):
        name = value.strip()
        if len(name) < 2:
            raise serializers.ValidationError("Role name must be at least 2 characters.")
        return name


class UserSerializer(serializers.ModelSerializer):
    groups = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.all(),
        many=True,
        required=False,
    )
    group_names = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        min_length=8,
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "is_active",
            "is_staff",
            "is_superuser",
            "groups",
            "group_names",
            "password",
            "last_login",
            "date_joined",
        ]
        read_only_fields = ["last_login", "date_joined"]
        extra_kwargs = {
            "username": {"required": True},
            "email": {"required": False, "allow_blank": True},
            "first_name": {"required": False, "allow_blank": True},
            "last_name": {"required": False, "allow_blank": True},
        }

    def get_group_names(self, obj):
        return [group.name for group in obj.groups.all()]

    def get_full_name(self, obj):
        return obj.get_full_name().strip() or obj.username

    def validate(self, attrs):
        request = self.context.get("request")
        actor = getattr(request, "user", None)

        if actor and not actor.is_superuser:
            forbidden_fields = {"is_staff", "is_superuser"}
            if forbidden_fields.intersection(attrs):
                raise serializers.ValidationError(
                    "Only a superuser can change staff or superuser flags."
                )

            if self.instance and self.instance.is_superuser:
                raise serializers.ValidationError("Only a superuser can update a superuser account.")

        if self.instance is None and not attrs.get("password"):
            raise serializers.ValidationError({"password": "Password is required when creating a user."})

        return attrs

    def create(self, validated_data):
        groups = validated_data.pop("groups", [])
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        user.groups.set(groups)
        return user

    def update(self, instance, validated_data):
        groups = validated_data.pop("groups", None)
        password = validated_data.pop("password", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()

        if groups is not None:
            instance.groups.set(groups)

        return instance
