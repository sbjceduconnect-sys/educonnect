from rest_framework import serializers
from core.serializers import CamelCaseSerializer
from apps.courses.models import Course
from apps.subjects.models import Subject
from django.contrib.auth import get_user_model
from .models import Assignment, AssignmentSubmission

User = get_user_model()

class UserShortSerializer(CamelCaseSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'username', 'email']

class AssignmentSerializer(CamelCaseSerializer):
    course_id = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.all(),
        source='course'
    )
    subject_id = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.all(),
        source='subject',
        required=False,
        allow_null=True
    )
    teacher = UserShortSerializer(read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True, default='')
    student_submission = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Assignment
        fields = [
            'id', 'title', 'description', 'course_id', 'subject_id', 
            'teacher', 'file', 'due_date', 'max_marks', 'created_at',
            'course_code', 'course_name', 'subject_name', 'student_submission'
        ]
        read_only_fields = ['created_at', 'teacher']

    def get_student_submission(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.role == 'student':
            submission = AssignmentSubmission.objects.filter(assignment=obj, student=request.user).first()
            if submission:
                return AssignmentSubmissionSerializer(submission, context=self.context).data
        return None

class AssignmentSubmissionSerializer(CamelCaseSerializer):
    student = UserShortSerializer(read_only=True)
    assignment_title = serializers.CharField(source='assignment.title', read_only=True)
    assignment_max_marks = serializers.IntegerField(source='assignment.max_marks', read_only=True)

    class Meta:
        model = AssignmentSubmission
        fields = [
            'id', 'assignment', 'student', 'file', 'remarks', 
            'submitted_at', 'marks', 'feedback', 'graded', 'graded_at',
            'assignment_title', 'assignment_max_marks'
        ]
        read_only_fields = ['submitted_at', 'graded', 'graded_at', 'marks', 'feedback', 'student']

class GradeSubmissionSerializer(CamelCaseSerializer):
    marks = serializers.FloatField()
    feedback = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = AssignmentSubmission
        fields = ['marks', 'feedback']

    def validate_marks(self, value):
        # self.instance references the AssignmentSubmission
        assignment = self.instance.assignment
        if value < 0 or value > assignment.max_marks:
            raise serializers.ValidationError(f"Marks must be between 0 and {assignment.max_marks}.")
        return value
