from rest_framework import serializers

from .models import Category


class CategorySerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source="parent.name", read_only=True)
    products_count = serializers.IntegerField(source="products.count", read_only=True)
    children_count = serializers.IntegerField(source="children.count", read_only=True)

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
            "children_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def validate_name(self, value):
        name = value.strip()
        if len(name) < 2:
            raise serializers.ValidationError("Category name must be at least 2 characters.")
        return name

    def validate_parent(self, parent):
        if self.instance and parent and parent.id == self.instance.id:
            raise serializers.ValidationError("Category cannot be its own parent.")

        return parent

    def validate(self, attrs):
        parent = attrs.get("parent", self.instance.parent if self.instance else None)
        name = attrs.get("name", self.instance.name if self.instance else "")

        if self.instance and parent:
            current = parent
            while current:
                if current.id == self.instance.id:
                    raise serializers.ValidationError(
                        {"parent": "Category cannot use its descendant as parent."}
                    )
                current = current.parent

        queryset = Category.objects.filter(name__iexact=name, parent=parent)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError(
                {"name": "A category with this name already exists under the same parent."}
            )

        return attrs
