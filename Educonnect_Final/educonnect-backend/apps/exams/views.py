from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from core.response import api_success, api_error
from core.permissions import IsAdminOrTeacher
from core.case import convert_dict_keys, camel_to_snake
from apps.accounts.models import User
from .models import Exam, Result
from .serializers import ExamSerializer, ResultSerializer

class ExamListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Exam.objects.all()
        course = request.query_params.get('course') or request.query_params.get('courseId')
        teacher_id = request.query_params.get('teacherId') or request.query_params.get('teacher_id')
        student_id = request.query_params.get('studentId') or request.query_params.get('student_id')
        
        if course: 
            qs = qs.filter(course_id=course)
        if teacher_id:
            qs = qs.filter(course__teacher_id=teacher_id)
        if student_id:
            qs = qs.filter(course__students__id=student_id)
            
        return api_success(data=ExamSerializer(qs, many=True).data)

    def post(self, request):
        if not IsAdminOrTeacher().has_permission(request, self): 
            return api_error("Permission denied.", status=403)
        s = ExamSerializer(data=request.data)
        if s.is_valid():
            s.save()
            return api_success(data=s.data, message="Exam created.", status=201)
        return api_error("Validation failed.", errors=s.errors)


class ExamDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get(self, pk):
        try: 
            return Exam.objects.get(pk=pk)
        except Exam.DoesNotExist: 
            return None

    def get(self, request, pk):
        obj = self._get(pk)
        if not obj:
            return api_error("Exam not found.", status=404)
        return api_success(data=ExamSerializer(obj).data)

    def put(self, request, pk):
        obj = self._get(pk)
        if not obj: 
            return api_error("Exam not found.", status=404)
        s = ExamSerializer(obj, data=request.data, partial=True)
        if s.is_valid():
            s.save()
            return api_success(data=s.data, message="Exam updated.")
        return api_error("Validation failed.", errors=s.errors)

    def patch(self, request, pk):
        return self.put(request, pk)

    def delete(self, request, pk):
        if not IsAdminOrTeacher().has_permission(request, self): 
            return api_error("Permission denied.", status=403)
        obj = self._get(pk)
        if not obj: 
            return api_error("Exam not found.", status=404)
        obj.delete()
        return api_success(message="Exam deleted.", status=200)


class ResultListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role == 'student' and not request.user.fees_paid:
            return api_error("Results are locked. Please clear your outstanding dues to access them.", status=403)
        qs = Result.objects.all()
        if request.user.role == 'student':
            qs = qs.filter(is_published=True)
        student = request.query_params.get('student') or request.query_params.get('studentId')
        exam = request.query_params.get('exam') or request.query_params.get('examId')
        
        if student: 
            qs = qs.filter(student_id=student)
        if exam: 
            qs = qs.filter(exam_id=exam)
            
        return api_success(data=ResultSerializer(qs, many=True).data)

    def post(self, request):
        # Result entry batch endpoint — handles both camelCase and snake_case
        raw_results = request.data.get('results', [])
        
        if not raw_results:
            return api_error("results list is required.", status=400)
            
        saved = []
        for r in raw_results:
            student_id = r.get('studentId') or r.get('student_id')
            exam_id = r.get('examId') or r.get('exam_id')
            marks = r.get('marksObtained') or r.get('marks_obtained') or r.get('marks', 0)
            remarks = r.get('remarks', '')
            
            if not student_id or not exam_id:
                continue
                
            obj, _ = Result.objects.update_or_create(
                student_id=student_id,
                exam_id=exam_id,
                defaults={
                    'marks': marks,
                    'remarks': remarks
                }
            )
            saved.append(obj)
        return api_success(data={"saved": len(saved)}, message=f"{len(saved)} results saved.", status=201)


class ResultBulkView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = convert_dict_keys(request.data, camel_to_snake)
        exam_id = data.get('exam_id')
        results_data = data.get('results', [])
        
        if not exam_id or not results_data: 
            return api_error("exam_id and results are required.", status=400)
        try: 
            exam = Exam.objects.get(pk=exam_id)
        except Exam.DoesNotExist: 
            return api_error("Exam not found.", status=404)
            
        saved = []
        for r in results_data:
            obj, _ = Result.objects.update_or_create(
                student_id=r['student_id'], 
                exam=exam,
                defaults={'marks': r.get('marks', 0), 'remarks': r.get('remarks', '')},
            )
            saved.append(obj)
        return api_success(data={"saved": len(saved)}, message=f"{len(saved)} results saved.", status=201)


class ResultDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        data = convert_dict_keys(request.data, camel_to_snake)
        try:
            obj = Result.objects.get(pk=pk)
        except Result.DoesNotExist:
            return api_error("Result not found.", status=404)
            
        if 'marks_obtained' in data:
            obj.marks = data['marks_obtained']
        if 'remarks' in data:
            obj.remarks = data['remarks']
        obj.save()
        return api_success(data=ResultSerializer(obj).data, message="Result updated.")


class ResultByExamView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, exam_id):
        qs = Result.objects.filter(exam_id=exam_id)
        return api_success(data=ResultSerializer(qs, many=True).data)


class ResultByStudentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        if request.user.role == 'student' and not request.user.fees_paid:
            return api_error("Results are locked. Please clear your outstanding dues to access them.", status=403)
        qs = Result.objects.filter(student_id=student_id)
        if request.user.role == 'student':
            qs = qs.filter(is_published=True)
        return api_success(data=ResultSerializer(qs, many=True).data)


class ResultPerformanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        if request.user.role == 'student' and not request.user.fees_paid:
            return api_error("Results are locked. Please clear your outstanding dues to access them.", status=403)
        qs = Result.objects.filter(student_id=student_id)
        if request.user.role == 'student':
            qs = qs.filter(is_published=True)
        total = qs.count()
        passed = 0
        total_pct = 0
        grades = {}
        for r in qs:
            pct = (r.marks / r.exam.max_marks * 100) if r.exam.max_marks else 0
            if pct >= 40:
                passed += 1
            total_pct += pct
            grades[r.grade] = grades.get(r.grade, 0) + 1
            
        average_pct = round(total_pct / total, 1) if total else 0
        overall_grade = 'A+' if average_pct>=90 else 'A' if average_pct>=80 else 'B+' if average_pct>=75 else 'B' if average_pct>=70 else 'C' if average_pct>=60 else 'D' if average_pct>=50 else 'F' if qs.exists() else 'N/A'
        
        return api_success(data={
            "totalSubjects": total,
            "passed": passed,
            "averagePercentage": average_pct,
            "overallGrade": overall_grade,
            "gradeDistribution": grades
        })


class ResultPublishView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, exam_id):
        count = Result.objects.filter(exam_id=exam_id).update(is_published=True)
        return api_success(message=f"Successfully published {count} exam results.")


class ResultProgressReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        if request.user.role == 'student' and not request.user.fees_paid:
            return api_error("Results are locked. Please clear your outstanding dues to access them.", status=403)
        try:
            student = User.objects.get(pk=student_id)
        except User.DoesNotExist:
            return api_error("Student not found.", status=404)
            
        results = Result.objects.filter(student=student)
        if request.user.role == 'student':
            results = results.filter(is_published=True)
        
        from io import BytesIO
        from django.utils import timezone
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch

        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=54, leftMargin=54, topMargin=54, bottomMargin=54)
        story = []

        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=24,
            leading=28,
            textColor=colors.HexColor('#1B3F6B'),
            alignment=1, # Center
            spaceAfter=15
        )
        subtitle_style = ParagraphStyle(
            'SubtitleStyle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=12,
            leading=16,
            textColor=colors.HexColor('#555555'),
            alignment=1, # Center
            spaceAfter=25
        )
        header_style = ParagraphStyle(
            'HeaderStyle',
            parent=styles['Heading3'],
            fontName='Helvetica-Bold',
            fontSize=14,
            textColor=colors.HexColor('#1B3F6B'),
            spaceAfter=10
        )
        body_bold = ParagraphStyle(
            'BodyBold',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=10,
            leading=14
        )
        body_normal = ParagraphStyle(
            'BodyNormal',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=14
        )
        header_cell_style = ParagraphStyle(
            'HeaderCellStyle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=10,
            leading=14,
            textColor=colors.white
        )

        # Title & Institution Header
        story.append(Paragraph("SAIBALAJI JUNIOR COLLEGE", title_style))
        story.append(Paragraph("Official Student Academic Progress Report", subtitle_style))
        story.append(Spacer(1, 10))

        # Student Details Section (2-column layout)
        student_details = [
            [Paragraph("<b>Student Name:</b>", body_normal), Paragraph(student.get_full_name(), body_normal),
             Paragraph("<b>Enrollment/Reg No:</b>", body_normal), Paragraph(getattr(student.profile, 'enrollment_no', 'N/A') or 'N/A', body_normal)],
            [Paragraph("<b>Stream:</b>", body_normal), Paragraph(getattr(student.profile, 'stream', 'N/A') or 'N/A', body_normal),
             Paragraph("<b>Section:</b>", body_normal), Paragraph(getattr(student.profile, 'section', 'N/A') or 'N/A', body_normal)],
            [Paragraph("<b>Date of Report:</b>", body_normal), Paragraph(timezone.now().strftime("%B %d, %Y"), body_normal),
             Paragraph("<b>Status:</b>", body_normal), Paragraph("Active", body_normal)]
        ]
        t_details = Table(student_details, colWidths=[1.2*inch, 2.0*inch, 1.5*inch, 1.8*inch])
        t_details.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#D5DDE6')),
            ('PADDING', (0,0), (-1,-1), 6),
            ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#F8FAFC')),
            ('BACKGROUND', (2,0), (2,-1), colors.HexColor('#F8FAFC')),
        ]))
        story.append(t_details)
        story.append(Spacer(1, 20))

        # Results Table
        story.append(Paragraph("Examination Grades Registry", header_style))

        results_data = [[
            Paragraph("Exam Title", header_cell_style),
            Paragraph("Subject", header_cell_style),
            Paragraph("Marks Obtained", header_cell_style),
            Paragraph("Max Marks", header_cell_style),
            Paragraph("Percentage", header_cell_style),
            Paragraph("Grade", header_cell_style),
            Paragraph("Remarks", header_cell_style)
        ]]

        total_obtained = 0
        total_max = 0

        for r in results:
            pct = (r.marks / r.exam.max_marks * 100) if r.exam.max_marks else 0
            total_obtained += r.marks
            total_max += r.exam.max_marks
            results_data.append([
                Paragraph(r.exam.title, body_normal),
                Paragraph(r.exam.subject.name if r.exam.subject else 'General', body_normal),
                Paragraph(str(r.marks), body_normal),
                Paragraph(str(r.exam.max_marks), body_normal),
                Paragraph(f"{pct:.1f}%", body_normal),
                Paragraph(r.grade, body_bold),
                Paragraph(r.remarks, body_normal)
            ])

        # Calculate summary stats
        overall_pct = (total_obtained / total_max * 100) if total_max > 0 else 0
        overall_gpa = f"{((overall_pct / 100) * 10):.2f}"

        results_data.append([
            Paragraph("<b>OVERALL SUMMARY</b>", body_bold),
            Paragraph("", body_bold),
            Paragraph(f"<b>{total_obtained}</b>", body_bold),
            Paragraph(f"<b>{total_max}</b>", body_bold),
            Paragraph(f"<b>{overall_pct:.1f}%</b>", body_bold),
            Paragraph(f"<b>GPA: {overall_gpa}</b>", body_bold),
            Paragraph("PASS" if overall_pct >= 40 else "FAIL", body_bold)
        ])

        t_results = Table(results_data, colWidths=[1.3*inch, 1.3*inch, 1.1*inch, 0.8*inch, 0.8*inch, 0.8*inch, 1.1*inch])
        t_results.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1B3F6B')),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('BOTTOMPADDING', (0,0), (-1,0), 8),
            ('TOPPADDING', (0,0), (-1,0), 8),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#D5DDE6')),
            ('ROWBACKGROUNDS', (0,1), (-1,-2), [colors.white, colors.HexColor('#F8FAFC')]),
            ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#E2E8F0')),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))

        story.append(t_results)
        story.append(Spacer(1, 30))

        # Signatures Section
        sig_data = [
            [Paragraph("_______________________<br/><b>Class Instructor</b>", body_normal), 
             Paragraph("_______________________<br/><b>Principal / Administration</b>", body_normal)]
        ]
        t_sig = Table(sig_data, colWidths=[3.5*inch, 3.5*inch])
        t_sig.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        story.append(t_sig)

        doc.build(story)
        buffer.seek(0)

        response = HttpResponse(buffer.read(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="progress_report_{student_id}.pdf"'
        return response
