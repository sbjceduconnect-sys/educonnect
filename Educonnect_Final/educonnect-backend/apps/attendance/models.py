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


class AttendanceEditRequest(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
    ]
    attendance_record = models.ForeignKey(AttendanceRecord, on_delete=models.CASCADE, related_name='edit_requests')
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='requested_attendance_edits')
    new_status = models.CharField(max_length=10, choices=AttendanceRecord.STATUS_CHOICES)
    reason = models.TextField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'attendance_edit_requests'
        ordering = ['-created_at']

    def __str__(self):
        return f"Edit Request by {self.requested_by} for {self.attendance_record.student} - Status {self.status}"

