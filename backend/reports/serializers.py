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
