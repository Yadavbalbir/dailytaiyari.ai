from rest_framework import permissions

class IsTenantAdmin(permissions.BasePermission):
    """
    Allows access only to users with the 'admin' role in the current tenant.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check if the user has the 'admin' role
        # Note: We assume the user is already scoped to the tenant by the auth/middleware
        return request.user.role == 'admin'
