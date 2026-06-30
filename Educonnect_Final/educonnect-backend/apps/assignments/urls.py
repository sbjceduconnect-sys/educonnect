from django.urls import re_path
from . import views

urlpatterns = [
    re_path(r'^assignments/?$', views.AssignmentListCreateView.as_view(), name='assignment-list'),
    re_path(r'^assignments/(?P<pk>\d+)/?$', views.AssignmentDetailView.as_view(), name='assignment-detail'),
    re_path(r'^assignments/(?P<pk>\d+)/submit/?$', views.AssignmentSubmitView.as_view(), name='assignment-submit'),
    re_path(r'^assignments/(?P<pk>\d+)/submissions/?$', views.AssignmentSubmissionsListView.as_view(), name='assignment-submissions-list'),
    re_path(r'^assignments/(?P<pk>\d+)/download/?$', views.AssignmentFileDownloadView.as_view(), name='assignment-file-download'),
    
    re_path(r'^submissions/(?P<pk>\d+)/grade/?$', views.GradeSubmissionView.as_view(), name='submission-grade'),
    re_path(r'^submissions/(?P<pk>\d+)/download/?$', views.SubmissionFileDownloadView.as_view(), name='submission-file-download'),
]
