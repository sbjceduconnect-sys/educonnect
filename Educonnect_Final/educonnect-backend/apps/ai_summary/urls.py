from django.urls import re_path
from . import views
urlpatterns = [
    re_path(r'^ai/lecture-summary/?$', views.AILectureSummaryView.as_view(), name='ai-lecture-summary'),
    re_path(r'^ai/lecture-summary/file/?$', views.AILectureSummaryFileView.as_view(), name='ai-lecture-summary-file'),
]
