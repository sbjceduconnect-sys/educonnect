from rest_framework import serializers
from core.serializers import CamelCaseSerializer
from .models import AttendanceRecord, AttendanceEditRequest

class AttendanceSerializer(CamelCaseSerializer):
    class Meta:
        model = AttendanceRecord
        fields = '__all__'
        read_only_fields = ['created_at', 'marked_by']


class AttendanceEditRequestSerializer(CamelCaseSerializer):
    attendance_record_id = serializers.PrimaryKeyRelatedField(queryset=AttendanceRecord.objects.all(), source='attendance_record')
    requested_by_name = serializers.CharField(source='requested_by.get_full_name', read_only=True)
    student_id = serializers.IntegerField(source='attendance_record.student.id', read_only=True)
    student_name = serializers.CharField(source='attendance_record.student.get_full_name', read_only=True)
    course_title = serializers.CharField(source='attendance_record.course.name', read_only=True)
    subject_name = serializers.CharField(source='attendance_record.subject.name', read_only=True)
    date = serializers.DateField(source='attendance_record.date', read_only=True)
    old_status = serializers.CharField(source='attendance_record.status', read_only=True)

    class Meta:
        model = AttendanceEditRequest
        fields = [
            'id', 'attendance_record_id', 'requested_by_name', 'student_id', 'student_name',
            'course_title', 'subject_name', 'date', 'old_status',
            'new_status', 'reason', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['status', 'created_at', 'updated_at']

