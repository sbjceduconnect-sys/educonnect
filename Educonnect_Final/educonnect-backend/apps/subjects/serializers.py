from rest_framework import serializers
from core.serializers import CamelCaseSerializer
from .models import Subject

class SubjectSerializer(CamelCaseSerializer):
    department_id = serializers.IntegerField(required=True)
    teacher_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = Subject
        fields = ['id', 'name', 'code', 'type', 'weekly_hours', 'department_id', 'teacher_id', 'created_at']
