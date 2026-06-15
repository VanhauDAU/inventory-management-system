# Generated manually for product image uploads

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0002_expand_product"),
    ]

    operations = [
        migrations.AlterField(
            model_name="product",
            name="image",
            field=models.ImageField(blank=True, upload_to="products/"),
        ),
    ]
