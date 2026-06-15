from rest_framework import serializers


class InventorySummarySerializer(serializers.Serializer):
    total_products = serializers.IntegerField()
    total_quantity = serializers.IntegerField()
    total_stock_value = serializers.DecimalField(max_digits=14, decimal_places=2)
    low_stock_products = serializers.IntegerField()
    warehouses_count = serializers.IntegerField()
    import_transactions = serializers.IntegerField()
    export_transactions = serializers.IntegerField()
    adjustment_transactions = serializers.IntegerField()


class LowStockProductReportSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    sku = serializers.CharField()
    name = serializers.CharField()
    category_id = serializers.IntegerField(allow_null=True)
    category_name = serializers.CharField(allow_null=True)
    supplier_id = serializers.IntegerField(allow_null=True)
    supplier_name = serializers.CharField(allow_null=True)
    quantity = serializers.IntegerField()
    minimum_stock = serializers.IntegerField()
    missing_quantity = serializers.IntegerField()
    cost_price = serializers.DecimalField(max_digits=12, decimal_places=2)
    selling_price = serializers.DecimalField(max_digits=12, decimal_places=2)
    stock_cost_value = serializers.DecimalField(max_digits=14, decimal_places=2)
    stock_selling_value = serializers.DecimalField(max_digits=14, decimal_places=2)


class InventoryValueGroupSerializer(serializers.Serializer):
    id = serializers.IntegerField(allow_null=True)
    name = serializers.CharField()
    products_count = serializers.IntegerField(required=False)
    product_kinds_count = serializers.IntegerField(required=False)
    total_quantity = serializers.IntegerField()
    total_cost_value = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_selling_value = serializers.DecimalField(max_digits=14, decimal_places=2)


class InventoryValueReportSerializer(serializers.Serializer):
    products_count = serializers.IntegerField()
    total_quantity = serializers.IntegerField()
    total_cost_value = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_selling_value = serializers.DecimalField(max_digits=14, decimal_places=2)
    by_category = InventoryValueGroupSerializer(many=True)
    by_supplier = InventoryValueGroupSerializer(many=True)
    by_warehouse = InventoryValueGroupSerializer(many=True)
