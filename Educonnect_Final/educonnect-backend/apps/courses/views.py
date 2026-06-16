from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from core.response import api_success, api_error
from core.permissions import IsAdminOrTeacher
from apps.accounts.serializers import UserSerializer
from .models import Course
from .serializers import CourseSerializer

class CourseListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Course.objects.all()
        
        # Support filtering by teacher, student, or department
        teacher_id = request.query_params.get('teacher_id') or request.query_params.get('teacherId')
        student_id = request.query_params.get('student_id') or request.query_params.get('studentId')
        department_id = request.query_params.get('department_id') or request.query_params.get('departmentId')
        
        if teacher_id:
            qs = qs.filter(teacher_id=teacher_id)
        if student_id:
            qs = qs.filter(students__id=student_id)
        if department_id:
            qs = qs.filter(department_id=department_id)
            
        return api_success(data=CourseSerializer(qs, many=True).data)

    def post(self, request):
        if not IsAdminOrTeacher().has_permission(request, self):
            return api_error("Permission denied.", status=403)
        s = CourseSerializer(data=request.data)
        if s.is_valid():
            s.save()
            return api_success(data=s.data, message="Course created.", status=201)
        return api_error("Validation failed.", errors=s.errors)


class CourseDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get(self, pk):
        try:
            return Course.objects.get(pk=pk)
        except Course.DoesNotExist:
            return None

    def get(self, request, pk):
        obj = self._get(pk)
        if not obj:
            return api_error("Course not found.", status=404)
        return api_success(data=CourseSerializer(obj).data)

    def put(self, request, pk):
        obj = self._get(pk)
        if not obj:
            return api_error("Course not found.", status=404)
        s = CourseSerializer(obj, data=request.data, partial=True)
        if s.is_valid():
            s.save()
            return api_success(data=s.data, message="Course updated.")
        return api_error("Validation failed.", errors=s.errors)

    def patch(self, request, pk):
        return self.put(request, pk)

    def delete(self, request, pk):
        if not IsAdminOrTeacher().has_permission(request, self):
            return api_error("Permission denied.", status=403)
        obj = self._get(pk)
        if not obj:
            return api_error("Course not found.", status=404)
        obj.delete()
        return api_success(message="Course deleted.", status=200)


class CourseEnrollView(APIView):
    permission_classes = [IsAuthenticated]

    def _get(self, pk):
        try:
            return Course.objects.get(pk=pk)
        except Course.DoesNotExist:
            return None

    def post(self, request, pk):
        if not IsAdminOrTeacher().has_permission(request, self):
            return api_error("Permission denied.", status=403)
        course = self._get(pk)
        if not course:
            return api_error("Course not found.", status=404)
            
        student_ids = request.data.get('student_ids') or request.data.get('studentIds', [])
        if not student_ids:
            return api_error("Student IDs list is required.", status=400)
            
        course.students.add(*student_ids)
        return api_success(message=f"Successfully enrolled {len(student_ids)} students.")

    def delete(self, request, pk, student_id):
        if not IsAdminOrTeacher().has_permission(request, self):
            return api_error("Permission denied.", status=403)
        course = self._get(pk)
        if not course:
            return api_error("Course not found.", status=404)
            
        course.students.remove(student_id)
        return api_success(message="Student removed from course.")


class CourseStudentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            course = Course.objects.get(pk=pk)
        except Course.DoesNotExist:
            return api_error("Course not found.", status=404)
            
        students = course.students.all()
        return api_success(data=UserSerializer(students, many=True).data)
