import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Create a superuser from environment variables when it does not exist."

    def handle(self, *args, **options):
        username = os.getenv("DJANGO_SUPERUSER_USERNAME", "").strip()
        email = os.getenv("DJANGO_SUPERUSER_EMAIL", "").strip()
        password = os.getenv("DJANGO_SUPERUSER_PASSWORD", "")

        if not username and not password:
            self.stdout.write("Superuser environment variables are not configured; skipping.")
            return

        if not username or not password:
            raise CommandError(
                "DJANGO_SUPERUSER_USERNAME and DJANGO_SUPERUSER_PASSWORD "
                "must both be configured."
            )

        user_model = get_user_model()
        user, created = user_model.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "is_staff": True,
                "is_superuser": True,
            },
        )

        if created:
            user.set_password(password)
            user.save(update_fields=["password"])
            self.stdout.write(self.style.SUCCESS(f"Created superuser '{username}'."))
            return

        fields_to_update = []
        if not user.is_staff:
            user.is_staff = True
            fields_to_update.append("is_staff")
        if not user.is_superuser:
            user.is_superuser = True
            fields_to_update.append("is_superuser")
        if email and user.email != email:
            user.email = email
            fields_to_update.append("email")

        if fields_to_update:
            user.save(update_fields=fields_to_update)
            self.stdout.write(
                self.style.SUCCESS(f"Updated superuser permissions for '{username}'.")
            )
        else:
            self.stdout.write(f"Superuser '{username}' already exists; skipping.")
