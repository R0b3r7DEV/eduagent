"""Vector similarity retrieval via pgvector."""
import uuid
import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings

logger = structlog.get_logger()


async def retrieve_context(
    query: str,
    user_id: uuid.UUID | str,
    db: AsyncSession | None = None,
    top_k: int | None = None,
) -> list[dict]:
    if top_k is None:
        top_k = settings.top_k_retrieval
    if db is None:
        return []
    try:
        from app.rag.embeddings import embed_texts
        embs = await embed_texts([query], input_type="search_query")
        vec = "[" + ",".join(str(x) for x in embs[0]) + "]"
    except Exception as e:
        logger.warning("retriever.embed.failed", error=str(e))
        return []

    rows = (await db.execute(
        text("""
            SELECT dc.content, dc.metadata, d.filename, d.course_name
            FROM document_chunks dc
            JOIN documents d ON d.id = dc.document_id
            WHERE d.user_id = :uid AND dc.embedding IS NOT NULL
            ORDER BY dc.embedding <=> :emb::vector
            LIMIT :lim
        """),
        {"uid": str(user_id), "emb": vec, "lim": top_k},
    )).fetchall()

    return [
        {"content": r.content, "metadata": {**(r.metadata or {}), "filename": r.filename, "course": r.course_name}}
        for r in rows
    ]
