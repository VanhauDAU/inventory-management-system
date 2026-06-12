from rest_framework import serializers

from .models import Supplier


class SupplierSerializer(serializers.ModelSerializer):
    products_count = serializers.IntegerField(source="products.count", read_only=True)

    class Meta:
        model = Supplier
        fields = [
            "id",
            "name",
            "contact_name",
            "phone",
            "email",
            "address",
            "tax_code",
            "note",
            "is_active",
            "products_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def validate_name(self, value):
        name = value.strip()
        if len(name) < 2:
            raise serializers.ValidationError("Supplier name must be at least 2 characters.")
        return name

    def validate_tax_code(self, value):
        if value == "":
            return None
        return value

    def validate_phone(self, value):
        phone = value.strip()
        if phone and len(phone) < 8:
            raise serializers.ValidationError("Phone number is too short.")
        return phone

    def validate(self, attrs):
        name = attrs.get("name", self.instance.name if self.instance else "")
        tax_code = attrs.get("tax_code", self.instance.tax_code if self.instance else None)

        queryset = Supplier.objects.filter(name__iexact=name)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError(
                {"name": "A supplier with this name already exists."}
            )

        if tax_code:
            tax_queryset = Supplier.objects.filter(tax_code__iexact=tax_code)
            if self.instance:
                tax_queryset = tax_queryset.exclude(pk=self.instance.pk)
            if tax_queryset.exists():
                raise serializers.ValidationError(
                    {"tax_code": "A supplier with this tax code already exists."}
                )

        return attrs
