from django.db import models
from django.conf import settings

class CalendarEvent(models.Model):
    TYPE_CHOICES = [
        ('exam', 'Exam'),
        ('holiday', 'Holiday'),
        ('event', 'Event'),
        ('deadline', 'Deadline'),
        ('academic', 'Academic'),
    ]
    title      = models.CharField(max_length=200)
    description= models.TextField(blank=True)
    start_date = models.DateField()
    end_date   = models.DateField(null=True, blank=True)
    type       = models.CharField(max_length=20, choices=TYPE_CHOICES, default='event')
    color      = models.CharField(max_length=20, blank=True)
    department = models.ForeignKey(
        'departments.Department',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='calendar_events'
    )
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'calendar_events'
        ordering = ['start_date']

    def __str__(self):
        return self.title
