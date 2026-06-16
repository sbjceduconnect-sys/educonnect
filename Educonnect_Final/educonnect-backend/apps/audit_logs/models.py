from django.db import models
from django.conf import settings

class AuditLog(models.Model):
    user      = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    action    = models.CharField(max_length=100)
    target    = models.CharField(max_length=200, blank=True)
    ip        = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user} - {self.action} - {self.timestamp}"

    @classmethod
    def log(cls, user, action, target='', request=None):
        ip = None
        if request:
            ip = request.META.get('REMOTE_ADDR')
        cls.objects.create(user=user, action=action, target=target, ip=ip)
