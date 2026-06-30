from django.db import models
from django.conf import settings

class Assignment(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE, related_name='assignments')
    subject = models.ForeignKey('subjects.Subject', on_delete=models.CASCADE, null=True, blank=True, related_name='assignments')
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_assignments')
    file = models.FileField(upload_to='assignments/', null=True, blank=True)
    due_date = models.DateTimeField()
    max_marks = models.PositiveIntegerField(default=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'assignments'
        ordering = ['due_date']

    def __str__(self):
        return f"{self.title} - {self.course.code}"

class AssignmentSubmission(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='submissions')
    file = models.FileField(upload_to='submissions/')
    remarks = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    marks = models.FloatField(null=True, blank=True)
    feedback = models.TextField(blank=True)
    graded = models.BooleanField(default=False)
    graded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'assignment_submissions'
        unique_together = ['assignment', 'student']

    def __str__(self):
        return f"Submission by {self.student.username} for {self.assignment.title}"
