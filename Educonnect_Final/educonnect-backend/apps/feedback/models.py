from django.db import models
from django.conf import settings

class Feedback(models.Model):
    target_type   = models.CharField(max_length=20, default='general')
    target_id     = models.IntegerField(null=True, blank=True)
    department    = models.ForeignKey('departments.Department', on_delete=models.SET_NULL, null=True, blank=True, related_name='feedbacks')
    rating        = models.PositiveSmallIntegerField(default=5)
    comment       = models.TextField(blank=True)
    category      = models.CharField(max_length=50, default='other')
    submitted_by  = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='feedbacks')
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'feedback'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.category} - {self.rating}"


class OfficeHour(models.Model):
    DAY_CHOICES = [(d, d) for d in ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']]
    teacher    = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='office_hours')
    subject    = models.CharField(max_length=100, blank=True)
    day        = models.CharField(max_length=10, choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time   = models.TimeField()
    room       = models.CharField(max_length=50, blank=True)
    max_slots  = models.PositiveIntegerField(default=5)
    bookings   = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'office_hours'
        ordering = ['day', 'start_time']
