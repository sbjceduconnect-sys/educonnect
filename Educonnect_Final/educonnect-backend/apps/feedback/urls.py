from django.urls import re_path
from . import views
urlpatterns = [
    re_path(r'^feedback/?$',     views.FeedbackListView.as_view(),    name='feedback-list'),
    re_path(r'^feedback/summary/?$', views.FeedbackSummaryView.as_view(), name='feedback-summary'),
    re_path(r'^feedback/department/(?P<dept_id>\d+)/?$', views.FeedbackDepartmentView.as_view(), name='feedback-department'),
    re_path(r'^office-hours/?$', views.OfficeHourListView.as_view(),  name='office-hours-list'),
    re_path(r'^office-hours/(?P<pk>\d+)/?$', views.OfficeHourDetailView.as_view(), name='office-hours-detail'),
    re_path(r'^office-hours/(?P<pk>\d+)/book/?$', views.OfficeHourBookView.as_view(), name='office-hours-book'),
    re_path(r'^office-hours/(?P<pk>\d+)/cancel/(?P<booking_index>\d+)/?$', views.OfficeHourCancelView.as_view(), name='office-hours-cancel'),
    re_path(r'^audit-logs/?$',   views.AuditLogListView.as_view(),    name='audit-log-list'),
]
