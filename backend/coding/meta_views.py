"""Meta endpoint: supported languages + engine health (for editor + admin UI)."""
from django.conf import settings
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .languages import public_languages
from . import services


class CodingMetaView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        data = {
            'enabled': getattr(settings, 'CODING_ENABLED', True),
            'languages': public_languages(),
        }
        if request.query_params.get('health') == '1':
            data['engine'] = services.engine_health()
        return Response(data)
