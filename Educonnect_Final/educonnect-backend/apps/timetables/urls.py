from django.urls import re_path
from . import views

urlpatterns = [
    re_path(r'^timetables/?$', views.TimetableListView.as_view(), name='timetable-list'),
    re_path(r'^timetables/(?P<pk>\d+)/?$', views.TimetableDetailView.as_view(), name='timetable-detail'),
    re_path(r'^timetables/teacher/(?P<teacher_id>\d+)/?$', views.TeacherScheduleView.as_view(), name='timetable-teacher'),
    re_path(r'^timetables/validate/?$', views.TimetableValidateView.as_view(), name='timetable-validate'),
]
