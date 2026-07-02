import os
from django.utils import timezone
from django.http import FileResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from core.response import api_success, api_error
from core.permissions import IsStudent, IsAdminOrTeacher, IsApproved
from apps.courses.models import Course
from .models import Assignment, AssignmentSubmission
from .serializers import (
    AssignmentSerializer, 
    AssignmentSubmissionSerializer, 
    GradeSubmissionSerializer
)

def user_has_access_to_assignment(user, assignment):
    if user.role in ('admin', 'teacher'):
        return True
    if user.role == 'student':
        if not assignment.course:
            return True
        return assignment.course.students.filter(id=user.id).exists()
    return False


class AssignmentListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsApproved]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        user = request.user
        if user.role == 'admin':
            qs = Assignment.objects.all()
        elif user.role == 'teacher':
            # View assignments they created or teach the course for
            qs = Assignment.objects.filter(teacher=user) | Assignment.objects.filter(course__teacher=user)
            qs = qs.distinct()
        else:  # student
            # View assignments for enrolled courses
            enrolled_course_ids = user.enrolled_courses.values_list('id', flat=True)
            qs = Assignment.objects.filter(course_id__in=enrolled_course_ids)

        # Filters
        course_id = request.query_params.get('courseId') or request.query_params.get('course_id')
        subject_id = request.query_params.get('subjectId') or request.query_params.get('subject_id')
        if course_id:
            qs = qs.filter(course_id=course_id)
        if subject_id:
            qs = qs.filter(subject_id=subject_id)

        serializer = AssignmentSerializer(qs, many=True, context={'request': request})
        return api_success(data=serializer.data)

    def post(self, request):
        if not request.user.role in ('teacher', 'admin'):
            return api_error("Only teachers and admins can create assignments.", status=403)
            
        serializer = AssignmentSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(teacher=request.user)
            return api_success(data=serializer.data, message="Assignment created successfully.", status=201)
        return api_error("Failed to create assignment.", errors=serializer.errors)


