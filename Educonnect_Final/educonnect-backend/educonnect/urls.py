"""EduConnect master URL configuration."""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

api_prefix = 'api/v1/'

urlpatterns = [
    path('admin/', admin.site.urls),
    # ── Auth & Users ──────────────────────────────────────────
    path(api_prefix, include('apps.accounts.urls')),
    # ── Core resources ────────────────────────────────────────
    path(api_prefix, include('apps.departments.urls')),
    path(api_prefix, include('apps.courses.urls')),
    path(api_prefix, include('apps.attendance.urls')),
    path(api_prefix, include('apps.exams.urls')),
    path(api_prefix, include('apps.study_materials.urls')),
    path(api_prefix, include('apps.assignments.urls')),
    path(api_prefix, include('apps.announcements.urls')),
    path(api_prefix, include('apps.calendar_events.urls')),
    path(api_prefix, include('apps.feedback.urls')),
    # ── Analytics + Audit + AI ────────────────────────────────
    path(api_prefix, include('apps.audit_logs.urls')),
    path(api_prefix, include('apps.ai_summary.urls')),
    # ── Aligned Resources ─────────────────────────────────────
    path(api_prefix, include('apps.subjects.urls')),
    path(api_prefix, include('apps.timetables.urls')),
    path(api_prefix, include('apps.lesson_plans.urls')),
    path(api_prefix, include('apps.library.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
