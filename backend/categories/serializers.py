from rest_framework import serializers

from .models import Category


class CategorySerializer(serializers.ModelSerializer):
<<<<<<< HEAD
    parent_name = serializers.CharField(source="parent.name", read_only=True)
    products_count = serializers.IntegerField(source="products.count", read_only=True)

    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "description",
            "parent",
            "parent_name",
            "is_active",
            "products_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def validate_parent(self, parent):
        if self.instance and parent and parent.id == self.instance.id:
            raise serializers.ValidationError("Category cannot be its own parent.")

        return parent
=======
    class Meta:
        model = Category
        fields = ["id", "name"]
>>>>>>> feature/frontend-crud
