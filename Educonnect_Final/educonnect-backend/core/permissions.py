from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Allow access only to users with role='admin'."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_approved and request.user.role == 'admin')


class IsTeacher(BasePermission):
    """Allow access only to users with role='teacher'."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_approved and request.user.role == 'teacher')


class IsStudent(BasePermission):
    """Allow access only to users with role='student'."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_approved and request.user.role == 'student')


class IsAdminOrTeacher(BasePermission):
    """Allow access to admins and teachers."""
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and request.user.is_approved
            and request.user.role in ('admin', 'teacher')
        )


class IsApproved(BasePermission):
    """Allow access only to approved users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_approved)
