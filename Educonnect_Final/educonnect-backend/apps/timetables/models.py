from django.db import models

class Timetable(models.Model):
    department = models.ForeignKey('departments.Department', on_delete=models.CASCADE, related_name='timetables')
    stream = models.CharField(max_length=50)
    section = models.CharField(max_length=20)
    academic_year = models.CharField(max_length=50, default='2026-27')
    schedule = models.JSONField(default=list)  # list of { day, slots: [{ subjectId, teacherId, startTime, endTime, room }] }
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'timetables'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.department.name if self.department else 'N/A'} ({self.stream}-{self.section}) - {self.academic_year}"
