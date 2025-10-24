# api/permissions.py
from rest_framework import permissions

class IsManagerUser(permissions.BasePermission):
    """
    Allows access only to users with the 'manager' role.
    """
    def has_permission(self, request, view):
        # Check if user is authenticated and has the role 'manager'
        return request.user and request.user.is_authenticated and request.user.role == 'manager'