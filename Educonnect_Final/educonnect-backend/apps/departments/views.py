from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from core.response import api_success, api_error
from core.permissions import IsAdmin
from .models import Department
from .serializers import DepartmentSerializer


class DepartmentListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Department.objects.all()
        return api_success(data=DepartmentSerializer(qs, many=True).data)

    def post(self, request):
        if not IsAdmin().has_permission(request, self):
            return api_error("Only admins can create departments.", status=403)
        s = DepartmentSerializer(data=request.data)
        if s.is_valid():
            s.save()
            return api_success(data=s.data, message="Department created.", status=201)
        return api_error("Validation failed.", errors=s.errors)


class DepartmentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get(self, pk):
        try: return Department.objects.get(pk=pk)
        except Department.DoesNotExist: return None

    def get(self, request, pk):
        obj = self._get(pk)
        if not obj: return api_error("Not found.", status=404)
        return api_success(data=DepartmentSerializer(obj).data)

    def put(self, request, pk):
        if not IsAdmin().has_permission(request, self): return api_error("Permission denied.", status=403)
        obj = self._get(pk)
        if not obj: return api_error("Not found.", status=404)
        s = DepartmentSerializer(obj, data=request.data, partial=True)
        if s.is_valid():
            s.save()
            return api_success(data=s.data, message="Department updated.")
        return api_error("Validation failed.", errors=s.errors)

    def delete(self, request, pk):
        if not IsAdmin().has_permission(request, self): return api_error("Permission denied.", status=403)
        obj = self._get(pk)
        if not obj: return api_error("Not found.", status=404)
        obj.delete()
        return api_success(message="Department deleted.", status=200)


class DepartmentAssignHodView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if not IsAdmin().has_permission(request, self):
            return api_error("Permission denied.", status=403)
        try:
            dept = Department.objects.get(pk=pk)
        except Department.DoesNotExist:
            return api_error("Department not found.", status=404)
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        hod_id = request.data.get('hodId') or request.data.get('hod_id')
        if hod_id is None or hod_id == "":
            dept.hod = None
        else:
            try:
                user = User.objects.get(pk=hod_id)
                dept.hod = user
            except User.DoesNotExist:
                return api_error("User not found.", status=404)
        
        dept.save()
        return api_success(data=DepartmentSerializer(dept).data, message="HoD assigned successfully.")
