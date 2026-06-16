from django.db import models
from django.conf import settings

class Announcement(models.Model):
    PRIORITY_CHOICES = [('High','High'),('Medium','Medium'),('Low','Low')]
    SCOPE_CHOICES = [('system','system'),('department','department'),('course','course')]

    title    = models.CharField(max_length=200)
    body     = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='Medium')
    scope    = models.CharField(max_length=15, choices=SCOPE_CHOICES, default='system')
    target_department = models.ForeignKey('departments.Department', on_delete=models.SET_NULL, null=True, blank=True, related_name='announcements')
    target_course = models.ForeignKey('courses.Course', on_delete=models.SET_NULL, null=True, blank=True, related_name='announcements')
    category = models.CharField(max_length=50, blank=True)
    author   = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'announcements'
        ordering = ['-created_at']

    def __str__(self):
        return self.title
