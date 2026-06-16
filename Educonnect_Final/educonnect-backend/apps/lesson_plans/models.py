from django.db import models
from django.conf import settings

class LessonPlan(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('planned', 'Planned'),
        ('completed', 'Completed'),
    ]
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE, related_name='lesson_plans')
    subject = models.ForeignKey('subjects.Subject', on_delete=models.CASCADE, related_name='lesson_plans')
    planned_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planned')
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='lesson_plans')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'lesson_plans'
        ordering = ['planned_date']

    def __str__(self):
        return f"{self.title} - {self.status}"
