from django.urls import re_path
from . import views
urlpatterns = [
    re_path(r'^calendar-events/?$',          views.CalendarEventListView.as_view(),   name='event-list'),
    re_path(r'^calendar-events/(?P<pk>\d+)/?$', views.CalendarEventDetailView.as_view(), name='event-detail'),
    re_path(r'^calendar/?$',          views.CalendarEventListView.as_view(),   name='calendar-list'),
    re_path(r'^calendar/(?P<pk>\d+)/?$', views.CalendarEventDetailView.as_view(), name='calendar-detail'),
]
