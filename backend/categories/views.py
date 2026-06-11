from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Category
from .serializers import CategorySerializer


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by("id")
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
