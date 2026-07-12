"""
Symmetric field encryption for sensitive tenant secrets (e.g. payment gateway
API keys) stored at rest in the database.

A Fernet key is derived from ``settings.FIELD_ENCRYPTION_KEY`` when provided, and
otherwise deterministically from ``settings.SECRET_KEY``. Deriving from
``SECRET_KEY`` keeps local/dev setups zero-config; production should set an
explicit ``FIELD_ENCRYPTION_KEY`` so rotating the Django secret key does not make
previously-stored ciphertext undecryptable.
"""
import base64
import hashlib
from functools import lru_cache

from django.conf import settings
from cryptography.fernet import Fernet, InvalidToken


@lru_cache(maxsize=1)
def _fernet() -> Fernet:
    configured = getattr(settings, 'FIELD_ENCRYPTION_KEY', None)
    if configured:
        # Accept a ready-made urlsafe base64 Fernet key.
        key = configured.encode() if isinstance(configured, str) else configured
    else:
        # Derive a stable 32-byte key from SECRET_KEY.
        digest = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
        key = base64.urlsafe_b64encode(digest)
    return Fernet(key)


def encrypt(value: str) -> str:
    """Encrypt a plaintext string, returning urlsafe ciphertext (empty in → empty out)."""
    if value is None or value == '':
        return ''
    token = _fernet().encrypt(value.encode())
    return token.decode()


def decrypt(token: str) -> str:
    """Decrypt ciphertext produced by :func:`encrypt`. Returns '' on empty/invalid input."""
    if not token:
        return ''
    try:
        return _fernet().decrypt(token.encode()).decode()
    except (InvalidToken, ValueError, TypeError):
        return ''
