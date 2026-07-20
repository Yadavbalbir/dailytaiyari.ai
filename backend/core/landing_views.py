"""Public + tenant-admin views for the landing page and legal documents.

Public endpoints are ``AllowAny`` but still require the ``X-Tenant-ID`` header
(they are not on ``TENANT_EXEMPT_PATHS``), so ``TenantMiddleware`` resolves the
tenant before the view runs. This lets an anonymous visitor load a tenant's
branded landing page and legal pages without logging in.
"""
import base64
import uuid

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from rest_framework import permissions, status
from rest_framework.exceptions import NotFound
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsTenantAdmin
from . import landing_defaults
from .models import LandingPage, LegalDocument
from .landing_serializers import LandingPageSerializer, LegalDocumentSerializer


def _require_tenant(request):
    tenant = getattr(request, 'tenant', None)
    if tenant is None:
        raise NotFound('No tenant is associated with this request.')
    return tenant


def _build_default_config(tenant):
    """A full landing config for a tenant that hasn't customised one yet."""
    name = tenant.name or 'Our Academy'
    return {
        'template': landing_defaults.DEFAULT_TEMPLATE,
        'is_published': True,
        'sections': landing_defaults.default_sections(name),
        'footer': landing_defaults.default_footer(name),
        'meta': {},
        'available_templates': [
            {'key': k, 'label': v}
            for k, v in landing_defaults.TEMPLATE_CHOICES.items()
        ],
    }


def _abs_media_url(request, url):
    """Return an absolute URL for a media file.

    Cloud storage already yields absolute URLs; local dev yields a
    MEDIA_URL-relative path, which we make absolute against the request host.
    """
    if not url:
        return None
    if not url.startswith(('http://', 'https://')):
        if not url.startswith('/'):
            url = '/' + url
        url = request.build_absolute_uri(url)
    return url


def _tenant_brand(tenant, request):
    """Branding block bundled with the public landing config for convenience."""
    return {
        'id': str(tenant.id),
        'name': tenant.name,
        'tagline': tenant.tagline,
        'logo': _abs_media_url(request, tenant.logo.url) if tenant.logo else None,
        'favicon': _abs_media_url(request, tenant.favicon.url) if tenant.favicon else None,
        'theme': tenant.theme or tenant.DEFAULT_THEME,
        'show_name': tenant.show_name,
    }


