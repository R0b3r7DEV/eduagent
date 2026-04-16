"""FastAPI dependency injection — DB session, Redis, Supabase JWT auth, Anthropic client."""

from typing import AsyncGenerator

import anthropic
import redis.asyncio as aioredis
import structlog
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings

logger = structlog.get_logger()

# ── PostgreSQL (Supabase) ──────────────────────────────────────────────────────
engine = create_async_engine(
    settings.database_url,
    echo=settings.environment == "development",
    # Supabase session pooler closes idle connections; keep pool small
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
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
    Verify a Supabase-issued JWT and return (or auto-provision) the user row.

    Supabase signs tokens with HS256 using the project JWT secret.
    The ``sub`` claim carries the Supabase Auth UUID.
    """
    from app.models.user import User

    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except JWTError as exc:
        logger.warning("auth.jwt.invalid", error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    supabase_uid: str = payload["sub"]
    email: str = payload.get("email", "")

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


# ── Anthropic key resolution ───────────────────────────────────────────────────

def resolve_anthropic_key(user) -> str | None:
    """
    Return the Anthropic API key for *user*, or None.

    Resolution order:
    1. User's own key (decrypted from DB) — always preferred.
    2. Server env key — only as fallback in development mode.
       Production always requires the user to supply their own key.
    """
    from app.services.crypto import DecryptionError, decrypt

    if user.anthropic_api_key_encrypted:
        try:
            return decrypt(user.anthropic_api_key_encrypted)
        except DecryptionError:
            pass  # key rotation / corruption — fall through

    if settings.environment == "development" and settings.anthropic_api_key:
        return settings.anthropic_api_key

    return None


# ── Anthropic client dependency (non-chat endpoints) ──────────────────────────

async def get_anthropic_client(
    current_user=Depends(get_current_user),
) -> anthropic.AsyncAnthropic:
    """Return a ready AsyncAnthropic client or raise 402. Chat uses resolve_anthropic_key."""
    api_key = resolve_anthropic_key(current_user)
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={"error": "no_anthropic_key", "message": "Add your Anthropic API key."},
        )
    return anthropic.AsyncAnthropic(api_key=api_key)
