from django.urls import re_path
from . import views
urlpatterns = [
    re_path(r'^announcements/?$',          views.AnnouncementListView.as_view(),   name='announcement-list'),
    re_path(r'^announcements/(?P<pk>\d+)/?$', views.AnnouncementDetailView.as_view(), name='announcement-detail'),
]
