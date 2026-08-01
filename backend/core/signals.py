"""Signal handlers for the core app.

Currently: self-serve CORS. Instead of hardcoding every per-tenant frontend
origin in ``settings.py`` (which needs a code deploy), a super admin can list a
tenant's frontend origins in ``Tenant.allowed_origins``. The corsheaders
``check_request_enabled`` signal below consults those at request time so the
public platform API accepts cross-origin calls from any whitelisted origin.

The set of allowed origins is cached (short TTL) and invalidated whenever a
Tenant row is saved, so edits from the dashboard take effect immediately
without a per-request DB scan on every preflight.
"""
from corsheaders.signals import check_request_enabled
from django.core.cache import cache
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

_CACHE_KEY = 'tenant_allowed_origins'
_CACHE_TTL = 300  # seconds


def _all_allowed_origins():
    """Return the cached set of every active tenant's whitelisted origins."""
    origins = cache.get(_CACHE_KEY)
    if origins is None:
        from .models import Tenant
        origins = set()
        for lst in (
            Tenant.objects.filter(is_active=True)
            .values_list('allowed_origins', flat=True)
        ):
            for origin in (lst or []):
                if origin:
                    origins.add(origin.strip().rstrip('/'))
        cache.set(_CACHE_KEY, origins, _CACHE_TTL)
    return origins


def cors_allow_tenant_origins(sender, request, **kwargs):
    """Allow the request when its Origin is whitelisted by some active tenant."""
    origin = request.META.get('HTTP_ORIGIN')
    if not origin:
        return False
    return origin.strip().rstrip('/') in _all_allowed_origins()


check_request_enabled.connect(cors_allow_tenant_origins)


@receiver(post_save, sender='core.Tenant')
@receiver(post_delete, sender='core.Tenant')
def _invalidate_origins_cache(sender, **kwargs):
    cache.delete(_CACHE_KEY)
