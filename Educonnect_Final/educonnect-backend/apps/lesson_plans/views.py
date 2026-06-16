from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from core.response import api_success, api_error
from core.permissions import IsAdminOrTeacher
from .models import LessonPlan
from .serializers import LessonPlanSerializer

class LessonPlanListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = LessonPlan.objects.all()
        
        teacher_id = request.query_params.get('teacher_id') or request.query_params.get('teacherId')
        course_id = request.query_params.get('course_id') or request.query_params.get('courseId')
        subject_id = request.query_params.get('subject_id') or request.query_params.get('subjectId')
        
        if teacher_id:
            qs = qs.filter(teacher_id=teacher_id)
        if course_id:
            qs = qs.filter(course_id=course_id)
        if subject_id:
            qs = qs.filter(subject_id=subject_id)
            
        return api_success(data=LessonPlanSerializer(qs, many=True).data)

    def post(self, request):
        if not IsAdminOrTeacher().has_permission(request, self):
            return api_error("Permission denied.", status=403)
            
        s = LessonPlanSerializer(data=request.data)
        if s.is_valid():
            s.save(teacher=request.user)
            return api_success(data=s.data, message="Lesson plan created.", status=201)
        return api_error("Validation failed.", errors=s.errors)


class LessonPlanDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get(self, pk):
        try:
            return LessonPlan.objects.get(pk=pk)
        except LessonPlan.DoesNotExist:
            return None

    def get(self, request, pk):
        obj = self._get(pk)
        if not obj:
            return api_error("Lesson plan not found.", status=404)
        return api_success(data=LessonPlanSerializer(obj).data)

    def put(self, request, pk):
        obj = self._get(pk)
        if not obj:
            return api_error("Lesson plan not found.", status=404)
            
        s = LessonPlanSerializer(obj, data=request.data, partial=True)
        if s.is_valid():
            s.save()
            return api_success(data=s.data, message="Lesson plan updated.")
        return api_error("Validation failed.", errors=s.errors)

    def patch(self, request, pk):
        return self.put(request, pk)

    def delete(self, request, pk):
        if not IsAdminOrTeacher().has_permission(request, self):
            return api_error("Permission denied.", status=403)
            
        obj = self._get(pk)
        if not obj:
            return api_error("Lesson plan not found.", status=404)
        obj.delete()
        return api_success(message="Lesson plan deleted.", status=200)
