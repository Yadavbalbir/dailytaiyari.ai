"""Public landing-page URLs.

Mounted at ``/api/v1/landing/`` — NOT tenant-exempt, so ``TenantMiddleware``
requires the ``X-Tenant-ID`` header and resolves the tenant before the view.
Views are ``AllowAny`` so anonymous visitors can load the branded page.
"""
from django.urls import path

from .landing_views import PublicLandingView, PublicLegalView

urlpatterns = [
    path('', PublicLandingView.as_view(), name='public-landing'),
    path('legal/<str:doc_type>/', PublicLegalView.as_view(), name='public-legal'),
]
