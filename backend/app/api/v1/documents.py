"""Documents endpoint — upload to Supabase Storage, ingestion status, listing."""

import uuid

import structlog
from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.dependencies import get_current_user, get_db
from app.models.document import Document
from app.models.user import User
from app.schemas.document import DocumentRead
from app.services import storage

logger = structlog.get_logger()
router = APIRouter()


@router.post("/upload", response_model=DocumentRead, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Document:
    """Validate, upload to Supabase Storage and create a DB record."""
    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    data = await file.read()

    if len(data) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds {settings.max_upload_size_mb} MB limit",
        )

    allowed_types = {"application/pdf", "application/vnd.openxmlformats-officedocument"
                     ".wordprocessingml.document", "text/plain"}
    content_type = file.content_type or "application/octet-stream"
    if content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: {content_type}",
        )

    document_id = uuid.uuid4()
    storage_path = f"{current_user.id}/{document_id}/{file.filename}"

    await storage.upload_file(storage_path, data, content_type)

    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    file_type = {"pdf": "pdf", "docx": "docx", "txt": "txt"}.get(ext, "txt")

    doc = Document(
        id=document_id,
        user_id=current_user.id,
        filename=file.filename,
        file_type=file_type,
        size_bytes=len(data),
        status="pending",
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    logger.info("document.uploaded", document_id=str(document_id), user_id=str(current_user.id))
    return doc


@router.get("/", response_model=list[DocumentRead])
async def list_documents(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[Document]:
    result = await db.execute(
        select(Document).where(Document.user_id == current_user.id)
    )
    return list(result.scalars().all())


@router.get("/{document_id}", response_model=DocumentRead)
async def get_document(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Document:
    result = await db.execute(
        select(Document).where(
            Document.id == document_id, Document.user_id == current_user.id
        )
    )
    doc = result.scalar_one_or_none()
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return doc


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(
        select(Document).where(
            Document.id == document_id, Document.user_id == current_user.id
        )
    )
    doc = result.scalar_one_or_none()
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    storage_path = f"{current_user.id}/{document_id}/{doc.filename}"
    await storage.delete_file(storage_path)

    await db.delete(doc)
    await db.commit()
    logger.info("document.deleted", document_id=str(document_id))
