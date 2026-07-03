"""
Shared DRF serializer fields.

``Base64ImageField`` lets clients send images inline as data URLs (e.g. from a
paste / drag-drop in the browser) without switching the request to multipart.
The decoded file is written through the configured default storage — which is
Azure Blob Storage in production — and read back as its public URL.
"""
import base64
import uuid

from django.core.files.base import ContentFile
from rest_framework import serializers


class Base64ImageField(serializers.ImageField):
    """
    Image field that accepts, on write, any of:

    * a ``data:image/...;base64,...`` string  -> decoded and stored as a new file
    * ``None``                                -> clears the image
    * an existing http(s) URL (the value we return on read) -> left unchanged
      (raises ``SkipField`` so the current file is preserved)

    On read it behaves like a normal ``ImageField`` and returns the file URL.
    """

    def to_internal_value(self, data):
        if isinstance(data, str):
            if data.startswith('data:image'):
                try:
                    header, b64 = data.split(';base64,', 1)
                    ext = header.split('/')[-1].split('+')[0] or 'png'
                    decoded = base64.b64decode(b64)
                except (ValueError, TypeError, base64.binascii.Error):
                    raise serializers.ValidationError('Invalid base64 image data.')
                if ext.lower() in ('jpg', 'jpeg'):
                    ext = 'jpg'
                data = ContentFile(decoded, name=f'{uuid.uuid4().hex}.{ext}')
                return super().to_internal_value(data)
            # An existing URL (round-tripped from a previous read) or a blank
            # string means "no change" — keep whatever is already stored.
            raise serializers.SkipField()
        if data is None:
            return None
        return super().to_internal_value(data)
