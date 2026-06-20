from django.urls import re_path
from . import views

urlpatterns = [
    re_path(r'^attendance/?$', views.AttendanceView.as_view(), name='attendance'),
    re_path(r'^attendance/summary/?$', views.AttendanceSummaryView.as_view(), name='attendance-summary'),
    re_path(r'^attendance/student/(?P<student_id>\d+)/summary/?$', views.AttendanceSummaryView.as_view(), name='student-attendance-summary'),
    re_path(r'^attendance/qr/generate/?$', views.GenerateQRView.as_view(), name='attendance-qr-generate'),
    re_path(r'^attendance/qr/scan/?$', views.ScanQRView.as_view(), name='attendance-qr-scan'),
    re_path(r'^attendance/subject/(?P<subject_id>\d+)/?$', views.AttendanceBySubjectView.as_view(), name='attendance-by-subject'),
    re_path(r'^attendance/student/(?P<student_id>\d+)/?$', views.AttendanceByStudentView.as_view(), name='attendance-by-student'),
    re_path(r'^attendance/reports/?$', views.AttendanceReportsView.as_view(), name='attendance-reports'),
    re_path(r'^attendance/edit-requests/?$', views.AttendanceEditRequestView.as_view(), name='attendance-edit-requests'),
    re_path(r'^attendance/edit-requests/(?P<pk>\d+)/action/?$', views.AttendanceEditRequestActionView.as_view(), name='attendance-edit-request-action'),
    re_path(r'^attendance/(?P<pk>[\w\-\_]+)/?$', views.AttendanceDetailView.as_view(), name='attendance-detail'),
]
