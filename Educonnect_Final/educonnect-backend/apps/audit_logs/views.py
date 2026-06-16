from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from core.response import api_success
from core.permissions import IsAdmin
from django.contrib.auth import get_user_model
from apps.attendance.models import AttendanceRecord

User = get_user_model()

class UserDistributionView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        from django.db.models import Count
        data = User.objects.values('role').annotate(count=Count('id'))
        return api_success(data=list(data))

class AttendanceTrendView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        from django.db.models.functions import TruncMonth
        from django.db.models import Count, Q
        qs = (AttendanceRecord.objects
              .annotate(month=TruncMonth('date'))
              .values('month')
              .annotate(total=Count('id'), present=Count('id', filter=Q(status='Present')))
              .order_by('month'))
        data = [{'month': r['month'].strftime('%b %Y') if r['month'] else '', 'rate': round(r['present']/r['total']*100, 1) if r['total'] else 0} for r in qs]
        return api_success(data=data)

class StudentGradesView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        from apps.exams.models import Result
        from django.db.models import Avg
        data = (Result.objects.values('exam__course__name')
                .annotate(avg_marks=Avg('marks'))
                .order_by('exam__course__name'))
        return api_success(data=list(data))
