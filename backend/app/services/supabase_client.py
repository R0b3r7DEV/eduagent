"""Supabase client factory — service-role (backend) and anon (public) clients."""

from functools import lru_cache

from supabase import AsyncClient, acreate_client

from app.config import settings

# Module-level cached clients; created lazily on first request.
_service_client: AsyncClient | None = None
_anon_client: AsyncClient | None = None


async def get_service_client() -> AsyncClient:
    """
    Service-role client for backend operations (storage, admin queries).
    Never exposed to the frontend.
    """
    global _service_client
    if _service_client is None:
        _service_client = await acreate_client(
            settings.supabase_url,
            settings.supabase_service_role_key,
        )
    return _service_client


async def get_anon_client() -> AsyncClient:
    """Anon client — same permissions as an unauthenticated browser request."""
    global _anon_client
    if _anon_client is None:
        _anon_client = await acreate_client(
            settings.supabase_url,
            settings.supabase_anon_key,
        )
    return _anon_client
