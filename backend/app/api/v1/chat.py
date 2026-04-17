"""Chat endpoint — SSE streaming."""
import json
import uuid
from typing import AsyncGenerator

import structlog
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db, resolve_llm_key
from app.models.session import ChatMessage, ChatSession
from app.schemas.chat import ChatRequest

logger = structlog.get_logger()
router = APIRouter()
_SSE_HEADERS = {"X-Accel-Buffering": "no", "Cache-Control": "no-cache"}


def _sse(p: dict) -> str:
    return f"data: {json.dumps(p, ensure_ascii=False)}\n\n"


async def _no_key_stream() -> AsyncGenerator[str, None]:
    yield _sse({"type": "no_api_key", "content": (
        "Para chatear necesitas añadir una API key. "
        "Puedes usar **Anthropic Claude** (console.anthropic.com) "
        "o **Google Gemini**, que es gratuito (aistudio.google.com). "
        "Añádela en ⚙️ Configuración → Mi API Key."
    )})
    yield _sse({"type": "done"})


@router.post("/stream")
async def stream_chat(
    request: ChatRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    provider, api_key = resolve_llm_key(current_user)
    if not provider or not api_key:
        generator = _no_key_stream()
    else:
        from app.services.chat_service import stream_response
        generator = stream_response(
            message=request.message,
            provider=provider,
            api_key=api_key,
            user=current_user,
            session_id=request.session_id,
            db=db,
            language=request.language or "es",
        )
    return StreamingResponse(generator, media_type="text/event-stream", headers=_SSE_HEADERS)


@router.get("/sessions")
async def list_sessions(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    r = await db.execute(
        select(ChatSession)
        .where(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.updated_at.desc())
        .limit(50)
    )
    sessions = r.scalars().all()
    return [{"id": str(s.id), "title": s.title, "updated_at": s.updated_at.isoformat()} for s in sessions]


@router.get("/sessions/{session_id}")
async def get_session(
    session_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    r = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at)
    )
    msgs = r.scalars().all()
    return [{"id": str(m.id), "role": m.role, "content": m.content, "created_at": m.created_at.isoformat()} for m in msgs]


@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    r = await db.execute(select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == current_user.id))
    s = r.scalar_one_or_none()
    if s:
        await db.delete(s)
        await db.commit()
    return {"deleted": str(session_id)}
