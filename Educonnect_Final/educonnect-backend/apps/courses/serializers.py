from rest_framework import serializers
from core.serializers import CamelCaseSerializer
from .models import Course

class CourseSerializer(CamelCaseSerializer):
    title = serializers.CharField(source='name')
    course_code = serializers.CharField(source='code')
    department_id = serializers.IntegerField(required=False, allow_null=True)
    teacher_id = serializers.IntegerField(required=False, allow_null=True)
    teacher_ids = serializers.ListField(child=serializers.IntegerField(), required=False, write_only=True)
    teacher_name = serializers.SerializerMethodField()
    teacher_names = serializers.SerializerMethodField()
    teachers = serializers.SerializerMethodField()
    enrolled_student_ids = serializers.SerializerMethodField()
    enrolled_count = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'course_code', 'department_id', 'teacher_id', 'teacher_ids',
            'teacher_name', 'teacher_names', 'teachers', 'academic_year', 'created_at',
            'enrolled_student_ids', 'enrolled_count'
        ]
        read_only_fields = ['created_at']

    def create(self, validated_data):
        teacher_ids = validated_data.pop('teacher_ids', None)
        course = super().create(validated_data)
        if teacher_ids is not None:
            course.teachers.set(teacher_ids)
            if teacher_ids and not course.teacher_id:
                course.teacher_id = teacher_ids[0]
                course.save(update_fields=['teacher'])
        return course

    def update(self, instance, validated_data):
        teacher_ids = validated_data.pop('teacher_ids', None)
        course = super().update(instance, validated_data)
        if teacher_ids is not None:
            course.teachers.set(teacher_ids)
            if teacher_ids:
                course.teacher_id = teacher_ids[0]
            else:
                course.teacher_id = None
            course.save(update_fields=['teacher'])
        return course

    def get_teacher_name(self, obj):
        assigned = list(obj.teachers.all())
        if assigned:
            return ", ".join([t.get_full_name() for t in assigned])
        if obj.teacher:
            return obj.teacher.get_full_name()
        return 'Not Assigned'

    def get_teacher_names(self, obj):
        assigned = list(obj.teachers.all())
        if assigned:
            return [t.get_full_name() for t in assigned]
        if obj.teacher:
            return [obj.teacher.get_full_name()]
        return []

    def get_teachers(self, obj):
        assigned = list(obj.teachers.all())
        if not assigned and obj.teacher:
            assigned = [obj.teacher]
        return [
            {
                "id": t.id,
                "firstName": t.first_name,
                "lastName": t.last_name,
                "name": t.get_full_name(),
                "email": t.email
            }
            for t in assigned
        ]

    def get_enrolled_student_ids(self, obj):
        return list(obj.students.values_list('id', flat=True))

    def get_enrolled_count(self, obj):
        return obj.students.count()
