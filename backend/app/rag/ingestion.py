"""Document ingestion pipeline: storage → parse → chunk → embed → pgvector."""
import uuid
from datetime import datetime, timezone
from pathlib import Path

import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.document import Document, DocumentChunk

logger = structlog.get_logger()


def _chunk_text(content: str) -> list[str]:
    size, overlap = settings.chunk_size * 4, settings.chunk_overlap * 4  # rough chars
    chunks, start = [], 0
    while start < len(content):
        end = start + size
        chunks.append(content[start:end])
        start += size - overlap
    return [c for c in chunks if c.strip()]


async def ingest_document(document_id: uuid.UUID, db: AsyncSession) -> None:
    result = await db.execute(
        text("SELECT * FROM documents WHERE id = :id"), {"id": str(document_id)}
    )
    doc_row = result.mappings().one_or_none()
    if not doc_row:
        raise ValueError(f"Document {document_id} not found")

    await db.execute(
        text("UPDATE documents SET status='processing' WHERE id=:id"), {"id": str(document_id)}
    )
    await db.commit()

    try:
        from app.services.storage import download_file
        data = await download_file(f"{doc_row['user_id']}/{document_id}/{doc_row['filename']}")
        content = _parse(data, doc_row["file_type"])
        chunks = _chunk_text(content)

        from app.rag.embeddings import embed_texts
        embeddings = await embed_texts(chunks, input_type="search_document")

        # Delete old chunks if re-ingesting
        await db.execute(
            text("DELETE FROM document_chunks WHERE document_id=:id"), {"id": str(document_id)}
        )

        for i, (chunk, emb) in enumerate(zip(chunks, embeddings)):
            chunk_id = uuid.uuid4()
            await db.execute(
                text("""
                    INSERT INTO document_chunks (id, document_id, content, chunk_index, embedding, metadata)
                    VALUES (:id, :doc_id, :content, :idx, :emb::vector, :meta)
                """),
                {
                    "id": str(chunk_id),
                    "doc_id": str(document_id),
                    "content": chunk,
                    "idx": i,
                    "emb": "[" + ",".join(str(x) for x in emb) + "]",
                    "meta": "{}",
                },
            )

        await db.execute(
            text("UPDATE documents SET status='ready', chunk_count=:n, ingested_at=now() WHERE id=:id"),
            {"n": len(chunks), "id": str(document_id)},
        )
        await db.commit()
        logger.info("ingestion.complete", document_id=str(document_id), chunks=len(chunks))
    except Exception as exc:
        await db.execute(
            text("UPDATE documents SET status='error' WHERE id=:id"), {"id": str(document_id)}
        )
        await db.commit()
        logger.error("ingestion.failed", document_id=str(document_id), error=str(exc))
        raise


def _parse(data: bytes, file_type: str | None) -> str:
    ft = (file_type or "txt").lower()
    if ft == "txt":
        return data.decode("utf-8", errors="ignore")
    if ft == "docx":
        import docx, io
        doc = docx.Document(io.BytesIO(data))
        return "\n".join(p.text for p in doc.paragraphs)
    if ft == "pdf":
        try:
            import pypdf, io
            reader = pypdf.PdfReader(io.BytesIO(data))
            return "\n".join(p.extract_text() or "" for p in reader.pages)
        except ImportError:
            return data.decode("utf-8", errors="ignore")
    return data.decode("utf-8", errors="ignore")
