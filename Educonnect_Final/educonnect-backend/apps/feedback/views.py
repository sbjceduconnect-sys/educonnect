from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from core.response import api_success, api_error
from core.permissions import IsAdmin
from apps.feedback.models import Feedback, OfficeHour
from apps.announcements.serializers import FeedbackSerializer, OfficeHourSerializer
from apps.audit_logs.models import AuditLog
from apps.announcements.serializers import AuditLogSerializer

class FeedbackListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        if IsAdmin().has_permission(request, self):
            qs = Feedback.objects.all()
        else:
            qs = Feedback.objects.filter(submitted_by=request.user)
        return api_success(data=FeedbackSerializer(qs, many=True).data)
    def post(self, request):
        s = FeedbackSerializer(data=request.data)
        if s.is_valid():
            s.save(submitted_by=request.user)
            return api_success(data=s.data, message="Feedback submitted.", status=201)
        return api_error("Validation failed.", errors=s.errors)


class FeedbackSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not IsAdmin().has_permission(request, self):
            return api_error("Permission denied.", status=403)
        
        feedbacks = Feedback.objects.all()
        total = feedbacks.count()
        if total == 0:
            return api_success(data={
                "averageRating": 0.0,
                "totalResponses": 0,
                "ratingDistribution": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
            })
            
        avg_rating = round(sum(f.rating for f in feedbacks) / total, 1)
        dist = {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
        for f in feedbacks:
            r_str = str(f.rating)
            if r_str in dist:
                dist[r_str] += 1
                
        return api_success(data={
            "averageRating": avg_rating,
            "totalResponses": total,
            "ratingDistribution": dist
        })


class FeedbackDepartmentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, dept_id):
        if not IsAdmin().has_permission(request, self):
            return api_error("Permission denied.", status=403)
            
        feedbacks = Feedback.objects.filter(department_id=dept_id)
        total = feedbacks.count()
        
        # Serialize the feedbacks
        serialized_feedbacks = FeedbackSerializer(feedbacks, many=True).data
        
        if total == 0:
            summary = {
                "averageRating": 0.0,
                "totalResponses": 0,
                "ratingDistribution": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
            }
        else:
            avg_rating = round(sum(f.rating for f in feedbacks) / total, 1)
            dist = {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
            for f in feedbacks:
                r_str = str(f.rating)
                if r_str in dist:
                    dist[r_str] += 1
            summary = {
                "averageRating": avg_rating,
                "totalResponses": total,
                "ratingDistribution": dist
            }
            
        return api_success(data={
            "feedbacks": serialized_feedbacks,
            "summary": summary
        })

class OfficeHourListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        qs = OfficeHour.objects.all()
        return api_success(data=OfficeHourSerializer(qs, many=True).data)
    def post(self, request):
        s = OfficeHourSerializer(data=request.data)
        if s.is_valid():
            s.save(teacher=request.user)
            return api_success(data=s.data, message="Office hours created.", status=201)
        return api_error("Validation failed.", errors=s.errors)

class AuditLogListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        if not IsAdmin().has_permission(request, self): return api_error("Permission denied.", status=403)
        qs = AuditLog.objects.all()[:100]
        return api_success(data=AuditLogSerializer(qs, many=True).data)
    def delete(self, request):
        if not IsAdmin().has_permission(request, self): return api_error("Permission denied.", status=403)
        count = AuditLog.objects.count()
        AuditLog.objects.all().delete()
        return api_success(data={"deleted": count}, message=f"Successfully deleted all {count} audit logs.")



class OfficeHourDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get(self, pk):
        try:
            return OfficeHour.objects.get(pk=pk)
        except OfficeHour.DoesNotExist:
            return None

    def get(self, request, pk):
        obj = self._get(pk)
        if not obj:
            return api_error("Office hour slot not found.", status=404)
        return api_success(data=OfficeHourSerializer(obj).data)

    def put(self, request, pk):
        obj = self._get(pk)
        if not obj:
            return api_error("Office hour slot not found.", status=404)
        s = OfficeHourSerializer(obj, data=request.data, partial=True)
        if s.is_valid():
            s.save()
            return api_success(data=s.data, message="Office hour slot updated.")
        return api_error("Validation failed.", errors=s.errors)

    def patch(self, request, pk):
        return self.put(request, pk)

    def delete(self, request, pk):
        obj = self._get(pk)
        if not obj:
            return api_error("Office hour slot not found.", status=404)
        obj.delete()
        return api_success(message="Office hour slot deleted.", status=200)


class OfficeHourBookView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            slot = OfficeHour.objects.get(pk=pk)
        except OfficeHour.DoesNotExist:
            return api_error("Office hour slot not found.", status=404)

        bookings = slot.bookings or []
        for b in bookings:
            if b.get('studentId') == request.user.id and b.get('status') == 'booked':
                return api_error("You have already booked this slot.", status=400)

        booking_data = {
            "studentId": request.user.id,
            "studentName": f"{request.user.first_name} {request.user.last_name}",
            "studentEmail": request.user.email,
            "status": "booked"
        }
        bookings.append(booking_data)
        slot.bookings = bookings
        slot.save()
        return api_success(data=OfficeHourSerializer(slot).data, message="Office hour slot booked successfully.")


class OfficeHourCancelView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk, booking_index):
        try:
            slot = OfficeHour.objects.get(pk=pk)
        except OfficeHour.DoesNotExist:
            return api_error("Office hour slot not found.", status=404)

        bookings = slot.bookings or []
        try:
            idx = int(booking_index)
            if idx < 0 or idx >= len(bookings):
                return api_error("Invalid booking index.", status=400)
            
            bookings[idx]['status'] = 'cancelled'
            slot.bookings = bookings
            slot.save()
            return api_success(data=OfficeHourSerializer(slot).data, message="Booking cancelled successfully.")
        except (ValueError, TypeError, KeyError):
            return api_error("Error processing cancellation.", status=400)

