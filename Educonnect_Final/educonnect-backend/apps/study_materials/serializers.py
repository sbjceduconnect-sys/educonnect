from rest_framework import serializers
from core.serializers import CamelCaseSerializer
from apps.courses.models import Course
from apps.subjects.models import Subject
from .models import StudyMaterial

class StudyMaterialSerializer(CamelCaseSerializer):
    course_id = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.all(),
        source='course',
        required=False,
        allow_null=True
    )
    subject_id = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.all(),
        source='subject',
        required=False,
        allow_null=True
    )
    material = serializers.FileField(write_only=True, required=False, source='file')

    class Meta:
        model = StudyMaterial
        fields = '__all__'
        read_only_fields = ['created_at', 'uploaded_by', 'file']

    def to_internal_value(self, data):
        if hasattr(data, '_mutable'):
            data._mutable = True
        data_dict = data.copy() if hasattr(data, 'copy') else dict(data)
        if data_dict.get('subject_id') == '' or data_dict.get('subjectId') == '':
            data_dict['subject_id'] = None
            data_dict['subjectId'] = None
        if data_dict.get('course_id') == '' or data_dict.get('courseId') == '':
            data_dict['course_id'] = None
            data_dict['courseId'] = None
        return super().to_internal_value(data_dict)

