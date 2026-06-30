import random
import string
from django.utils import timezone
from datetime import timedelta
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from core.response import api_success, api_error
from .models import AttendanceRecord, ActiveQRCode, AttendanceEditRequest
from .serializers import AttendanceSerializer, AttendanceEditRequestSerializer

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
        is_draft = request.data.get('is_draft') or request.data.get('isDraft') or False
        
        if not course_id or not subject_id or not date:
            return api_error("course_id, subject_id, and date are required.", status=400)
            
        created = []
        is_admin = request.user.role == 'admin'

        for rec in records:
            student_id = rec.get('student_id') or rec.get('studentId')
            if not student_id:
                continue
                
            raw_status = rec.get('status', 'Absent').capitalize()
            if raw_status in ['Present', 'Absent', 'Late', 'Excused']:
                db_status = raw_status
            else:
                db_status = 'Absent'
                
            # Check lock state
            existing = AttendanceRecord.objects.filter(
                student_id=student_id,
                course_id=course_id,
                subject_id=subject_id,
                date=date
            ).first()

            if existing:
                # If the existing record is a draft, standard users (teachers) CAN edit it
                # If it's NOT a draft, only admin can edit it directly
                if not existing.is_draft and not is_admin:
                    # If status is modified, standard users (teachers) cannot update locked record!
                    if existing.status.capitalize() != db_status:
                        return api_error(
                            f"Attendance record is locked. Standard users cannot modify submitted attendance.",
                            status=403
                        )
                    continue
                else:
                    existing.status = db_status
                    existing.is_draft = is_draft
                    existing.marked_by = request.user
                    existing.save()
                    created.append(existing)
            else:
                obj = AttendanceRecord.objects.create(
                    student_id=student_id,
                    course_id=course_id,
                    subject_id=subject_id,
                    date=date,
                    status=db_status,
                    marked_by=request.user,
                    method='manual',
                    is_draft=is_draft
                )
                created.append(obj)
                
        return api_success(
            data={"submitted": len(created)},
            message=f"Attendance saved as {'Draft' if is_draft else 'Final'} for {len(created)} students.",
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
            
        # Check if record already exists
        existing_record = AttendanceRecord.objects.filter(
            student=request.user,
            course=active_qr.course,
            subject=active_qr.subject,
            date=timezone.localdate()
        ).first()

        if existing_record:
            if existing_record.status.capitalize() == 'Present':
                return api_success(message="Attendance marked successfully via QR Code!")
            else:
                return api_error("Attendance record is locked. Cannot overwrite submitted attendance.", status=400)

        obj = AttendanceRecord.objects.create(
            student=request.user,
            course=active_qr.course,
            subject=active_qr.subject,
            date=timezone.localdate(),
            status='Present',
            method='qr',
            marked_by=request.user
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


class AttendanceEditRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role == 'admin':
            qs = AttendanceEditRequest.objects.all()
        elif request.user.role == 'teacher':
            qs = AttendanceEditRequest.objects.filter(requested_by=request.user)
        else:
            return api_error("Only admins and teachers can view edit requests.", status=403)
            
        course_id = request.query_params.get('courseId') or request.query_params.get('course_id')
        subject_id = request.query_params.get('subjectId') or request.query_params.get('subject_id')
        date = request.query_params.get('date')
        status = request.query_params.get('status')
        
        if course_id:
            qs = qs.filter(attendance_record__course_id=course_id)
        if subject_id:
            qs = qs.filter(attendance_record__subject_id=subject_id)
        if date:
            qs = qs.filter(attendance_record__date=date)
        if status:
            qs = qs.filter(status=status)
            
        serializer = AttendanceEditRequestSerializer(qs, many=True)
        return api_success(data=serializer.data)

    def post(self, request):
        if request.user.role not in ['teacher', 'admin']:
            return api_error("Only teachers and admins can create edit requests.", status=403)
            
        serializer = AttendanceEditRequestSerializer(data=request.data)
        if serializer.is_valid():
            attendance_record = serializer.validated_data['attendance_record']
            if AttendanceEditRequest.objects.filter(attendance_record=attendance_record, status='Pending').exists():
                return api_error("A pending edit request already exists for this attendance record.", status=400)
                
            serializer.save(requested_by=request.user)
            return api_success(data=serializer.data, message="Edit request submitted successfully.", status=201)
        return api_error(serializer.errors, status=400)


class AttendanceEditRequestActionView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if request.user.role != 'admin':
            return api_error("Only administrators can approve or reject edit requests.", status=403)
            
        try:
            edit_req = AttendanceEditRequest.objects.get(pk=pk)
        except AttendanceEditRequest.DoesNotExist:
            return api_error("Edit request not found.", status=404)
            
        if edit_req.status != 'Pending':
            return api_error(f"This request has already been {edit_req.status.lower()}.", status=400)
            
        action = request.data.get('action')
        if action == 'approve':
            edit_req.status = 'Approved'
            record = edit_req.attendance_record
            record.status = edit_req.new_status
            record.marked_by = edit_req.requested_by
            record.save()
            edit_req.save()
            return api_success(message="Edit request approved. Attendance record updated.")
        elif action == 'reject':
            edit_req.status = 'Rejected'
            edit_req.save()
            return api_success(message="Edit request rejected.")
        else:
            return api_error("Invalid action. Must be 'approve' or 'reject'.", status=400)
