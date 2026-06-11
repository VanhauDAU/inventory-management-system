import uuid

from rest_framework import serializers

from categories.serializers import CategorySerializer

from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    category_detail = CategorySerializer(source="category", read_only=True)
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)
    price = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        required=False,
        write_only=True,
    )

    class Meta:
        model = Product
        fields = [
            "id",
            "sku",
            "barcode",
            "name",
            "description",
            "image",
            "price",
            "cost_price",
            "selling_price",
            "quantity",
            "minimum_stock",
            "unit",
            "status",
            "category",
            "category_detail",
            "supplier",
            "supplier_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]
        extra_kwargs = {
            "sku": {"required": False},
            "selling_price": {"required": False},
        }

    def validate(self, attrs):
        legacy_price = attrs.pop("price", None)
        if "selling_price" not in attrs and legacy_price is not None:
            attrs["selling_price"] = legacy_price

        if self.instance is None and "selling_price" not in attrs:
            raise serializers.ValidationError(
                {"selling_price": "This field is required."}
            )

        if self.instance is None and not attrs.get("sku"):
            attrs["sku"] = f"PRD-{uuid.uuid4().hex[:12].upper()}"

        return attrs

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation["price"] = representation["selling_price"]
        return representation
