import django, os
os.environ['DJANGO_SETTINGS_MODULE'] = 'educonnect.settings'
django.setup()

from apps.attendance.models import AttendanceRecord, ActiveQRCode
from django.utils import timezone

print("=== ACTIVE QR CODES ===")
for qr in ActiveQRCode.objects.all():
    print(f"  token={qr.token} course_id={qr.course_id} subject_id={qr.subject_id} expires={qr.expires_at} expired={qr.expires_at < timezone.now()}")

print("\n=== RECENT ATTENDANCE RECORDS (last 20) ===")
for rec in AttendanceRecord.objects.order_by('-id')[:20]:
    print(f"  id={rec.id} student_id={rec.student_id} course_id={rec.course_id} subject_id={rec.subject_id} date={rec.date} status={rec.status} method={rec.method} is_draft={rec.is_draft}")

print("\n=== TODAY's RECORDS ===")
today = timezone.localdate()
print(f"Today (server): {today}")
for rec in AttendanceRecord.objects.filter(date=today):
    print(f"  id={rec.id} student_id={rec.student_id} course_id={rec.course_id} subject_id={rec.subject_id} status={rec.status} method={rec.method} is_draft={rec.is_draft}")
