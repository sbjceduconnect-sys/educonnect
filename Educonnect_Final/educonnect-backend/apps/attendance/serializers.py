from core.serializers import CamelCaseSerializer
from .models import AttendanceRecord

class AttendanceSerializer(CamelCaseSerializer):
    class Meta:
        model = AttendanceRecord
        fields = '__all__'
        read_only_fields = ['created_at', 'marked_by']
