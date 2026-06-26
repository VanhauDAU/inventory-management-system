from django.db import transaction
from django.db.models.signals import post_delete, pre_save
from django.dispatch import receiver

from .models import ProductImage


def delete_file_after_commit(field_file):
    if not field_file:
        return

    storage = field_file.storage
    name = field_file.name
    if not name:
        return

    transaction.on_commit(lambda: storage.delete(name))


@receiver(post_delete, sender=ProductImage)
def delete_product_image_file(sender, instance, **kwargs):
    delete_file_after_commit(instance.image)


@receiver(pre_save, sender=ProductImage)
def delete_replaced_product_image_file(sender, instance, **kwargs):
    if not instance.pk:
        return

    try:
        old_image = ProductImage.objects.only("image").get(pk=instance.pk).image
    except ProductImage.DoesNotExist:
        return

    if old_image and old_image.name != instance.image.name:
        delete_file_after_commit(old_image)
