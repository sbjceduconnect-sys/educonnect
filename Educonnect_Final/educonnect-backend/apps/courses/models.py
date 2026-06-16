from django.db import models
from django.conf import settings

class Course(models.Model):
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True)
    credits = models.PositiveSmallIntegerField(default=3)
    semester = models.PositiveSmallIntegerField(default=1)
    description = models.TextField(blank=True)
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='taught_courses')
    department = models.ForeignKey('departments.Department', on_delete=models.SET_NULL, null=True, blank=True)
    academic_year = models.CharField(max_length=20, default='2026-27')
    students = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name='enrolled_courses')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'courses'
        ordering = ['code']

    def __str__(self):
        return f"{self.code} - {self.name}"
