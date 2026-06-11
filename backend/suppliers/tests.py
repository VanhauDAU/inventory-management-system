from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Supplier


class SupplierAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="manager",
            password="managerpass123",
        )

    def test_supplier_api_requires_authentication(self):
        response = self.client.get("/api/suppliers/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_user_can_create_list_update_and_delete_supplier(self):
        self.client.force_authenticate(user=self.user)

        create_response = self.client.post(
            "/api/suppliers/",
            {
                "name": "Supplier A",
                "contact_name": "Nguyen Van A",
                "phone": "0900000000",
                "email": "supplier@example.com",
                "address": "Ho Chi Minh City",
                "tax_code": "TAX-001",
                "note": "Primary supplier",
                "is_active": True,
            },
            format="json",
        )

        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        supplier_id = create_response.data["id"]
        self.assertEqual(Supplier.objects.count(), 1)
        self.assertEqual(create_response.data["products_count"], 0)

        list_response = self.client.get("/api/suppliers/")
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(list_response.data["count"], 1)
        self.assertEqual(list_response.data["results"][0]["name"], "Supplier A")

        detail_response = self.client.get(f"/api/suppliers/{supplier_id}/")
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_response.data["tax_code"], "TAX-001")

        update_response = self.client.patch(
            f"/api/suppliers/{supplier_id}/",
            {"phone": "0911111111", "is_active": False},
            format="json",
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data["phone"], "0911111111")
        self.assertFalse(update_response.data["is_active"])

        delete_response = self.client.delete(f"/api/suppliers/{supplier_id}/")
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Supplier.objects.filter(id=supplier_id).exists())
