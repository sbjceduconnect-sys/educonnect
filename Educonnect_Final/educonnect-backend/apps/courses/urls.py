from django.urls import re_path
from . import views

urlpatterns = [
    re_path(r'^courses/?$', views.CourseListView.as_view(), name='course-list'),
    re_path(r'^courses/(?P<pk>\d+)/?$', views.CourseDetailView.as_view(), name='course-detail'),
    re_path(r'^courses/(?P<pk>\d+)/enroll/?$', views.CourseEnrollView.as_view(), name='course-enroll'),
    re_path(r'^courses/(?P<pk>\d+)/enroll/(?P<student_id>\d+)/?$', views.CourseEnrollView.as_view(), name='course-unenroll'),
    re_path(r'^courses/(?P<pk>\d+)/students/?$', views.CourseStudentsView.as_view(), name='course-students'),
]
