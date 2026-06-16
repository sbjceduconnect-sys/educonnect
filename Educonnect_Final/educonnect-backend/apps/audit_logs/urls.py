from django.urls import re_path
from . import views
urlpatterns = [
    re_path(r'^analytics/user-distribution/?$', views.UserDistributionView.as_view(), name='analytics-users'),
    re_path(r'^analytics/attendance-trend/?$',  views.AttendanceTrendView.as_view(),  name='analytics-attendance'),
    re_path(r'^analytics/student-grades/?$',    views.StudentGradesView.as_view(),    name='analytics-grades'),
]
