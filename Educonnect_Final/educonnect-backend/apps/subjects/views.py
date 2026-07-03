from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from core.response import api_success, api_error
from .models import Subject
from .serializers import SubjectSerializer

class SubjectListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Subject.objects.all()
        
        # Support both formats (camelCase and snake_case query parameters)
        teacher_id = request.query_params.get('teacher_id') or request.query_params.get('teacherId')
        department_id = request.query_params.get('department_id') or request.query_params.get('departmentId')
        
        if teacher_id:
            qs = qs.filter(teacher_id=teacher_id)
        if department_id:
            qs = qs.filter(department_id=department_id)
            
        return api_success(data=SubjectSerializer(qs, many=True).data)

    def post(self, request):
        # Only admin should create subjects
        from core.permissions import IsAdmin
        if not IsAdmin().has_permission(request, self):
            return api_error("Permission denied.", status=403)
            
        s = SubjectSerializer(data=request.data)
        if s.is_valid():
            s.save()
            return api_success(data=s.data, message="Subject created.", status=201)
        return api_error("Validation failed.", errors=s.errors)

class SubjectDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get(self, pk):
        try:
            return Subject.objects.get(pk=pk)
        except Subject.DoesNotExist:
            return None

    def get(self, request, pk):
        obj = self._get(pk)
        if not obj:
            return api_error("Subject not found.", status=404)
        return api_success(data=SubjectSerializer(obj).data)

    def put(self, request, pk):
        from core.permissions import IsAdmin
        if not IsAdmin().has_permission(request, self):
            return api_error("Permission denied.", status=403)
            
        obj = self._get(pk)
        if not obj:
            return api_error("Subject not found.", status=404)
            
        s = SubjectSerializer(obj, data=request.data, partial=True)
        if s.is_valid():
            s.save()
            return api_success(data=s.data, message="Subject updated.")
        return api_error("Validation failed.", errors=s.errors)

    def patch(self, request, pk):
        return self.put(request, pk)

    def delete(self, request, pk):
        from core.permissions import IsAdmin
        if not IsAdmin().has_permission(request, self):
            return api_error("Permission denied.", status=403)
            
        obj = self._get(pk)
        if not obj:
            return api_error("Subject not found.", status=404)
        obj.delete()
        return api_success(message="Subject deleted.", status=200)
