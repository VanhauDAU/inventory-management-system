from django.db import transaction
from rest_framework import serializers

from products.models import Product
from products.serializers import ProductSerializer

from .models import StockTransaction, StockTransactionItem, Warehouse


class WarehouseSerializer(serializers.ModelSerializer):
    stock_transactions_count = serializers.IntegerField(
        source="stock_transactions.count",
        read_only=True,
    )

    class Meta:
        model = Warehouse
        fields = [
            "id",
            "name",
            "address",
            "phone",
            "manager_name",
            "is_active",
            "stock_transactions_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class StockTransactionItemSerializer(serializers.ModelSerializer):
    product_detail = ProductSerializer(source="product", read_only=True)

    class Meta:
        model = StockTransactionItem
        fields = [
            "id",
            "stock_transaction",
            "product",
            "product_detail",
            "quantity",
            "unit_price",
            "total_amount",
            "note",
        ]
        read_only_fields = ["id", "stock_transaction", "total_amount"]


class StockTransactionSerializer(serializers.ModelSerializer):
    items = StockTransactionItemSerializer(many=True)
    warehouse_detail = WarehouseSerializer(source="warehouse", read_only=True)
    created_by_username = serializers.CharField(
        source="created_by.username",
        read_only=True,
    )

    class Meta:
        model = StockTransaction
        fields = [
            "id",
            "warehouse",
            "warehouse_detail",
            "transaction_type",
            "transaction_code",
            "reason",
            "note",
            "created_by",
            "created_by_username",
            "items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_by", "created_at", "updated_at"]

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError(
                "Stock transaction must include at least one item."
            )

        product_ids = [item["product"].id for item in items]
        if len(product_ids) != len(set(product_ids)):
            raise serializers.ValidationError(
                "Each product can only appear once per stock transaction."
            )

        return items

    def validate(self, attrs):
        transaction_type = attrs.get(
            "transaction_type",
            getattr(self.instance, "transaction_type", None),
        )
        items = attrs.get("items", [])

        if transaction_type == StockTransaction.TransactionType.EXPORT:
            for item in items:
                product = item["product"]
                quantity = item["quantity"]
                if product.quantity < quantity:
                    raise serializers.ValidationError(
                        {
                            "items": (
                                f"Product {product.sku} only has "
                                f"{product.quantity} item(s) in stock."
                            )
                        }
                    )

        return attrs

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        request = self.context.get("request")

        if request and request.user and request.user.is_authenticated:
            validated_data["created_by"] = request.user

        with transaction.atomic():
            stock_transaction = StockTransaction.objects.create(**validated_data)

            for item_data in items_data:
                item = StockTransactionItem.objects.create(
                    stock_transaction=stock_transaction,
                    **item_data,
                )
                self._apply_stock_change(stock_transaction.transaction_type, item)

        return stock_transaction

    def update(self, instance, validated_data):
        if "items" in validated_data:
            raise serializers.ValidationError(
                {"items": "Items cannot be updated after a transaction is created."}
            )

        return super().update(instance, validated_data)

    def _apply_stock_change(self, transaction_type, item):
        product = Product.objects.select_for_update().get(pk=item.product_id)

        if transaction_type == StockTransaction.TransactionType.IMPORT:
            product.quantity += item.quantity
        elif transaction_type == StockTransaction.TransactionType.EXPORT:
            if product.quantity < item.quantity:
                raise serializers.ValidationError(
                    {
                        "items": (
                            f"Product {product.sku} only has "
                            f"{product.quantity} item(s) in stock."
                        )
                    }
                )
            product.quantity -= item.quantity
        elif transaction_type == StockTransaction.TransactionType.ADJUSTMENT:
            product.quantity = item.quantity

        product.save(update_fields=["quantity", "updated_at"])
