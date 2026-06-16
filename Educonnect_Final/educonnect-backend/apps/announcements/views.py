from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from core.response import api_success, api_error
from core.permissions import IsAdmin
from apps.announcements.models import Announcement
from apps.announcements.serializers import AnnouncementSerializer

class AnnouncementListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        qs = Announcement.objects.all()
        return api_success(data=AnnouncementSerializer(qs, many=True).data)
    def post(self, request):
        s = AnnouncementSerializer(data=request.data)
        if s.is_valid():
            s.save(author=request.user)
            return api_success(data=s.data, message="Announcement created.", status=201)
        return api_error("Validation failed.", errors=s.errors)

class AnnouncementDetailView(APIView):
    permission_classes = [IsAuthenticated]
    def _get(self, pk):
        try: return Announcement.objects.get(pk=pk)
        except Announcement.DoesNotExist: return None
    def put(self, request, pk):
        obj = self._get(pk)
        if not obj: return api_error("Not found.", status=404)
        s = AnnouncementSerializer(obj, data=request.data, partial=True)
        if s.is_valid():
            s.save(); return api_success(data=s.data, message="Updated.")
        return api_error("Validation failed.", errors=s.errors)
    def delete(self, request, pk):
        obj = self._get(pk)
        if not obj: return api_error("Not found.", status=404)
        if not (IsAdmin().has_permission(request, self) or obj.author == request.user):
            return api_error("Permission denied.", status=403)
        obj.delete(); return api_success(message="Deleted.", status=200)
