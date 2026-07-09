from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from core.models import Tenant
import uuid

# Paths that don't require a tenant header
TENANT_EXEMPT_PATHS = [
    '/admin/',
    '/api/v1/tenant/',
    '/api/v1/platform/',
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



# Auth/bootstrap endpoints a suspended user must still be able to reach so the
# frontend can authenticate, refresh tokens, verify email, and load its profile
# (which surfaces is_suspended to drive the blocking overlay).
SUSPENSION_EXEMPT_PATHS = [
    '/api/v1/auth/login/',
    '/api/v1/auth/register/',
    '/api/v1/auth/refresh/',
    '/api/v1/auth/logout/',
    '/api/v1/auth/verify-email/',
    '/api/v1/auth/resend-otp/',
    '/api/v1/auth/password/',
    '/api/v1/auth/profile/',
]


class BlockSuspendedUsersMiddleware:
    """Reject API requests from suspended accounts.

    Defense-in-depth: individual DRF views set their own permission_classes,
    which override any default permission. Enforcing suspension here guarantees
    every /api/ endpoint (except auth/bootstrap paths) rejects a suspended user,
    regardless of the view's permissions.

    Returns HTTP 403 with code 'account_suspended' (not 401) so the frontend
    keeps the session, avoids a refresh/logout loop, and shows the blocking
    overlay instead.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        # Import lazily-safe: simplejwt is already an installed app.
        from rest_framework_simplejwt.authentication import JWTAuthentication
        self._authenticator = JWTAuthentication()

    def __call__(self, request):
        path = request.path
        if path.startswith('/api/') and not self._is_exempt(path):
            user = self._get_user(request)
            if user is not None and getattr(user, 'is_suspended', False):
                return JsonResponse(
                    {
                        'detail': 'Your account has been suspended by your administrator.',
                        'code': 'account_suspended',
                    },
                    status=403,
                )
        return self.get_response(request)

    @staticmethod
    def _is_exempt(path):
        return any(path.startswith(p) for p in SUSPENSION_EXEMPT_PATHS)

    def _get_user(self, request):
        try:
            result = self._authenticator.authenticate(request)
        except Exception:
            # Invalid/expired token — let the normal auth flow handle it.
            return None
        if result is None:
            return None
        user, _token = result
        return user
