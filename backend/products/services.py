from django.db import transaction
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from .models import ProductImage


MAX_PRODUCT_IMAGES = 8
MAX_PRODUCT_IMAGE_SIZE = 5 * 1024 * 1024
PRODUCT_IMAGE_UPLOAD_FIELDS = ("uploaded_images", "images")


def get_uploaded_product_images(request):
    uploaded_images = []
    for field_name in PRODUCT_IMAGE_UPLOAD_FIELDS:
        uploaded_images.extend(request.FILES.getlist(field_name))
    return uploaded_images


def validate_product_images(uploaded_images):
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


def replace_product_images(product, uploaded_images):
    if not uploaded_images:
        return

    old_images = list(product.images.all())
    created_images = []

    try:
        for index, uploaded_image in enumerate(uploaded_images):
            created_images.append(
                ProductImage.objects.create(
                    product=product,
                    image=uploaded_image,
                    alt_text=product.name,
                    is_primary=index == 0,
                    sort_order=index,
                )
            )
    except Exception:
        for created_image in created_images:
            if created_image.image:
                created_image.image.delete(save=False)
        raise

    for old_image in old_images:
        old_image.delete()


def save_product_with_images(serializer, uploaded_images):
    with transaction.atomic():
        product = serializer.save()
        replace_product_images(product, uploaded_images)
        if getattr(product, "_prefetched_objects_cache", None):
            product._prefetched_objects_cache = {}
        return product
