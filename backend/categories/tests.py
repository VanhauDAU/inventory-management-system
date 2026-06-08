from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Category


class CategoryAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="manager",
            password="managerpass123",
        )

    def test_category_api_requires_authentication(self):
        response = self.client.get("/api/categories/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_user_can_create_and_update_category(self):
        self.client.force_authenticate(user=self.user)

        create_response = self.client.post(
            "/api/categories/",
            {"name": "Electronics"},
            format="json",
        )

        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        category_id = create_response.data["id"]
        self.assertEqual(Category.objects.count(), 1)

        update_response = self.client.patch(
            f"/api/categories/{category_id}/",
            {"name": "Office Electronics"},
            format="json",
        )

        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data["name"], "Office Electronics")
