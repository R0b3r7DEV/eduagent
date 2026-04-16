"""Supabase Storage helpers — upload, signed URL, delete."""

import structlog

from app.config import settings
from app.exceptions import DocumentIngestionError
from app.services.supabase_client import get_service_client

logger = structlog.get_logger()

BUCKET = settings.supabase_storage_bucket


async def upload_file(path: str, data: bytes, content_type: str) -> str:
    """
    Upload *data* to Supabase Storage at *path* inside the documents bucket.

    Returns the storage path on success.
    Path convention: ``{user_id}/{document_id}/{filename}``
    """
    client = await get_service_client()
    try:
        response = await client.storage.from_(BUCKET).upload(
            path,
            data,
            file_options={"content-type": content_type, "upsert": "true"},
        )
    except Exception as exc:
        logger.error("storage.upload.failed", path=path, error=str(exc))
        raise DocumentIngestionError(f"Storage upload failed: {exc}") from exc

    logger.info("storage.upload.ok", path=path, size_bytes=len(data))
    return response.path


async def get_signed_url(path: str, expires_in: int = 3600) -> str:
    """Return a time-limited signed URL for *path* (default 1 hour)."""
    client = await get_service_client()
    response = await client.storage.from_(BUCKET).create_signed_url(path, expires_in)
    return response["signedURL"]


async def delete_file(path: str) -> None:
    """Delete *path* from the documents bucket."""
    client = await get_service_client()
    await client.storage.from_(BUCKET).remove([path])
    logger.info("storage.delete.ok", path=path)
