import os
from django.http import FileResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from core.response import api_success, api_error
from .models import StudyMaterial
from .serializers import StudyMaterialSerializer

def student_has_access_to_material(user, material):
    if user.role != 'student':
        return True
    
    # Check if student is explicitly enrolled in the material's course
    if material.course:
        is_enrolled = material.course.students.filter(id=user.id).exists()
        matches_stream = False
        if hasattr(user, 'profile') and user.profile.stream:
            user_stream = user.profile.stream.strip().lower()
            course_name = material.course.name.strip().lower()
            course_code = material.course.code.strip().lower()
            matches_stream = (user_stream == course_name or user_stream == course_code)
        
        if not (is_enrolled or matches_stream):
            return False
            
    # Also verify department check (principle of least privilege)
    dept_id = user.department_id
    if dept_id:
        if material.course and material.course.department_id:
            if material.course.department_id != dept_id:
                return False
        if material.subject and material.subject.department_id:
            if material.subject.department_id != dept_id:
                return False
    else:
        # Student has no department, only allow general materials (no department)
        if material.course and material.course.department_id:
            return False
        if material.subject and material.subject.department_id:
            return False
            
    return True


class StudyMaterialListView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        qs = StudyMaterial.objects.all()
        
        # Filter by department/stream if student
        if request.user.role == 'student':
            from django.db.models import Q
            user = request.user
            
            # Base filters for course/stream membership
            course_q = Q(course__isnull=True)
            
            # 1. Enrolled courses
            enrolled_course_ids = user.enrolled_courses.values_list('id', flat=True)
            course_q |= Q(course_id__in=enrolled_course_ids)
            
            # 2. Matching stream in profile
            if hasattr(user, 'profile') and user.profile.stream:
                user_stream = user.profile.stream.strip()
                if user_stream:
                    course_q |= Q(course__name__iexact=user_stream) | Q(course__code__iexact=user_stream)
            
            # Department alignment
            dept_id = user.department_id
            if dept_id:
                dept_q = (
                    Q(course__department_id=dept_id) |
                    Q(subject__department_id=dept_id) |
                    Q(course__isnull=True, subject__isnull=True) |
                    Q(course__isnull=False, course__department__isnull=True) |
                    Q(subject__isnull=False, subject__department__isnull=True)
                )
            else:
                dept_q = (
                    Q(course__isnull=True, subject__isnull=True) |
                    (Q(course__isnull=False) & Q(course__department__isnull=True)) |
                    (Q(subject__isnull=False) & Q(subject__department__isnull=True))
                )
                
            qs = qs.filter(course_q & dept_q)

        # Support filters
        type_ = request.query_params.get('type')
        course_id = request.query_params.get('course_id') or request.query_params.get('courseId')
        
        if type_:
            qs = qs.filter(type=type_)
        if course_id:
            qs = qs.filter(course_id=course_id)
            
        return api_success(data=StudyMaterialSerializer(qs, many=True).data)

    def post(self, request):
        s = StudyMaterialSerializer(data=request.data)
        if s.is_valid():
            s.save(uploaded_by=request.user)
            return api_success(data=s.data, message="File uploaded successfully.", status=201)
        return api_error("Upload failed.", errors=s.errors)


class StudyMaterialDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get(self, pk):
        try:
            return StudyMaterial.objects.get(pk=pk)
        except StudyMaterial.DoesNotExist:
            return None

    def get(self, request, pk):
        obj = self._get(pk)
        if not obj:
            return api_error("Study material not found.", status=404)
        if not student_has_access_to_material(request.user, obj):
            return api_error("You do not have permission to access this resource.", status=403)
        return api_success(data=StudyMaterialSerializer(obj).data)

    def put(self, request, pk):
        obj = self._get(pk)
        if not obj:
            return api_error("Study material not found.", status=404)
        s = StudyMaterialSerializer(obj, data=request.data, partial=True)
        if s.is_valid():
            s.save()
            return api_success(data=s.data, message="Study material updated.")
        return api_error("Validation failed.", errors=s.errors)

    def patch(self, request, pk):
        return self.put(request, pk)

    def delete(self, request, pk):
        obj = self._get(pk)
        if not obj:
            return api_error("Study material not found.", status=404)
        obj.delete()
        return api_success(message="Study material deleted.", status=200)


class StudyMaterialDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            obj = StudyMaterial.objects.get(pk=pk)
            if not student_has_access_to_material(request.user, obj):
                return api_error("You do not have permission to download this resource.", status=403)
            if not obj.file:
                return api_error("File not found on disk.", status=404)
            file_handle = obj.file.open()
            response = FileResponse(file_handle, content_type='application/octet-stream')
            filename = os.path.basename(obj.file.name)
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        except StudyMaterial.DoesNotExist:
            return api_error("Study material not found.", status=404)


class QuestionPapersListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = StudyMaterial.objects.filter(type__in=['Past Papers', 'question_paper'])
        
        # Filter by department/stream if student
        if request.user.role == 'student':
            from django.db.models import Q
            user = request.user
            
            # Base filters for course/stream membership
            course_q = Q(course__isnull=True)
            
            # 1. Enrolled courses
            enrolled_course_ids = user.enrolled_courses.values_list('id', flat=True)
            course_q |= Q(course_id__in=enrolled_course_ids)
            
            # 2. Matching stream in profile
            if hasattr(user, 'profile') and user.profile.stream:
                user_stream = user.profile.stream.strip()
                if user_stream:
                    course_q |= Q(course__name__iexact=user_stream) | Q(course__code__iexact=user_stream)
            
            # Department alignment
            dept_id = user.department_id
            if dept_id:
                dept_q = (
                    Q(course__department_id=dept_id) |
                    Q(subject__department_id=dept_id) |
                    Q(course__isnull=True, subject__isnull=True) |
                    Q(course__isnull=False, course__department__isnull=True) |
                    Q(subject__isnull=False, subject__department__isnull=True)
                )
            else:
                dept_q = (
                    Q(course__isnull=True, subject__isnull=True) |
                    (Q(course__isnull=False) & Q(course__department__isnull=True)) |
                    (Q(subject__isnull=False) & Q(subject__department__isnull=True))
                )
                
            qs = qs.filter(course_q & dept_q)
                
        return api_success(data=StudyMaterialSerializer(qs, many=True).data)
