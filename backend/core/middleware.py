from django.utils.deprecation import MiddlewareMixin
from core.models import Tenant
import uuid

class TenantMiddleware(MiddlewareMixin):
    """
    Middleware to extract the tenant from the request headers.
    It looks for the 'X-Tenant-ID' header, fetches the corresponding Tenant,
    and attaches it to the request object. If the header is missing or invalid,
    request.tenant is set to None.
    """
    def process_request(self, request):
        tenant_id = request.headers.get('X-Tenant-ID')
        
        if tenant_id:
            try:
                # Convert the tenant_id string to a UUID object to ensure it's valid
                valid_uuid = uuid.UUID(tenant_id)
                tenant = Tenant.objects.filter(id=valid_uuid, is_active=True).first()
                request.tenant = tenant
            except ValueError:
                request.tenant = None
        else:
            request.tenant = None
