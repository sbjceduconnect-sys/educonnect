from django.db import models
from django.conf import settings

class StudyMaterial(models.Model):
    TYPE_CHOICES = [
        ('Notes','Notes'),
        ('Assignments','Assignments'),
        ('Past Papers','Past Papers'),
        ('References','References'),
        ('Lab Manuals','Lab Manuals'),
        ('pdf', 'pdf'),
        ('note', 'note'),
        ('ppt', 'ppt'),
        ('video', 'video'),
        ('question_paper', 'question_paper')
    ]
    title       = models.CharField(max_length=200)
    file        = models.FileField(upload_to='study_materials/')
    type        = models.CharField(max_length=30, choices=TYPE_CHOICES, default='Notes')
    course      = models.ForeignKey('courses.Course', on_delete=models.CASCADE, null=True, blank=True)
    subject     = models.ForeignKey('subjects.Subject', on_delete=models.CASCADE, null=True, blank=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    description = models.TextField(blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'study_materials'
        ordering = ['-created_at']

    def __str__(self):
        return self.title
