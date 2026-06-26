import django_filters
from django.db import models
from django.db.models import ProtectedError
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import OpenApiResponse, extend_schema, extend_schema_view
from rest_framework import filters, parsers, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from accounts.permissions import ViewDjangoModelPermissions
from inventory.models import StockTransactionItem
from inventory.serializers import StockTransactionItemSerializer

from .models import Product, ProductImage
from .serializers import ProductSerializer


MAX_PRODUCT_IMAGES = 8
MAX_PRODUCT_IMAGE_SIZE = 5 * 1024 * 1024
PRODUCT_IMAGE_UPLOAD_FIELDS = ("uploaded_images", "images")


class ProductOrderingFilter(filters.OrderingFilter):
    def get_ordering(self, request, queryset, view):
        ordering = super().get_ordering(request, queryset, view)
        if not ordering:
            return ordering

        return [
            "-selling_price" if field == "-price" else
            "selling_price" if field == "price" else field
            for field in ordering
        ]


class ProductFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(field_name="selling_price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="selling_price", lookup_expr="lte")
    min_quantity = django_filters.NumberFilter(field_name="quantity", lookup_expr="gte")
    max_quantity = django_filters.NumberFilter(field_name="quantity", lookup_expr="lte")
    low_stock = django_filters.BooleanFilter(method="filter_low_stock")

    class Meta:
        model = Product
        fields = ["category", "supplier", "status"]

    def filter_low_stock(self, queryset, name, value):
        if not value:
            return queryset

        return queryset.filter(quantity__lte=models.F("minimum_stock"))


@extend_schema_view(
    list=extend_schema(
        tags=["Products"],
        summary="List products",
        description=(
            "Return products with category, supplier, stock, price, status, and image fields. "
            "Supports search, filters, ordering, and pagination."
        ),
    ),
    retrieve=extend_schema(
        tags=["Products"],
        summary="Retrieve product",
        description="Return one product with category and supplier details.",
    ),
    create=extend_schema(
        tags=["Products"],
        summary="Create product",
        description=(
            "Create a product. Supports multipart/form-data for image upload. "
            "Send multiple files with the uploaded_images field. SKU is generated "
            "automatically when omitted."
        ),
    ),
    update=extend_schema(
        tags=["Products"],
        summary="Replace product",
        description=(
            "Replace all editable product fields. Supports multipart/form-data "
            "for image upload, including multiple uploaded_images files."
        ),
    ),
    partial_update=extend_schema(
        tags=["Products"],
        summary="Update product",
        description=(
            "Partially update product fields. Supports multipart/form-data for "
            "image upload, including multiple uploaded_images files."
        ),
    ),
    destroy=extend_schema(
        tags=["Products"],
        summary="Delete product",
        description=(
            "Delete a product only when it has no protected business references. "
            "Products used in stock transaction items return HTTP 409."
        ),
        responses={
            204: OpenApiResponse(description="Product deleted."),
            409: OpenApiResponse(description="Product cannot be deleted because it is in use."),
        },
    ),
)
class ProductViewSet(viewsets.ModelViewSet):
    queryset = (
        Product.objects.select_related("category", "supplier")
        .prefetch_related("images")
        .all()
        .order_by("id")
    )
    serializer_class = ProductSerializer
    permission_classes = [ViewDjangoModelPermissions]
    parser_classes = [parsers.JSONParser, parsers.MultiPartParser, parsers.FormParser]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        ProductOrderingFilter,
    ]
    filterset_class = ProductFilter
    search_fields = ["sku", "barcode", "name", "description"]
    ordering_fields = [
        "id",
        "sku",
        "name",
        "price",
        "selling_price",
        "cost_price",
        "quantity",
        "minimum_stock",
        "created_at",
        "updated_at",
    ]

    def _get_uploaded_images(self, request):
        uploaded_images = []
        for field_name in PRODUCT_IMAGE_UPLOAD_FIELDS:
            uploaded_images.extend(request.FILES.getlist(field_name))
        return uploaded_images

    def _validate_uploaded_images(self, uploaded_images):
        if not uploaded_images:
            return

        if len(uploaded_images) > MAX_PRODUCT_IMAGES:
            raise ValidationError(
                {
                    "images": (
                        f"Chỉ được upload tối đa {MAX_PRODUCT_IMAGES} ảnh cho một sản phẩm."
                    )
                }
            )

        image_field = serializers.ImageField()
        for uploaded_image in uploaded_images:
            if uploaded_image.size > MAX_PRODUCT_IMAGE_SIZE:
                raise ValidationError(
                    {"images": "Mỗi ảnh sản phẩm không được vượt quá 5MB."}
                )

            image_field.run_validation(uploaded_image)
            if hasattr(uploaded_image, "seek"):
                uploaded_image.seek(0)

    def _replace_product_images(self, product, uploaded_images):
        if not uploaded_images:
            return

        for existing_image in product.images.all():
            if existing_image.image:
                existing_image.image.delete(save=False)
            existing_image.delete()

        for index, uploaded_image in enumerate(uploaded_images):
            ProductImage.objects.create(
                product=product,
                image=uploaded_image,
                alt_text=product.name,
                is_primary=index == 0,
                sort_order=index,
            )

    def create(self, request, *args, **kwargs):
        uploaded_images = self._get_uploaded_images(request)
        self._validate_uploaded_images(uploaded_images)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = serializer.save()
        self._replace_product_images(product, uploaded_images)
        headers = self.get_success_headers(serializer.data)
        return Response(
            self.get_serializer(product).data,
            status=status.HTTP_201_CREATED,
            headers=headers,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        uploaded_images = self._get_uploaded_images(request)
        self._validate_uploaded_images(uploaded_images)

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        product = serializer.save()
        self._replace_product_images(product, uploaded_images)

        if getattr(product, "_prefetched_objects_cache", None):
            product._prefetched_objects_cache = {}

        return Response(self.get_serializer(product).data)

    def destroy(self, request, *args, **kwargs):
        product = self.get_object()
        try:
            product.delete()
        except ProtectedError:
            return Response(
                {
                    "detail": (
                        "Không thể xóa sản phẩm vì đã được sử dụng trong phiếu kho "
                        "hoặc dữ liệu nghiệp vụ khác. Hãy chuyển trạng thái sản phẩm "
                        "sang inactive/discontinued nếu không còn kinh doanh."
                    )
                },
                status=status.HTTP_409_CONFLICT,
            )

        return Response(status=status.HTTP_204_NO_CONTENT)

    @extend_schema(
        tags=["Products"],
        summary="List product stock history",
        description="Return stock transaction item history for the selected product.",
        responses={200: StockTransactionItemSerializer(many=True)},
    )
    @action(detail=True, methods=["get"], url_path="stock-history")
    def stock_history(self, request, pk=None):
        product = self.get_object()
        queryset = (
            StockTransactionItem.objects.select_related(
                "stock_transaction",
                "product",
                "product__category",
                "product__supplier",
            )
            .filter(product=product)
            .order_by("-stock_transaction__created_at", "-id")
        )

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = StockTransactionItemSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = StockTransactionItemSerializer(queryset, many=True)
        return Response(serializer.data)
