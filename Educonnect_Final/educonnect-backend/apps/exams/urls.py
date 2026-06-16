from django.urls import re_path
from . import views

urlpatterns = [
    re_path(r'^exams/?$', views.ExamListView.as_view(), name='exam-list'),
    re_path(r'^exams/(?P<pk>\d+)/?$', views.ExamDetailView.as_view(), name='exam-detail'),
    
    re_path(r'^results/?$', views.ResultListView.as_view(), name='result-list'),
    re_path(r'^results/bulk/?$', views.ResultBulkView.as_view(), name='result-bulk'),
    re_path(r'^results/(?P<pk>\d+)/?$', views.ResultDetailView.as_view(), name='result-detail'),
    re_path(r'^results/exam/(?P<exam_id>\d+)/?$', views.ResultByExamView.as_view(), name='result-by-exam'),
    re_path(r'^results/student/(?P<student_id>\d+)/?$', views.ResultByStudentView.as_view(), name='result-by-student'),
    re_path(r'^results/student/(?P<student_id>\d+)/performance/?$', views.ResultPerformanceView.as_view(), name='result-performance'),
    re_path(r'^results/exam/(?P<exam_id>\d+)/publish/?$', views.ResultPublishView.as_view(), name='result-publish'),
    re_path(r'^results/reports/progress/(?P<student_id>\d+)/?$', views.ResultProgressReportView.as_view(), name='result-progress-report'),
]
