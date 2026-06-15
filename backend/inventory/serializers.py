from django.db import transaction
from rest_framework import serializers

from products.models import Product
from products.serializers import ProductSerializer

from .models import StockTransaction, StockTransactionItem, Warehouse, WarehouseStock


class WarehouseSerializer(serializers.ModelSerializer):
    stock_transactions_count = serializers.IntegerField(
        source="stock_transactions.count",
        read_only=True,
    )
    product_kinds_count = serializers.SerializerMethodField()
    total_quantity = serializers.SerializerMethodField()

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
            "product_kinds_count",
            "total_quantity",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_product_kinds_count(self, obj):
        return obj.stock_items.filter(quantity__gt=0).count()

    def get_total_quantity(self, obj):
        return sum(stock.quantity for stock in obj.stock_items.all())

    def validate_name(self, value):
        name = value.strip()
        if len(name) < 2:
            raise serializers.ValidationError("Warehouse name must be at least 2 characters.")
        return name


class WarehouseStockSerializer(serializers.ModelSerializer):
    warehouse_detail = WarehouseSerializer(source="warehouse", read_only=True)
    product_detail = ProductSerializer(source="product", read_only=True)

    class Meta:
        model = WarehouseStock
        fields = [
            "id",
            "warehouse",
            "warehouse_detail",
            "product",
            "product_detail",
            "quantity",
            "updated_at",
        ]
        read_only_fields = ["id", "updated_at"]


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

        inactive_products = [
            item["product"].sku
            for item in items
            if item["product"].status != Product.Status.ACTIVE
        ]
        if inactive_products:
            raise serializers.ValidationError(
                "Only active products can be used in stock transactions: "
                + ", ".join(inactive_products)
            )

        return items

    def validate(self, attrs):
        transaction_type = attrs.get(
            "transaction_type",
            getattr(self.instance, "transaction_type", None),
        )
        warehouse = attrs.get(
            "warehouse",
            getattr(self.instance, "warehouse", None),
        )
        items = attrs.get("items", [])

        if warehouse and not warehouse.is_active:
            raise serializers.ValidationError(
                {"warehouse": "Cannot create stock transactions for an inactive warehouse."}
            )

        if transaction_type == StockTransaction.TransactionType.EXPORT:
            for item in items:
                product = item["product"]
                quantity = item["quantity"]
                warehouse_stock = WarehouseStock.objects.filter(
                    warehouse=warehouse,
                    product=product,
                ).first()
                available_quantity = warehouse_stock.quantity if warehouse_stock else 0
                if available_quantity < quantity:
                    raise serializers.ValidationError(
                        {
                            "items": (
                                f"Product {product.sku} only has {available_quantity} "
                                f"item(s) in warehouse {warehouse.name}."
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
            product_ids = [item["product"].id for item in items_data]
            list(Product.objects.select_for_update().filter(id__in=product_ids))
            list(
                WarehouseStock.objects.select_for_update().filter(
                    warehouse=validated_data["warehouse"],
                    product_id__in=product_ids,
                )
            )

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
        warehouse_stock, _ = WarehouseStock.objects.select_for_update().get_or_create(
            warehouse=item.stock_transaction.warehouse,
            product=product,
            defaults={"quantity": 0},
        )

        if transaction_type == StockTransaction.TransactionType.IMPORT:
            warehouse_stock.quantity += item.quantity
            product.quantity += item.quantity
        elif transaction_type == StockTransaction.TransactionType.EXPORT:
            if warehouse_stock.quantity < item.quantity:
                raise serializers.ValidationError(
                    {
                        "items": (
                            f"Product {product.sku} only has {warehouse_stock.quantity} "
                            f"item(s) in warehouse {item.stock_transaction.warehouse.name}."
                        )
                    }
                )
            warehouse_stock.quantity -= item.quantity
            product.quantity -= item.quantity
        elif transaction_type == StockTransaction.TransactionType.ADJUSTMENT:
            previous_quantity = warehouse_stock.quantity
            warehouse_stock.quantity = item.quantity
            product.quantity += item.quantity - previous_quantity

        if product.quantity < 0:
            raise serializers.ValidationError(
                {
                    "items": (
                        f"Product {product.sku} stock cannot become negative after "
                        "this transaction."
                    )
                }
            )

        warehouse_stock.save(update_fields=["quantity", "updated_at"])
        product.save(update_fields=["quantity", "updated_at"])
