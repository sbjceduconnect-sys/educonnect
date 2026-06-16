from django.db import models
from django.conf import settings

class AttendanceRecord(models.Model):
    STATUS_CHOICES = [
        ('Present', 'Present'),
        ('Absent', 'Absent'),
        ('Late', 'Late'),
        ('Excused', 'Excused'),
    ]
    METHOD_CHOICES = [
        ('manual', 'Manual'),
        ('qr', 'QR Code'),
    ]

    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='attendance_records')
    course  = models.ForeignKey('courses.Course', on_delete=models.CASCADE, related_name='attendance_records')
    subject = models.ForeignKey('subjects.Subject', on_delete=models.CASCADE, null=True, blank=True, related_name='attendance_records')
    date    = models.DateField()
    status  = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Absent')
    method  = models.CharField(max_length=10, choices=METHOD_CHOICES, default='manual')
    marked_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='marked_attendance')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'attendance_records'
        unique_together = ['student', 'course', 'subject', 'date']
        ordering = ['-date']

    def __str__(self):
        return f"{self.student} - {self.subject} - {self.date} - {self.status}"


class ActiveQRCode(models.Model):
    token = models.CharField(max_length=6, unique=True)
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE)
    subject = models.ForeignKey('subjects.Subject', on_delete=models.CASCADE)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'active_qr_codes'

    def __str__(self):
        return f"QR Token {self.token} for {self.subject}"
