from rest_framework import permissions
from accounts.models import UserRole


class IsStudent(permissions.BasePermission):
    """Allows access only to authenticated student users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == UserRole.STUDENT)


class IsAdminRole(permissions.BasePermission):
    """Allows access only to authenticated admin users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == UserRole.ADMIN)


class IsMentorOrFaculty(permissions.BasePermission):
    """Allows access to mentors, faculty, support, or admins."""
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in [UserRole.MENTOR, UserRole.FACULTY, UserRole.SUPPORT, UserRole.ADMIN]
        )


class IsProfileOwnerOrAdmin(permissions.BasePermission):
    """
    Object-level permission allowing the student owner, admin, or support staff to edit.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role in [UserRole.ADMIN, UserRole.SUPPORT]:
            return True
        # Check if obj is StudentProfile or has user attribute
        target_user = getattr(obj, 'user', obj)
        return target_user.id == request.user.id


class IsAdminOrSupport(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and request.user.role in [UserRole.ADMIN, UserRole.SUPPORT]
        )


class CanViewStudentDirectory(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in [UserRole.ADMIN, UserRole.SUPPORT, UserRole.FACULTY, UserRole.MENTOR]
        )
