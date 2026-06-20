import random
import string
from django.utils import timezone
from datetime import timedelta
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from core.response import api_success, api_error
from .models import AttendanceRecord, ActiveQRCode
from .serializers import AttendanceSerializer

class AttendanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = AttendanceRecord.objects.all()
        course = request.query_params.get('course') or request.query_params.get('courseId')
        subject = request.query_params.get('subject') or request.query_params.get('subjectId')
        student = request.query_params.get('student') or request.query_params.get('studentId')
        date = request.query_params.get('date')
        if course: qs = qs.filter(course_id=course)
        if subject: qs = qs.filter(subject_id=subject)
        if student: qs = qs.filter(student_id=student)
        if date: qs = qs.filter(date=date)
        return api_success(data=AttendanceSerializer(qs, many=True).data)

    def post(self, request):
        course_id = request.data.get('course_id') or request.data.get('courseId')
        subject_id = request.data.get('subject_id') or request.data.get('subjectId')
        date = request.data.get('date')
        records = request.data.get('records', [])
        
        if not course_id or not subject_id or not date:
            return api_error("course_id, subject_id, and date are required.", status=400)
            
        created = []
        for rec in records:
            raw_status = rec.get('status', 'Absent').capitalize()
            if raw_status in ['Present', 'Absent', 'Late', 'Excused']:
                db_status = raw_status
            else:
                db_status = 'Absent'
                
            obj, _ = AttendanceRecord.objects.update_or_create(
                student_id=rec['student_id'] if 'student_id' in rec else rec['studentId'],
                course_id=course_id,
                subject_id=subject_id,
                date=date,
                defaults={'status': db_status, 'marked_by': request.user, 'method': 'manual'},
            )
            created.append(obj)
        return api_success(
            data={"submitted": len(created)},
            message=f"Attendance saved for {len(created)} students.",
            status=201,
        )


class AttendanceSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id=None):
        if not student_id:
            student_id = request.query_params.get('student') or request.query_params.get('studentId') or request.user.id
            
        qs = AttendanceRecord.objects.filter(student_id=student_id)
        total = qs.count()
        attended = qs.filter(status__in=['Present', 'Late']).count()
        absent = qs.filter(status='Absent').count()
        late = qs.filter(status='Late').count()
        percentage = round((attended / total * 100), 1) if total else 0
        
        return api_success(data={
            "percentage": percentage,
            "attended": attended,
            "totalClasses": total,
            "absent": absent,
            "late": late
        })


class GenerateQRView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        course_id = request.data.get('course_id') or request.data.get('courseId')
        subject_id = request.data.get('subject_id') or request.data.get('subjectId')
        duration = int(request.data.get('duration_minutes') or request.data.get('durationMinutes') or 10)
        
        if not course_id or not subject_id:
            return api_error("course_id and subject_id are required.", status=400)
            
        token = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        expires_at = timezone.now() + timedelta(minutes=duration)
        
        ActiveQRCode.objects.create(
            token=token,
            course_id=course_id,
            subject_id=subject_id,
            expires_at=expires_at
        )
        return api_success(data={"qrToken": token}, message="QR Token generated successfully.")


class ScanQRView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        token = request.data.get('token')
        if not token:
            return api_error("Token is required.", status=400)
        
        try:
            active_qr = ActiveQRCode.objects.get(token=token.upper(), expires_at__gt=timezone.now())
        except ActiveQRCode.DoesNotExist:
            return api_error("Invalid or expired QR token.", status=400)
            
        obj, created = AttendanceRecord.objects.update_or_create(
            student=request.user,
            course=active_qr.course,
            subject=active_qr.subject,
            date=timezone.localdate(),
            defaults={'status': 'Present', 'method': 'qr', 'marked_by': request.user}
        )
        return api_success(message="Attendance marked successfully via QR Code!")


class AttendanceBySubjectView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, subject_id):
        records = AttendanceRecord.objects.filter(subject_id=subject_id)
        grouped = {}
        for rec in records:
            key = (rec.date, rec.method)
            if key not in grouped:
                grouped[key] = {
                    "id": f"{rec.course_id}_{rec.subject_id or 0}_{rec.date}_{rec.method}",
                    "date": rec.date,
                    "method": rec.method,
                    "records": []
                }
            grouped[key]["records"].append({
                "studentId": rec.student.id,
                "status": rec.status.lower()
            })
            
        return api_success(data=list(grouped.values()))


class AttendanceByStudentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        qs = AttendanceRecord.objects.filter(student_id=student_id)
        data = []
        for rec in qs:
            data.append({
                "id": rec.id,
                "date": rec.date,
                "subjectId": rec.subject.name if rec.subject else (rec.course.name if rec.course else 'General'),
                "status": rec.status.lower()
            })
        return api_success(data=data)


class AttendanceReportsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = AttendanceRecord.objects.all()
        
        subject_id = request.query_params.get('subjectId') or request.query_params.get('subject_id')
        start_date = request.query_params.get('startDate') or request.query_params.get('start_date')
        end_date = request.query_params.get('endDate') or request.query_params.get('end_date')
        
        if subject_id:
            qs = qs.filter(subject_id=subject_id)
        if start_date:
            qs = qs.filter(date__gte=start_date)
        if end_date:
            qs = qs.filter(date__lte=end_date)
            
        grouped = {}
        for rec in qs:
            key = (rec.date, rec.course_id, rec.subject_id, rec.marked_by_id, rec.method)
            if key not in grouped:
                grouped[key] = {
                    "id": f"{rec.course_id}_{rec.subject_id or 0}_{rec.date}_{rec.method}",
                    "date": rec.date,
                    "courseTitle": rec.course.name if rec.course else 'Unknown Class',
                    "subjectName": rec.subject.name if rec.subject else 'General',
                    "markedByName": rec.marked_by.get_full_name() if rec.marked_by else 'System',
                    "method": rec.method,
                    "presentCount": 0,
                    "totalCount": 0,
                    "records": []
                }
            
            is_present = rec.status in ['Present', 'Late']
            if is_present:
                grouped[key]["presentCount"] += 1
            grouped[key]["totalCount"] += 1
            
            grouped[key]["records"].append({
                "studentId": rec.student.id,
                "studentName": rec.student.get_full_name(),
                "enrollmentNo": getattr(rec.student.profile, 'enrollment_no', 'N/A') if hasattr(rec.student, 'profile') else 'N/A',
                "status": rec.status.lower()
            })
            
        return api_success(data=list(grouped.values()))


class AttendanceDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        pk_str = str(pk)
        if "_" in pk_str:
            parts = pk_str.split("_")
            if len(parts) >= 4:
                course_id = parts[0]
                subject_id = parts[1]
                date = parts[2]
                method = parts[3]
                
                q = AttendanceRecord.objects.filter(
                    course_id=course_id,
                    date=date,
                    method=method
                )
                if subject_id != '0':
                    q = q.filter(subject_id=subject_id)
                count = q.delete()[0]
                return api_success(message=f"Deleted {count} attendance records.")
        
        try:
            rec = AttendanceRecord.objects.get(pk=pk)
            rec.delete()
            return api_success(message="Attendance record deleted.")
        except AttendanceRecord.DoesNotExist:
            return api_error("Not found.", status=404)
