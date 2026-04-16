"""Documents endpoint — upload, ingestion, listing."""
import uuid
import structlog
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.dependencies import get_current_user, get_db
from app.models.document import Document
from app.schemas.document import DocumentRead
from app.services import storage

logger = structlog.get_logger()
router = APIRouter()

ALLOWED = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
}


@router.post("/upload", response_model=DocumentRead, status_code=201)
async def upload_document(
    file: UploadFile,
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    data = await file.read()
    if len(data) > settings.max_upload_size_mb * 1024 * 1024:
        raise HTTPException(413, f"Fichero supera {settings.max_upload_size_mb} MB")
    ct = file.content_type or "application/octet-stream"
    if ct not in ALLOWED:
        raise HTTPException(415, f"Tipo no soportado: {ct}")

    doc_id = uuid.uuid4()
    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    ftype = {"pdf": "pdf", "docx": "docx", "txt": "txt"}.get(ext, "txt")

    await storage.upload_file(f"{current_user.id}/{doc_id}/{file.filename}", data, ct)

    doc = Document(id=doc_id, user_id=current_user.id, filename=file.filename,
                   file_type=ftype, size_bytes=len(data), status="pending")
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    if settings.cohere_api_key:
        from app.rag.ingestion import ingest_document
        background_tasks.add_task(ingest_document, doc_id, db)

    logger.info("document.uploaded", doc_id=str(doc_id))
    return doc


@router.get("/", response_model=list[DocumentRead])
async def list_documents(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(Document).where(Document.user_id == current_user.id).order_by(Document.id.desc()))
    return list(r.scalars().all())


@router.get("/{document_id}", response_model=DocumentRead)
async def get_document(document_id: uuid.UUID, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(Document).where(Document.id == document_id, Document.user_id == current_user.id))
    doc = r.scalar_one_or_none()
    if not doc:
        raise HTTPException(404, "Documento no encontrado")
    return doc


@router.delete("/{document_id}", status_code=204)
async def delete_document(document_id: uuid.UUID, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(Document).where(Document.id == document_id, Document.user_id == current_user.id))
    doc = r.scalar_one_or_none()
    if not doc:
        raise HTTPException(404, "Documento no encontrado")
    await storage.delete_file(f"{current_user.id}/{document_id}/{doc.filename}")
    await db.delete(doc)
    await db.commit()
