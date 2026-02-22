from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied

class TenantAwareViewSet(viewsets.ModelViewSet):
    """
    A base viewset for multi-tenant applications.
    Ensures that queries are filtered by request.tenant and
    new objects have the tenant automatically assigned.
    """
    
    def get_queryset(self):
        """
        Filter the queryset to only return items belonging to the current tenant.
        """
        queryset = super().get_queryset()
        
        # If no tenant is available in the request, return empty queryset to prevent data leaks
        if not hasattr(self.request, 'tenant') or not self.request.tenant:
            return queryset.none()
            
        return queryset.filter(tenant=self.request.tenant)

    def perform_create(self, serializer):
        """
        Automatically save the tenant to the newly created instance.
        """
        if not hasattr(self.request, 'tenant') or not self.request.tenant:
            raise PermissionDenied("A valid Tenant is required to perform this action.")
            
        serializer.save(tenant=self.request.tenant)

class TenantAwareReadOnlyViewSet(viewsets.ReadOnlyModelViewSet):
    """
    A base viewset for multi-tenant applications (Read Only).
    Ensures that queries are filtered by request.tenant.
    """
    
    def get_queryset(self):
        """
        Filter the queryset to only return items belonging to the current tenant.
        """
        queryset = super().get_queryset()
        
        # If no tenant is available in the request, return empty queryset to prevent data leaks
        if not hasattr(self.request, 'tenant') or not self.request.tenant:
            return queryset.none()
            
        return queryset.filter(tenant=self.request.tenant)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from .models import Tenant

class TenantDetailView(APIView):
    """
    Unauthenticated endpoint for the frontend to fetch Tenant branding details.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk=None):
        if not pk:
            return Response({"error": "Tenant ID is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            tenant = Tenant.objects.get(id=pk, is_active=True)
            return Response({
                "id": str(tenant.id),
                "name": tenant.name,
                "subdomain": tenant.subdomain,
                "logo": request.build_absolute_uri(tenant.logo.url) if tenant.logo else None
            })
        except Tenant.DoesNotExist:
            return Response({"error": "Tenant not found"}, status=status.HTTP_404_NOT_FOUND)

