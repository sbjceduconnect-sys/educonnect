from django.urls import re_path
from . import views

urlpatterns = [
    re_path(r'^auth/register/?$', views.RegisterView.as_view(), name='register'),
    re_path(r'^auth/login/?$', views.LoginView.as_view(), name='login'),
    re_path(r'^auth/refresh/?$', views.RefreshTokenView.as_view(), name='token-refresh'),
    re_path(r'^auth/logout/?$', views.LogoutView.as_view(), name='logout'),
    re_path(r'^auth/change-password/?$', views.ChangePasswordView.as_view(), name='change-password'),
    re_path(r'^auth/reset-password/(?P<token>[\w\.\-\_]+)/?$', views.ResetPasswordView.as_view(), name='reset-password'),
    re_path(r'^auth/me/?$', views.MeView.as_view(), name='me'),
    re_path(r'^users/me/?$', views.MeView.as_view(), name='users-me'),  # Client compatibility
    re_path(r'^auth/forgot-password/?$', views.ForgotPasswordView.as_view(), name='forgot-password'),
    re_path(r'^users/?$', views.UserListView.as_view(), name='user-list'),
    re_path(r'^users/(?P<pk>\d+)/?$', views.UserDetailView.as_view(), name='user-detail'),
    re_path(r'^users/(?P<pk>\d+)/approve/?$', views.ApproveUserView.as_view(), name='user-approve'),
    re_path(r'^users/(?P<pk>\d+)/role/?$', views.ChangeRoleView.as_view(), name='user-change-role'),
    re_path(r'^users/bulk-approve/?$', views.BulkApproveView.as_view(), name='user-bulk-approve'),
    re_path(r'^users/bulk-import/?$', views.BulkImportView.as_view(), name='user-bulk-import'),
    re_path(r'^users/bulk-delete/?$', views.BulkDeleteUsersView.as_view(), name='user-bulk-delete'),
    
    re_path(r'^dashboard/admin/?$', views.AdminDashboardView.as_view(), name='dashboard-admin'),
    re_path(r'^dashboard/teacher/?$', views.TeacherDashboardView.as_view(), name='dashboard-teacher'),
    re_path(r'^dashboard/student/?$', views.StudentDashboardView.as_view(), name='dashboard-student'),
]