# ── Public ────────────────────────────────────────────────────────────────
class PublicLandingView(APIView):
    """Return the tenant's published landing config (or generic defaults)."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request):
        tenant = _require_tenant(request)
        page = LandingPage.objects.filter(tenant=tenant).first()
        if page and page.is_published:
            config = LandingPageSerializer(page).data
        else:
            # No record yet, or an unpublished draft → serve generic defaults so
            # the public page is always complete and professional.
            config = _build_default_config(tenant)
        config['brand'] = _tenant_brand(tenant, request)
        return Response(config)


class PublicLegalView(APIView):
    """Return a tenant's legal document (or the platform generic default)."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request, doc_type):
        tenant = _require_tenant(request)
        if doc_type not in landing_defaults.LEGAL_DOC_TYPES:
            return Response(
                {'error': 'Unknown document type.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        doc = LegalDocument.objects.filter(tenant=tenant, doc_type=doc_type).first()
        if doc and (doc.content or '').strip():
            data = LegalDocumentSerializer(doc).data
        else:
            default = landing_defaults.default_legal(doc_type, tenant.name or 'Our Academy')
            data = {
                'doc_type': doc_type,
                'title': default['title'],
                'content': default['content'],
                'is_default': True,
            }
        data['brand'] = _tenant_brand(tenant, request)
        return Response(data)


# ── Tenant admin ────────────────────────────────────────────────────────────
class LandingPageAdminView(APIView):
    """GET / PUT the current tenant's landing page configuration."""

    permission_classes = [permissions.IsAuthenticated, IsTenantAdmin]

    def get(self, request):
        tenant = _require_tenant(request)
        page = LandingPage.objects.filter(tenant=tenant).first()
        if page:
            return Response(LandingPageSerializer(page).data)
        # Serve defaults (unsaved) so the builder opens fully populated.
        return Response(_build_default_config(tenant))

    def put(self, request):
        tenant = _require_tenant(request)
        page = LandingPage.objects.filter(tenant=tenant).first()
        serializer = LandingPageSerializer(
            page, data=request.data, partial=page is not None
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(tenant=tenant)
        return Response(serializer.data)


class LegalDocumentAdminView(APIView):
    """GET / PUT a single legal document for the current tenant."""

    permission_classes = [permissions.IsAuthenticated, IsTenantAdmin]

    def _validate_type(self, doc_type):
        if doc_type not in landing_defaults.LEGAL_DOC_TYPES:
            raise NotFound('Unknown document type.')

    def get(self, request, doc_type):
        tenant = _require_tenant(request)
        self._validate_type(doc_type)
        doc = LegalDocument.objects.filter(tenant=tenant, doc_type=doc_type).first()
        if doc:
            data = LegalDocumentSerializer(doc).data
            data['is_default'] = False
        else:
            default = landing_defaults.default_legal(doc_type, tenant.name or 'Our Academy')
            data = {
                'doc_type': doc_type,
                'title': default['title'],
                'content': default['content'],
                'is_default': True,
            }
        return Response(data)

    def put(self, request, doc_type):
        tenant = _require_tenant(request)
        self._validate_type(doc_type)
        doc, _ = LegalDocument.objects.get_or_create(
            tenant=tenant, doc_type=doc_type,
            defaults={'title': landing_defaults.LEGAL_DOC_TYPES[doc_type]},
        )
        doc.title = request.data.get('title', doc.title) or ''
        doc.content = request.data.get('content', doc.content) or ''
        doc.save()
        data = LegalDocumentSerializer(doc).data
        data['is_default'] = False
        return Response(data)


class LandingImageUploadView(APIView):
    """Upload a single image for a landing section and get back its URL.

    Tenant-admin only. Accepts either a multipart ``image`` file or a JSON body
    with an ``image`` data URL, and returns ``{"url": "..."}`` (absolute, so it
    resolves correctly when the public landing page is served from a different
    origin than the API).
    """

    permission_classes = [permissions.IsAuthenticated, IsTenantAdmin]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    MAX_BYTES = 5 * 1024 * 1024  # 5 MB

    def post(self, request):
        _require_tenant(request)
        upload = request.FILES.get('image')
        if upload is None:
            data = request.data.get('image')
            if not isinstance(data, str) or not data.startswith('data:image'):
                return Response(
                    {'detail': 'No image provided.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                header, b64 = data.split(';base64,', 1)
                ext = header.split('/')[-1].split('+')[0] or 'png'
                if ext.lower() in ('jpg', 'jpeg'):
                    ext = 'jpg'
                upload = ContentFile(
                    base64.b64decode(b64), name=f'{uuid.uuid4().hex}.{ext}'
                )
            except (ValueError, TypeError, base64.binascii.Error):
                return Response(
                    {'detail': 'Invalid base64 image data.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if upload.size and upload.size > self.MAX_BYTES:
            return Response(
                {'detail': 'Image is too large (max 5 MB).'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        path = default_storage.save(
            f'landing_images/{uuid.uuid4().hex}_{upload.name}', upload
        )
        url = default_storage.url(path)
        # Cloud storage (S3/Azure) already returns an absolute URL; local dev
        # returns a MEDIA_URL-relative path, so make it absolute against the host.
        if not url.startswith(('http://', 'https://')):
            if not url.startswith('/'):
                url = '/' + url
            url = request.build_absolute_uri(url)
        return Response({'url': url}, status=status.HTTP_201_CREATED)
