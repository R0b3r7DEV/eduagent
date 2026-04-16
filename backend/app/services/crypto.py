"""Fernet symmetric encryption helpers for user secrets.

Encrypted values are stored as URL-safe base64 strings (VARCHAR in DB).
"""

from cryptography.fernet import Fernet, InvalidToken

from app.config import settings
from app.exceptions import EduAgentError


class DecryptionError(EduAgentError):
    """Raised when a stored secret cannot be decrypted (e.g. key rotation)."""


def _fernet() -> Fernet:
    return Fernet(settings.fernet_secret_key.encode())


def encrypt(plaintext: str) -> str:
    """Return a Fernet-encrypted token as a string (URL-safe base64)."""
    return _fernet().encrypt(plaintext.encode()).decode()


def decrypt(ciphertext: str) -> str:
    """Return the original plaintext, or raise DecryptionError."""
    try:
        return _fernet().decrypt(ciphertext.encode()).decode()
    except InvalidToken as exc:
        raise DecryptionError("Failed to decrypt secret — key may have rotated") from exc
