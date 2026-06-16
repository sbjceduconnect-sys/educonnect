from django.urls import re_path
from . import views
urlpatterns = [
    re_path(r'^departments/?$',        views.DepartmentListView.as_view(),   name='dept-list'),
    re_path(r'^departments/(?P<pk>\d+)/?$', views.DepartmentDetailView.as_view(), name='dept-detail'),
    re_path(r'^departments/(?P<pk>\d+)/hod/?$', views.DepartmentAssignHodView.as_view(), name='dept-assign-hod'),
]
