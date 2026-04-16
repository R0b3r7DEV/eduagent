"""User profile endpoints — API key management."""

import re

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.user import ApiKeySet, ApiKeyStatus
from app.services.crypto import DecryptionError, decrypt, encrypt

logger = structlog.get_logger()
router = APIRouter()

_SK_ANT_RE = re.compile(r"^sk-ant-")


@router.get("/api-key/status", response_model=ApiKeyStatus)
async def get_api_key_status(
    current_user: User = Depends(get_current_user),
) -> ApiKeyStatus:
    """Return whether the user has a stored key — never exposes the key itself."""
    has_key = current_user.anthropic_api_key_encrypted is not None
    return ApiKeyStatus(has_key=has_key)


@router.post("/api-key", status_code=status.HTTP_204_NO_CONTENT)
async def set_api_key(
    body: ApiKeySet,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Validate, encrypt and persist the user's Anthropic API key."""
    if not _SK_ANT_RE.match(body.api_key):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid Anthropic API key — must start with 'sk-ant-'",
        )
    current_user.anthropic_api_key_encrypted = encrypt(body.api_key)
    db.add(current_user)
    await db.commit()
    logger.info("user.api_key.set", user_id=str(current_user.id))


@router.delete("/api-key", status_code=status.HTTP_204_NO_CONTENT)
async def delete_api_key(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Remove the user's stored key."""
    if current_user.anthropic_api_key_encrypted is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No API key stored",
        )
    current_user.anthropic_api_key_encrypted = None
    db.add(current_user)
    await db.commit()
    logger.info("user.api_key.deleted", user_id=str(current_user.id))
