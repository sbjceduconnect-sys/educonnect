from rest_framework import serializers
from core.serializers import CamelCaseSerializer
from .models import Course

class CourseSerializer(CamelCaseSerializer):
    title = serializers.CharField(source='name')
    course_code = serializers.CharField(source='code')
    department_id = serializers.IntegerField(required=False, allow_null=True)
    teacher_id = serializers.IntegerField(required=False, allow_null=True)
    teacher_name = serializers.SerializerMethodField()
    enrolled_student_ids = serializers.SerializerMethodField()
    enrolled_count = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'course_code', 'department_id', 'teacher_id',
            'teacher_name', 'academic_year', 'created_at', 'enrolled_student_ids', 'enrolled_count'
        ]
        read_only_fields = ['created_at']

    def get_teacher_name(self, obj):
        if obj.teacher:
            return obj.teacher.get_full_name()
        return 'Not Assigned'

    def get_enrolled_student_ids(self, obj):
        return list(obj.students.values_list('id', flat=True))

    def get_enrolled_count(self, obj):
        return obj.students.count()
