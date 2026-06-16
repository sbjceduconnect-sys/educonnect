from django.urls import re_path
from . import views

urlpatterns = [
    re_path(r'^lesson-plans/?$', views.LessonPlanListView.as_view(), name='lesson-plan-list'),
    re_path(r'^lesson-plans/(?P<pk>\d+)/?$', views.LessonPlanDetailView.as_view(), name='lesson-plan-detail'),
]
