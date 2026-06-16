from rest_framework import serializers
from core.serializers import CamelCaseSerializer
from django.contrib.auth import get_user_model
from .models import Department

User = get_user_model()

class DepartmentSerializer(CamelCaseSerializer):
    hod_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='hod',
        required=False,
        allow_null=True
    )

    class Meta:
        model = Department
        fields = '__all__'
