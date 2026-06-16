from django.urls import re_path
from . import views

urlpatterns = [
    re_path(r'^study-materials/?$', views.StudyMaterialListView.as_view(), name='material-list-legacy'),
    re_path(r'^study-materials/(?P<pk>\d+)/?$', views.StudyMaterialDetailView.as_view(), name='material-detail-legacy'),
    
    re_path(r'^materials/?$', views.StudyMaterialListView.as_view(), name='material-list'),
    re_path(r'^materials/(?P<pk>\d+)/?$', views.StudyMaterialDetailView.as_view(), name='material-detail'),
    re_path(r'^materials/(?P<pk>\d+)/download/?$', views.StudyMaterialDownloadView.as_view(), name='material-download'),
    re_path(r'^materials/question-papers/?$', views.QuestionPapersListView.as_view(), name='material-question-papers'),
]
