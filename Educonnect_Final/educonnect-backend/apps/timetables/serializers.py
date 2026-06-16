from rest_framework import serializers
from core.serializers import CamelCaseSerializer
from apps.departments.models import Department
from .models import Timetable

class TimetableSerializer(CamelCaseSerializer):
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        source='department'
    )

    class Meta:
        model = Timetable
        fields = '__all__'
        read_only_fields = ['department']

