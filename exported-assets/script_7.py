
# Create permissions.py
permissions_content = """from rest_framework.permissions import BasePermission


class IsManager(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'manager')
"""

with open(f"{base_dir}/api/permissions.py", "w") as f:
    f.write(permissions_content)

print("permissions.py created")
