"""User profile endpoints — multi-provider API key management."""

import structlog
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.agent.llm_provider import AnthropicProvider, GeminiProvider, get_provider
from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.user import ApiKeyDelete, ApiKeySet, ApiKeyStatus, ApiKeyVerifyResult, ProviderKeyStatus
from app.services.crypto import DecryptionError, decrypt, encrypt

logger = structlog.get_logger()
router = APIRouter()


# ── Status ─────────────────────────────────────────────────────────────────────

@router.get("/api-key/status", response_model=ApiKeyStatus)
async def get_api_key_status(
    current_user: User = Depends(get_current_user),
) -> ApiKeyStatus:
    return ApiKeyStatus(
        anthropic=ProviderKeyStatus(has_key=current_user.anthropic_api_key_encrypted is not None),
        gemini=ProviderKeyStatus(has_key=current_user.gemini_api_key_encrypted is not None),
        active_provider=current_user.llm_provider or "anthropic",
    )


# ── Set key ────────────────────────────────────────────────────────────────────

@router.post("/api-key", status_code=status.HTTP_204_NO_CONTENT)
async def set_api_key(
    body: ApiKeySet,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    if body.provider == "anthropic":
        if not AnthropicProvider.validate_api_key(body.api_key):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid Anthropic key — must start with 'sk-ant-'",
            )
        current_user.anthropic_api_key_encrypted = encrypt(body.api_key)
    else:
        if not GeminiProvider.validate_api_key(body.api_key):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid Gemini key — must start with 'AIza'",
            )
        current_user.gemini_api_key_encrypted = encrypt(body.api_key)

    # Automatically activate the provider that was just set
    current_user.llm_provider = body.provider
    db.add(current_user)
    await db.commit()
    logger.info("user.api_key.set", user_id=str(current_user.id), provider=body.provider)


# ── Delete key ─────────────────────────────────────────────────────────────────

@router.delete("/api-key", status_code=status.HTTP_204_NO_CONTENT)
async def delete_api_key(
    provider: str = Query(default="anthropic"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    if provider == "anthropic":
        if current_user.anthropic_api_key_encrypted is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No Anthropic key stored")
        current_user.anthropic_api_key_encrypted = None
        # If this was the active provider, fall back to gemini (or leave as-is)
        if current_user.llm_provider == "anthropic" and current_user.gemini_api_key_encrypted:
            current_user.llm_provider = "gemini"
    elif provider == "gemini":
        if current_user.gemini_api_key_encrypted is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No Gemini key stored")
        current_user.gemini_api_key_encrypted = None
        if current_user.llm_provider == "gemini" and current_user.anthropic_api_key_encrypted:
            current_user.llm_provider = "anthropic"
    else:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Unknown provider")

    db.add(current_user)
    await db.commit()
    logger.info("user.api_key.deleted", user_id=str(current_user.id), provider=provider)


# ── Switch active provider ─────────────────────────────────────────────────────

@router.post("/api-key/active-provider", status_code=status.HTTP_204_NO_CONTENT)
async def set_active_provider(
    provider: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    if provider not in ("anthropic", "gemini"):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Unknown provider")
    current_user.llm_provider = provider
    db.add(current_user)
    await db.commit()


# ── Verify stored key ─────────────────────────────────────────────────────────

@router.get("/api-key/verify", response_model=ApiKeyVerifyResult)
async def verify_api_key(
    provider: str = Query(default="anthropic"),
    current_user: User = Depends(get_current_user),
) -> ApiKeyVerifyResult:
    """Make a minimal live test call to confirm the stored key is valid."""
    encrypted = (
        current_user.anthropic_api_key_encrypted
        if provider == "anthropic"
        else current_user.gemini_api_key_encrypted
    )
    if not encrypted:
        return ApiKeyVerifyResult(provider=provider, valid=False, error="No key stored")  # type: ignore[arg-type]

    try:
        api_key = decrypt(encrypted)
    except DecryptionError:
        return ApiKeyVerifyResult(provider=provider, valid=False, error="Decryption failed")  # type: ignore[arg-type]

    try:
        llm = get_provider(provider, api_key)
        result = await llm.complete(
            messages=[{"role": "user", "content": "Hi"}],
            system_prompt="You are a test assistant. Reply with one word.",
            max_tokens=5,
        )
        logger.info("user.api_key.verify.ok", provider=provider, preview=result[:20])
        return ApiKeyVerifyResult(provider=provider, valid=True)  # type: ignore[arg-type]
    except Exception as exc:
        msg = str(exc)
        logger.warning("user.api_key.verify.fail", provider=provider, error=msg)
        return ApiKeyVerifyResult(provider=provider, valid=False, error=msg[:120])  # type: ignore[arg-type]
