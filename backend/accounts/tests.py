from io import StringIO
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.core.management import call_command
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase


User = get_user_model()


class EnsureSuperuserCommandTests(TestCase):
    @patch.dict(
        "os.environ",
        {
            "DJANGO_SUPERUSER_USERNAME": "render-admin",
            "DJANGO_SUPERUSER_EMAIL": "admin@example.com",
            "DJANGO_SUPERUSER_PASSWORD": "initial-password",
        },
        clear=False,
    )
    def test_creates_superuser_from_environment(self):
        call_command("ensure_superuser", stdout=StringIO())

        user = User.objects.get(username="render-admin")
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertEqual(user.email, "admin@example.com")
        self.assertTrue(user.check_password("initial-password"))

    def test_existing_superuser_password_is_not_reset(self):
        user = User.objects.create_superuser(
            username="render-admin",
            email="old@example.com",
            password="existing-password",
        )

        with patch.dict(
            "os.environ",
            {
                "DJANGO_SUPERUSER_USERNAME": "render-admin",
                "DJANGO_SUPERUSER_EMAIL": "new@example.com",
                "DJANGO_SUPERUSER_PASSWORD": "different-password",
            },
            clear=False,
        ):
            call_command("ensure_superuser", stdout=StringIO())

        user.refresh_from_db()
        self.assertEqual(user.email, "new@example.com")
        self.assertTrue(user.check_password("existing-password"))

class AccountAdminApiTests(APITestCase):
    def setUp(self):
        self.staff_user = User.objects.create_user(
            username="admin-staff",
            password="password123",
            is_staff=True,
        )
        self.normal_user = User.objects.create_user(
            username="warehouse-user",
            password="password123",
        )
        self.role = Group.objects.create(name="Nhân viên kho")
        self.staff_user.user_permissions.add(
            *Permission.objects.filter(
                content_type__app_label="auth",
                content_type__model__in=["user", "group", "permission"],
            )
        )

    def test_regular_user_cannot_manage_users(self):
        self.client.force_authenticate(user=self.normal_user)

        response = self.client.get("/api/users/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_user_can_create_and_update_normal_user(self):
        self.client.force_authenticate(user=self.staff_user)

        create_response = self.client.post(
            "/api/users/",
            {
                "username": "stock-clerk",
                "email": "stock@example.com",
                "first_name": "Stock",
                "last_name": "Clerk",
                "password": "password123",
                "is_active": True,
                "groups": [self.role.id],
            },
            format="json",
        )

        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        user_id = create_response.data["id"]
        self.assertEqual(create_response.data["group_names"], ["Nhân viên kho"])

        update_response = self.client.patch(
            f"/api/users/{user_id}/",
            {"last_name": "Manager"},
            format="json",
        )

        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data["last_name"], "Manager")

    def test_staff_flag_without_permissions_cannot_manage_users(self):
        staff_without_permissions = User.objects.create_user(
            username="staff-without-permissions",
            password="password123",
            is_staff=True,
        )
        self.client.force_authenticate(user=staff_without_permissions)

        response = self.client.get("/api/users/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_user_cannot_assign_staff_or_superuser_flags(self):
        self.client.force_authenticate(user=self.staff_user)

        response = self.client.patch(
            f"/api/users/{self.normal_user.id}/",
            {"is_staff": True},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_staff_user_can_manage_roles_and_permissions(self):
        self.client.force_authenticate(user=self.staff_user)
        permission = Permission.objects.filter(codename="view_product").first()

        response = self.client.post(
            "/api/roles/",
            {
                "name": "Quản lý sản phẩm",
                "permissions": [permission.id] if permission else [],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "Quản lý sản phẩm")

        list_response = self.client.get("/api/permissions/?search=product")
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)

    def test_cannot_delete_role_with_users(self):
        self.normal_user.groups.add(self.role)
        self.client.force_authenticate(user=self.staff_user)

        response = self.client.delete(f"/api/roles/{self.role.id}/")

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
