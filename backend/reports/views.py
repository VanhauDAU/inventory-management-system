from decimal import Decimal

from django.db.models import Count, DecimalField, ExpressionWrapper, F, Q, Sum
from django.utils.dateparse import parse_date
from rest_framework import generics
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from inventory.models import StockTransaction, Warehouse, WarehouseStock
from inventory.serializers import StockTransactionSerializer
from products.models import Product

from .serializers import (
    InventorySummarySerializer,
    InventoryValueReportSerializer,
    LowStockProductReportSerializer,
)


class HasRequiredModelPermissions(BasePermission):
    required_permissions = []

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        required_permissions = getattr(view, "required_permissions", self.required_permissions)
        return request.user.has_perms(required_permissions)


class InventorySummaryAPIView(APIView):
    permission_classes = [IsAuthenticated, HasRequiredModelPermissions]
    required_permissions = [
        "products.view_product",
        "inventory.view_warehouse",
        "inventory.view_stocktransaction",
    ]

    def get(self, request):
        stock_value_expression = ExpressionWrapper(
            F("quantity") * F("cost_price"),
            output_field=DecimalField(max_digits=14, decimal_places=2),
        )
        product_summary = Product.objects.aggregate(
            total_products=Count("id"),
            total_quantity=Sum("quantity"),
            total_stock_value=Sum(stock_value_expression),
            low_stock_products=Count(
                "id",
                filter=Q(quantity__lte=F("minimum_stock")),
            ),
        )
        transaction_summary = StockTransaction.objects.aggregate(
            import_transactions=Count(
                "id",
                filter=Q(transaction_type=StockTransaction.TransactionType.IMPORT),
            ),
            export_transactions=Count(
                "id",
                filter=Q(transaction_type=StockTransaction.TransactionType.EXPORT),
            ),
            adjustment_transactions=Count(
                "id",
                filter=Q(transaction_type=StockTransaction.TransactionType.ADJUSTMENT),
            ),
        )
        data = {
            "total_products": product_summary["total_products"] or 0,
            "total_quantity": product_summary["total_quantity"] or 0,
            "total_stock_value": product_summary["total_stock_value"] or Decimal("0.00"),
            "low_stock_products": product_summary["low_stock_products"] or 0,
            "warehouses_count": Warehouse.objects.count(),
            **transaction_summary,
        }
        serializer = InventorySummarySerializer(data)
        return Response(serializer.data)


class StockTransactionReportFilterMixin:
    def filter_transaction_queryset(self, queryset):
        params = self.request.query_params
        date_from = parse_date(params.get("date_from") or params.get("from_date") or "")
        date_to = parse_date(params.get("date_to") or params.get("to_date") or "")
        warehouse = params.get("warehouse")
        transaction_type = params.get("transaction_type")

        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)
        if warehouse:
            queryset = queryset.filter(warehouse_id=warehouse)
        if transaction_type:
            queryset = queryset.filter(transaction_type=transaction_type)

        return queryset


class InventoryLowStockReportAPIView(generics.ListAPIView):
    serializer_class = LowStockProductReportSerializer
    permission_classes = [IsAuthenticated, HasRequiredModelPermissions]
    required_permissions = ["products.view_product"]

    def get_queryset(self):
        missing_quantity_expression = ExpressionWrapper(
            F("minimum_stock") - F("quantity"),
            output_field=DecimalField(max_digits=14, decimal_places=2),
        )
        stock_cost_value_expression = ExpressionWrapper(
            F("quantity") * F("cost_price"),
            output_field=DecimalField(max_digits=14, decimal_places=2),
        )
        stock_selling_value_expression = ExpressionWrapper(
            F("quantity") * F("selling_price"),
            output_field=DecimalField(max_digits=14, decimal_places=2),
        )

        queryset = (
            Product.objects.select_related("category", "supplier")
            .filter(quantity__lte=F("minimum_stock"))
            .annotate(
                missing_quantity=missing_quantity_expression,
                stock_cost_value=stock_cost_value_expression,
                stock_selling_value=stock_selling_value_expression,
            )
            .order_by("-missing_quantity", "name")
        )

        category = self.request.query_params.get("category")
        supplier = self.request.query_params.get("supplier")
        status_filter = self.request.query_params.get("status")

        if category:
            queryset = queryset.filter(category_id=category)
        if supplier:
            queryset = queryset.filter(supplier_id=supplier)
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset.values(
            "id",
            "sku",
            "name",
            "category_id",
            "category__name",
            "supplier_id",
            "supplier__name",
            "quantity",
            "minimum_stock",
            "missing_quantity",
            "cost_price",
            "selling_price",
            "stock_cost_value",
            "stock_selling_value",
        )

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        rows = page if page is not None else queryset
        data = [
            {
                "id": row["id"],
                "sku": row["sku"],
                "name": row["name"],
                "category_id": row["category_id"],
                "category_name": row["category__name"],
                "supplier_id": row["supplier_id"],
                "supplier_name": row["supplier__name"],
                "quantity": row["quantity"],
                "minimum_stock": row["minimum_stock"],
                "missing_quantity": max(int(row["missing_quantity"] or 0), 0),
                "cost_price": row["cost_price"],
                "selling_price": row["selling_price"],
                "stock_cost_value": row["stock_cost_value"] or Decimal("0.00"),
                "stock_selling_value": row["stock_selling_value"] or Decimal("0.00"),
            }
            for row in rows
        ]
        serializer = self.get_serializer(data, many=True)

        if page is not None:
            return self.get_paginated_response(serializer.data)

        return Response(serializer.data)


