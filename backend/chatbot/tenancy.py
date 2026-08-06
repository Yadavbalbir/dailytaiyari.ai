"""Authoritative tenant resolution for the AI feature.

``TenantMiddleware`` now rejects any request whose ``X-Tenant-ID`` header does
not match the authenticated caller's own tenant, so this module is no longer
the only thing standing between tenants. It is kept as defence in depth: the AI
feature guards encrypted provider credentials and a real spend budget, and a
view that resolves its tenant from the **user** cannot be compromised by a
future change to the middleware or its exempt-path list.

Everything here derives the tenant from the user, and treats a mismatching
header as an attempt to cross tenants.
"""
from rest_framework.exceptions import NotFound, PermissionDenied


def request_tenant(request, required=True):
    """The tenant that owns ``request.user``, validated against the header."""
    user = getattr(request, 'user', None)
    user_tenant = getattr(user, 'tenant', None)
    header_tenant = getattr(request, 'tenant', None)

    if header_tenant is not None and user_tenant is not None:
        if str(header_tenant.id) != str(user_tenant.id):
            raise PermissionDenied('This account does not belong to the requested tenant.')

    # Superusers carry no tenant of their own, so they act on the header.
    tenant = user_tenant or (header_tenant if getattr(user, 'is_superuser', False) else None)

    if tenant is None and required:
        raise NotFound('No tenant is associated with this request.')
    return tenant


def tenant_of_student(student):
    """The tenant owning a student profile, from their user account."""
    return getattr(getattr(student, 'user', None), 'tenant', None)
