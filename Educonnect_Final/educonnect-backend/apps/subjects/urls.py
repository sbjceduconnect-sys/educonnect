from django.urls import re_path
from . import views

urlpatterns = [
    re_path(r'^subjects/?$', views.SubjectListView.as_view(), name='subject-list'),
    re_path(r'^subjects/(?P<pk>\d+)/?$', views.SubjectDetailView.as_view(), name='subject-detail'),
]
