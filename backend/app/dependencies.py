"""FastAPI dependency injection — DB session, Redis, Supabase JWT auth, Anthropic client."""

from typing import AsyncGenerator

import anthropic
import httpx
import redis.asyncio as aioredis
import structlog
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings

logger = structlog.get_logger()

logger = structlog.get_logger()

# ── PostgreSQL (Supabase) ──────────────────────────────────────────────────────
_db_url = settings.database_url.replace("postgresql+asyncpg://", "postgresql+psycopg://")

engine = create_async_engine(
    _db_url,
    echo=False,
    pool_size=3,
    max_overflow=5,
    pool_pre_ping=True,
    pool_recycle=300,
)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


# ── Redis / Upstash ────────────────────────────────────────────────────────────
# Upstash URLs use rediss:// (TLS); redis-py handles both schemes transparently.
redis_pool = aioredis.ConnectionPool.from_url(
    settings.redis_url,
    decode_responses=True,
    ssl_cert_reqs=None,  # Upstash uses self-signed cert on free tier
)


async def get_redis() -> aioredis.Redis:
    return aioredis.Redis(connection_pool=redis_pool)


# ── Supabase JWT auth ──────────────────────────────────────────────────────────
bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
):
    """
    Verify a Supabase-issued JWT using the Supabase client (supports RS256 and HS256).
    The ``sub`` claim carries the Supabase Auth UUID.
    """
    from app.models.user import User

    token = credentials.credentials
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{settings.supabase_url}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": settings.supabase_anon_key,
                },
                timeout=10,
            )
        if resp.status_code != 200:
            raise ValueError(f"Supabase returned {resp.status_code}")
        data = resp.json()
    except Exception as exc:
        logger.warning("auth.jwt.invalid", error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    supabase_uid: str = data["id"]
    email: str = data.get("email", "")

    result = await db.execute(select(User).where(User.supabase_uid == supabase_uid))
    user = result.scalar_one_or_none()

    if user is None:
        # First login — auto-provision a row in our users table
        user = User(supabase_uid=supabase_uid, email=email)
        db.add(user)
        await db.commit()
        await db.refresh(user)
        logger.info("auth.user.provisioned", supabase_uid=supabase_uid)

    return user


# ── LLM key resolution ────────────────────────────────────────────────────────

def resolve_llm_key(user) -> tuple[str, str] | tuple[None, None]:
    """Return (provider, api_key) for *user*, or (None, None) if no key is set.

    Resolution order per provider:
    1. User's own encrypted key from DB — always preferred.
    2. Server env key — only as fallback in development mode.

    The active provider is stored in user.llm_provider (default: 'anthropic').
    Falls back to the other provider if the active one has no key.
    """
    from app.services.crypto import DecryptionError, decrypt

    def _try_decrypt(enc: str | None) -> str | None:
        if not enc:
            return None
        try:
            return decrypt(enc)
        except DecryptionError:
            return None

    active = getattr(user, "llm_provider", None) or "anthropic"

    # Try active provider first
    if active == "anthropic":
        key = _try_decrypt(user.anthropic_api_key_encrypted)
        if key:
            return "anthropic", key
        # dev fallback
        if settings.environment == "development" and settings.anthropic_api_key:
            return "anthropic", settings.anthropic_api_key
        # fall back to gemini if user has it
        key = _try_decrypt(getattr(user, "gemini_api_key_encrypted", None))
        if key:
            return "gemini", key
    else:  # active == "gemini"
        key = _try_decrypt(getattr(user, "gemini_api_key_encrypted", None))
        if key:
            return "gemini", key
        # fall back to anthropic
        key = _try_decrypt(user.anthropic_api_key_encrypted)
        if key:
            return "anthropic", key
        if settings.environment == "development" and settings.anthropic_api_key:
            return "anthropic", settings.anthropic_api_key

    # dev fallback for gemini
    if settings.environment == "development" and settings.gemini_api_key:
        return "gemini", settings.gemini_api_key

    return None, None


# Legacy alias — kept for any existing callers
def resolve_anthropic_key(user) -> str | None:
    provider, key = resolve_llm_key(user)
    if provider == "anthropic":
        return key
    return None


# ── Anthropic client dependency (non-chat endpoints) ──────────────────────────

async def get_anthropic_client(
    current_user=Depends(get_current_user),
) -> anthropic.AsyncAnthropic:
    """Return a ready AsyncAnthropic client or raise 402."""
    provider, api_key = resolve_llm_key(current_user)
    if provider != "anthropic" or not api_key:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={"error": "no_anthropic_key", "message": "Add your Anthropic API key."},
        )
    return anthropic.AsyncAnthropic(api_key=api_key)
