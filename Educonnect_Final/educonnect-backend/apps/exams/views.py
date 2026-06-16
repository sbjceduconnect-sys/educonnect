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
        qs = Result.objects.all()
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
        qs = Result.objects.filter(student_id=student_id)
        return api_success(data=ResultSerializer(qs, many=True).data)


class ResultPerformanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        qs = Result.objects.filter(student_id=student_id)
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
        try:
            student = User.objects.get(pk=student_id)
        except User.DoesNotExist:
            return api_error("Student not found.", status=404)
            
        results = Result.objects.filter(student=student)
        
        import csv
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="progress_report_{student_id}.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Progress Report', student.get_full_name(), 'Enrollment:', getattr(student.profile, 'enrollment_no', 'N/A')])
        writer.writerow([])
        writer.writerow(['Exam', 'Marks Obtained', 'Max Marks', 'Percentage', 'Grade', 'Remarks'])
        
        for r in results:
            pct = (r.marks / r.exam.max_marks * 100) if r.exam.max_marks else 0
            writer.writerow([r.exam.title, r.marks, r.exam.max_marks, f"{pct:.1f}%", r.grade, r.remarks])
            
        return response
