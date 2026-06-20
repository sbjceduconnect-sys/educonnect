from rest_framework import serializers
from core.serializers import CamelCaseSerializer
from apps.courses.models import Course
from apps.subjects.models import Subject
from .models import Exam, Result

class ExamSerializer(CamelCaseSerializer):
    course_id = serializers.PrimaryKeyRelatedField(queryset=Course.objects.all(), source='course')
    subject_id = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all(), source='subject', required=False, allow_null=True)
    exam_date = serializers.DateField(source='date')
    exam_type = serializers.CharField(source='type', required=False)

    class Meta:
        model = Exam
        fields = ['id', 'title', 'course_id', 'subject_id', 'exam_date', 'exam_type', 'duration', 'max_marks', 'academic_year']
        read_only_fields = ['created_at']



class ResultSerializer(CamelCaseSerializer):
    marks_obtained = serializers.FloatField(source='marks')
    student_id = serializers.IntegerField(source='student.id', read_only=True)
    exam_id = serializers.IntegerField(source='exam.id', read_only=True)
    max_marks = serializers.IntegerField(source='exam.max_marks', read_only=True)

    class Meta:
        model = Result
        fields = '__all__'
        read_only_fields = ['grade', 'created_at']
