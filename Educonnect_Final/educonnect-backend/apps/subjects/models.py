from django.db import models
from django.conf import settings

class Subject(models.Model):
    TYPE_CHOICES = [
        ('theory', 'Theory'),
        ('practical', 'Practical'),
        ('elective', 'Elective'),
    ]
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True)
    department = models.ForeignKey('departments.Department', on_delete=models.CASCADE, related_name='subjects')
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_subjects')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='theory')
    weekly_hours = models.PositiveSmallIntegerField(default=4)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'subjects'
        ordering = ['code']

    def __str__(self):
        return f"{self.code} - {self.name}"
