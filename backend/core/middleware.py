from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from core.models import Tenant
import uuid

# Paths that don't require a tenant header
TENANT_EXEMPT_PATHS = [
    '/admin/',
    '/api/v1/tenant/',
    '/api/docs/',
    '/api/redoc/',
    '/static/',
    '/media/',
]

class TenantMiddleware(MiddlewareMixin):
    """
    Middleware to extract and enforce the tenant from request headers.
    All API requests must include a valid X-Tenant-ID header,
    except for whitelisted paths like admin and tenant config endpoints.
    """
    def process_request(self, request):
        # Check if this path is exempt from tenant requirement
        for path in TENANT_EXEMPT_PATHS:
            if request.path.startswith(path):
                request.tenant = None
                return None

        tenant_id = request.headers.get('X-Tenant-ID')

        if not tenant_id:
            return JsonResponse(
                {'error': 'X-Tenant-ID header is required.'},
                status=403
            )

        try:
            valid_uuid = uuid.UUID(tenant_id)
            tenant = Tenant.objects.filter(id=valid_uuid, is_active=True).first()
        except ValueError:
            return JsonResponse(
                {'error': 'Invalid Tenant ID format.'},
                status=403
            )

        if not tenant:
            return JsonResponse(
                {'error': 'Tenant not found or inactive.'},
                status=403
            )

        request.tenant = tenant