class AssignmentDetailView(APIView):
    permission_classes = [IsAuthenticated, IsApproved]
    parser_classes = [MultiPartParser, FormParser]

    def _get_object(self, pk):
        try:
            return Assignment.objects.get(pk=pk)
        except Assignment.DoesNotExist:
            return None

    def get(self, request, pk):
        assignment = self._get_object(pk)
        if not assignment:
            return api_error("Assignment not found.", status=404)
        if not user_has_access_to_assignment(request.user, assignment):
            return api_error("You do not have permission to access this assignment.", status=403)
            
        serializer = AssignmentSerializer(assignment, context={'request': request})
        return api_success(data=serializer.data)

    def put(self, request, pk):
        assignment = self._get_object(pk)
        if not assignment:
            return api_error("Assignment not found.", status=404)
        if not request.user.role in ('teacher', 'admin') or assignment.teacher != request.user:
            if request.user.role != 'admin':
                return api_error("You do not have permission to edit this assignment.", status=403)

        serializer = AssignmentSerializer(assignment, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return api_success(data=serializer.data, message="Assignment updated successfully.")
        return api_error("Failed to update assignment.", errors=serializer.errors)

    def patch(self, request, pk):
        return self.put(request, pk)

    def delete(self, request, pk):
        assignment = self._get_object(pk)
        if not assignment:
            return api_error("Assignment not found.", status=404)
        if not request.user.role in ('teacher', 'admin') or assignment.teacher != request.user:
            if request.user.role != 'admin':
                return api_error("You do not have permission to delete this assignment.", status=403)
                
        assignment.delete()
        return api_success(message="Assignment deleted successfully.")


class AssignmentSubmitView(APIView):
    permission_classes = [IsAuthenticated, IsApproved, IsStudent]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        try:
            assignment = Assignment.objects.get(pk=pk)
        except Assignment.DoesNotExist:
            return api_error("Assignment not found.", status=404)

        # Check if student is enrolled in the course
        is_enrolled = assignment.course.students.filter(id=request.user.id).exists()
        if not is_enrolled:
            return api_error("You are not enrolled in the course for this assignment.", status=403)

        # Check file in request
        file_obj = request.FILES.get('file')
        if not file_obj:
            return api_error("Please upload a file submission.", status=400)

        # Create or update submission
        submission, created = AssignmentSubmission.objects.get_or_create(
            assignment=assignment,
            student=request.user,
            defaults={'file': file_obj, 'remarks': request.data.get('remarks', '')}
        )

        if not created:
            # Update existing submission and reset grading status
            submission.file = file_obj
            submission.remarks = request.data.get('remarks', '')
            submission.submitted_at = timezone.now()
            submission.marks = None
            submission.feedback = ''
            submission.graded = False
            submission.graded_at = None
            submission.save()
            msg = "Assignment submission updated successfully."
        else:
            msg = "Assignment submitted successfully."

        serializer = AssignmentSubmissionSerializer(submission, context={'request': request})
        return api_success(data=serializer.data, message=msg, status=200)


class AssignmentSubmissionsListView(APIView):
    permission_classes = [IsAuthenticated, IsApproved, IsAdminOrTeacher]

    def get(self, request, pk):
        try:
            assignment = Assignment.objects.get(pk=pk)
        except Assignment.DoesNotExist:
            return api_error("Assignment not found.", status=404)

        # Verify teacher permissions
        if request.user.role == 'teacher' and assignment.teacher != request.user:
            if assignment.course.teacher != request.user:
                return api_error("You do not have permission to view submissions for this assignment.", status=403)

        submissions = AssignmentSubmission.objects.filter(assignment=assignment).order_by('-submitted_at')
        serializer = AssignmentSubmissionSerializer(submissions, many=True, context={'request': request})
        return api_success(data=serializer.data)


class GradeSubmissionView(APIView):
    permission_classes = [IsAuthenticated, IsApproved, IsAdminOrTeacher]

    def patch(self, request, pk):
        try:
            submission = AssignmentSubmission.objects.get(pk=pk)
        except AssignmentSubmission.DoesNotExist:
            return api_error("Submission not found.", status=404)

        # Verify teacher permissions
        assignment = submission.assignment
        if request.user.role == 'teacher' and assignment.teacher != request.user:
            if assignment.course.teacher != request.user:
                return api_error("You do not have permission to grade this submission.", status=403)

        serializer = GradeSubmissionSerializer(submission, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(graded=True, graded_at=timezone.now())
            
            # Re-serialize full submission for the response
            full_serializer = AssignmentSubmissionSerializer(submission, context={'request': request})
            return api_success(data=full_serializer.data, message="Submission graded successfully.")
        return api_error("Validation failed.", errors=serializer.errors)


class AssignmentFileDownloadView(APIView):
    permission_classes = [IsAuthenticated, IsApproved]

    def get(self, request, pk):
        try:
            assignment = Assignment.objects.get(pk=pk)
        except Assignment.DoesNotExist:
            return api_error("Assignment not found.", status=404)

        if not user_has_access_to_assignment(request.user, assignment):
            return api_error("You do not have access to this assignment's files.", status=403)

        if not assignment.file:
            return api_error("No file attachment found for this assignment.", status=404)

        try:
            file_handle = open(assignment.file.path, 'rb')
            response = FileResponse(file_handle, content_type='application/octet-stream')
            filename = os.path.basename(assignment.file.name)
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        except Exception as e:
            return api_error("Failed to read file from disk.", status=500)


class SubmissionFileDownloadView(APIView):
    permission_classes = [IsAuthenticated, IsApproved]

    def get(self, request, pk):
        try:
            submission = AssignmentSubmission.objects.get(pk=pk)
        except AssignmentSubmission.DoesNotExist:
            return api_error("Submission not found.", status=404)

        # Access check: student can download their own submission, teachers/admins can download any submission
        if request.user.role == 'student' and submission.student != request.user:
            return api_error("You do not have access to this submission file.", status=403)

        if not submission.file:
            return api_error("Submission file not found.", status=404)

        try:
            file_handle = open(submission.file.path, 'rb')
            response = FileResponse(file_handle, content_type='application/octet-stream')
            filename = os.path.basename(submission.file.name)
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        except Exception as e:
            return api_error("Failed to read file from disk.", status=500)
