from rest_framework import serializers
from core.serializers import CamelCaseSerializer
from apps.courses.models import Course
from apps.subjects.models import Subject
from .models import LessonPlan

class LessonPlanSerializer(CamelCaseSerializer):
    course = serializers.PrimaryKeyRelatedField(queryset=Course.objects.all())
    subject = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all())

    class Meta:
        model = LessonPlan
        fields = '__all__'
        read_only_fields = ['created_at', 'teacher']

    def to_internal_value(self, data):
        if hasattr(data, '_mutable'):
            data = data.copy()
        else:
            data = dict(data)
        if 'courseId' in data:
            data['course'] = data['courseId']
        if 'subjectId' in data:
            data['subject'] = data['subjectId']
        return super().to_internal_value(data)
