from rest_framework import serializers
from core.serializers import CamelCaseSerializer
from apps.announcements.models import Announcement
from apps.calendar_events.models import CalendarEvent
from apps.feedback.models import Feedback, OfficeHour
from apps.audit_logs.models import AuditLog
from apps.departments.models import Department

class AnnouncementSerializer(CamelCaseSerializer):
    content = serializers.CharField(source='body')
    target_department_id = serializers.IntegerField(required=False, allow_null=True)
    target_course_id = serializers.IntegerField(required=False, allow_null=True)
    priority = serializers.CharField(required=False, default='Medium')

    class Meta:
        model = Announcement
        fields = [
            'id', 'title', 'content', 'priority', 'category', 'scope',
            'target_department_id', 'target_course_id', 'author', 'created_at'
        ]
        read_only_fields = ['created_at', 'author']

    def validate_priority(self, value):
        mapping = {
            'low': 'Low',
            'normal': 'Medium',
            'high': 'High',
            'Low': 'Low',
            'Medium': 'Medium',
            'High': 'High'
        }
        val = mapping.get(value)
        if not val:
            raise serializers.ValidationError(f"Invalid priority level: {value}")
        return val

    def to_representation(self, instance):
        data = super().to_representation(instance)
        mapping = {
            'Low': 'low',
            'Medium': 'normal',
            'High': 'high'
        }
        if 'priority' in data:
            data['priority'] = mapping.get(data['priority'], data['priority'])
        return data

class CalendarEventSerializer(CamelCaseSerializer):
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        source='department',
        required=False,
        allow_null=True
    )
    class Meta:
        model = CalendarEvent
        fields = '__all__'
        read_only_fields = ['created_at', 'created_by']

class FeedbackSerializer(CamelCaseSerializer):
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        source='department',
        required=False,
        allow_null=True
    )
    submitted_at = serializers.DateTimeField(source='created_at', read_only=True)
    target_display = serializers.SerializerMethodField()

    class Meta:
        model = Feedback
        exclude = ['submitted_by']
        read_only_fields = ['created_at']

    def get_target_display(self, obj):
        if obj.target_type == 'course' and obj.target_id:
            from apps.courses.models import Course
            try:
                c = Course.objects.get(id=obj.target_id)
                return f"Course: {c.name}"
            except Course.DoesNotExist:
                return "Course: Unknown"
        elif obj.target_type == 'teacher' and obj.target_id:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                u = User.objects.get(id=obj.target_id)
                return f"Teacher: {u.get_full_name()}"
            except User.DoesNotExist:
                return "Teacher: Unknown"
        return "General"

class OfficeHourSerializer(CamelCaseSerializer):
    class Meta:
        model = OfficeHour
        fields = '__all__'
        read_only_fields = ['created_at', 'teacher']

class AuditLogSerializer(CamelCaseSerializer):
    user_display = serializers.SerializerMethodField()
    username = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    resource = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = '__all__'

    def get_user_display(self, obj):
        return obj.user.username if obj.user else 'Unknown'

    def get_username(self, obj):
        return obj.user.username if obj.user else 'System / Anonymous'

    def get_status(self, obj):
        if not obj.target:
            return True
        if obj.target.startswith('Status: '):
            try:
                code = int(obj.target.split('Status: ')[1])
                return 200 <= code < 300
            except (ValueError, IndexError):
                pass
        target_lower = obj.target.lower()
        if 'fail' in target_lower or 'error' in target_lower:
            return False
        return True

    def get_resource(self, obj):
        if obj.action:
            if '/' in obj.action:
                parts = obj.action.split(' ')
                path = parts[1] if len(parts) > 1 else parts[0]
                path_parts = [p for p in path.split('/') if p]
                if len(path_parts) > 2 and path_parts[0] == 'api' and path_parts[1] == 'v1':
                    return path_parts[2].capitalize()
                elif len(path_parts) > 0:
                    return path_parts[-1].capitalize()
            else:
                if 'login' in obj.action.lower() or 'logout' in obj.action.lower():
                    return 'Auth'
                return obj.action.split(' ')[0]
        return 'System'

