from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from core.response import api_success, api_error
from apps.calendar_events.models import CalendarEvent
from apps.announcements.serializers import CalendarEventSerializer

class CalendarEventListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user
        if user.role == 'admin':
            qs = CalendarEvent.objects.all()
        else:
            from django.db.models import Q
            if user.department_id:
                qs = CalendarEvent.objects.filter(Q(department__isnull=True) | Q(department_id=user.department_id))
            else:
                qs = CalendarEvent.objects.filter(department__isnull=True)

        start = request.query_params.get('start')
        end   = request.query_params.get('end')
        if start: qs = qs.filter(start_date__gte=start)
        if end:   qs = qs.filter(start_date__lte=end)
        return api_success(data=CalendarEventSerializer(qs, many=True).data)
    def post(self, request):
        s = CalendarEventSerializer(data=request.data)
        if s.is_valid():
            s.save(created_by=request.user)
            return api_success(data=s.data, message="Event created.", status=201)
        return api_error("Validation failed.", errors=s.errors)

class CalendarEventDetailView(APIView):
    permission_classes = [IsAuthenticated]
    def _get(self, pk):
        try: return CalendarEvent.objects.get(pk=pk)
        except CalendarEvent.DoesNotExist: return None
    def put(self, request, pk):
        obj = self._get(pk)
        if not obj: return api_error("Not found.", status=404)
        s = CalendarEventSerializer(obj, data=request.data, partial=True)
        if s.is_valid():
            s.save(); return api_success(data=s.data, message="Event updated.")
        return api_error("Validation failed.", errors=s.errors)
    def delete(self, request, pk):
        obj = self._get(pk)
        if not obj: return api_error("Not found.", status=404)
        obj.delete(); return api_success(message="Event deleted.", status=200)