class InventoryValueReportAPIView(APIView):
    permission_classes = [IsAuthenticated, HasRequiredModelPermissions]
    required_permissions = ["products.view_product", "inventory.view_warehousestock"]

    def get(self, request):
        cost_value_expression = ExpressionWrapper(
            F("quantity") * F("cost_price"),
            output_field=DecimalField(max_digits=14, decimal_places=2),
        )
        selling_value_expression = ExpressionWrapper(
            F("quantity") * F("selling_price"),
            output_field=DecimalField(max_digits=14, decimal_places=2),
        )
        warehouse_cost_value_expression = ExpressionWrapper(
            F("quantity") * F("product__cost_price"),
            output_field=DecimalField(max_digits=14, decimal_places=2),
        )
        warehouse_selling_value_expression = ExpressionWrapper(
            F("quantity") * F("product__selling_price"),
            output_field=DecimalField(max_digits=14, decimal_places=2),
        )

        totals = Product.objects.aggregate(
            products_count=Count("id"),
            total_quantity=Sum("quantity"),
            total_cost_value=Sum(cost_value_expression),
            total_selling_value=Sum(selling_value_expression),
        )
        category_rows = (
            Product.objects.values("category_id", "category__name")
            .annotate(
                products_count=Count("id"),
                total_quantity=Sum("quantity"),
                total_cost_value=Sum(cost_value_expression),
                total_selling_value=Sum(selling_value_expression),
            )
            .order_by("-total_cost_value", "category__name")
        )
        supplier_rows = (
            Product.objects.values("supplier_id", "supplier__name")
            .annotate(
                products_count=Count("id"),
                total_quantity=Sum("quantity"),
                total_cost_value=Sum(cost_value_expression),
                total_selling_value=Sum(selling_value_expression),
            )
            .order_by("-total_cost_value", "supplier__name")
        )
        warehouse_rows = (
            WarehouseStock.objects.select_related("warehouse", "product")
            .values("warehouse_id", "warehouse__name")
            .annotate(
                product_kinds_count=Count("product", distinct=True),
                total_quantity=Sum("quantity"),
                total_cost_value=Sum(warehouse_cost_value_expression),
                total_selling_value=Sum(warehouse_selling_value_expression),
            )
            .order_by("-total_cost_value", "warehouse__name")
        )

        data = {
            "products_count": totals["products_count"] or 0,
            "total_quantity": totals["total_quantity"] or 0,
            "total_cost_value": totals["total_cost_value"] or Decimal("0.00"),
            "total_selling_value": totals["total_selling_value"] or Decimal("0.00"),
            "by_category": [
                {
                    "id": row["category_id"],
                    "name": row["category__name"] or "Chưa phân loại",
                    "products_count": row["products_count"] or 0,
                    "total_quantity": row["total_quantity"] or 0,
                    "total_cost_value": row["total_cost_value"] or Decimal("0.00"),
                    "total_selling_value": row["total_selling_value"] or Decimal("0.00"),
                }
                for row in category_rows
            ],
            "by_supplier": [
                {
                    "id": row["supplier_id"],
                    "name": row["supplier__name"] or "Chưa có nhà cung cấp",
                    "products_count": row["products_count"] or 0,
                    "total_quantity": row["total_quantity"] or 0,
                    "total_cost_value": row["total_cost_value"] or Decimal("0.00"),
                    "total_selling_value": row["total_selling_value"] or Decimal("0.00"),
                }
                for row in supplier_rows
            ],
            "by_warehouse": [
                {
                    "id": row["warehouse_id"],
                    "name": row["warehouse__name"],
                    "product_kinds_count": row["product_kinds_count"] or 0,
                    "total_quantity": row["total_quantity"] or 0,
                    "total_cost_value": row["total_cost_value"] or Decimal("0.00"),
                    "total_selling_value": row["total_selling_value"] or Decimal("0.00"),
                }
                for row in warehouse_rows
            ],
        }
        serializer = InventoryValueReportSerializer(data)
        return Response(serializer.data)


class StockMovementReportAPIView(StockTransactionReportFilterMixin, generics.ListAPIView):
    serializer_class = StockTransactionSerializer
    permission_classes = [IsAuthenticated, HasRequiredModelPermissions]
    required_permissions = ["inventory.view_stocktransaction"]

    def get_queryset(self):
        queryset = (
            StockTransaction.objects.select_related("warehouse", "created_by")
            .prefetch_related("items__product__category", "items__product__supplier")
            .order_by("-created_at", "-id")
        )
        return self.filter_transaction_queryset(queryset)


class InventoryImportReportAPIView(StockMovementReportAPIView):
    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.filter(transaction_type=StockTransaction.TransactionType.IMPORT)


class InventoryExportReportAPIView(StockMovementReportAPIView):
    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.filter(transaction_type=StockTransaction.TransactionType.EXPORT)
