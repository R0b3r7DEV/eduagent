"""Chat service — session management, RAG, and SSE streaming."""
import json
import uuid
from typing import AsyncGenerator

import anthropic
import structlog
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.session import ChatMessage, ChatSession

logger = structlog.get_logger()

_PROMPTS = {
    "child": None,
    "teen": None,
    "adult": None,
}


def _get_system_prompt(level: str, language: str, context: str, intent: str) -> str:
    from app.agent.prompts import tutor_child, tutor_teen, tutor_adult, summarizer

    base = {
        "child": tutor_child.SYSTEM_PROMPT,
        "teen": tutor_teen.SYSTEM_PROMPT,
        "summarize": summarizer.SYSTEM_PROMPT,
    }.get(level if intent != "summarize" else "summarize", tutor_adult.SYSTEM_PROMPT)

    ctx = f"\n{context}" if context else "\n(Sin documentos de clase disponibles)"
    hw = (
        "\n\n⚠️ MODO DEBERES: El alumno pide ayuda con un ejercicio. "
        "NUNCA des la respuesta directa. Guía con preguntas y pistas progresivas."
        if intent == "homework_help"
        else ""
    )
    return base.format(language=language, context=ctx) + hw


async def _detect_intent(message: str, history: list, api_key: str) -> str:
    valid = {"tutor", "homework_help", "summarize", "tasks", "general"}
    hist = "\n".join(f"{m.role}: {m.content[:80]}" for m in history[-5:]) or "—"
    prompt = (
        f"Historial:\n{hist}\n\nMensaje: {message}\n\n"
        "Clasifica la intención (una palabra): tutor / homework_help / summarize / tasks / general"
    )
    try:
        client = anthropic.AsyncAnthropic(api_key=api_key)
        resp = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=10,
            messages=[{"role": "user", "content": prompt}],
        )
        intent = resp.content[0].text.strip().lower().split()[0]
        return intent if intent in valid else "tutor"
    except Exception:
        return "tutor"


async def stream_response(
    message: str,
    api_key: str,
    user,
    session_id: str | None,
    db: AsyncSession,
    language: str = "es",
) -> AsyncGenerator[str, None]:
    """Yield SSE-formatted strings."""

    def sse(payload: dict) -> str:
        return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"

    student_level = user.student_level or "adult"

    # ── 1. Session ─────────────────────────────────────────────────────────────
    session = None
    if session_id:
        try:
            sid = uuid.UUID(session_id)
            r = await db.execute(
                select(ChatSession).where(ChatSession.id == sid, ChatSession.user_id == user.id)
            )
            session = r.scalar_one_or_none()
        except Exception:
            pass

    if not session:
        session = ChatSession(user_id=user.id)
        db.add(session)
        await db.commit()
        await db.refresh(session)

    yield sse({"type": "session_id", "session_id": str(session.id)})

    # ── 2. History ─────────────────────────────────────────────────────────────
    r = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at.desc())
        .limit(20)
    )
    history = list(reversed(r.scalars().all()))

    # ── 3. Intent ──────────────────────────────────────────────────────────────
    intent = await _detect_intent(message, history, api_key)
    yield sse({"type": "intent", "intent": intent})

    # ── 4. RAG context ─────────────────────────────────────────────────────────
    context_text = ""
    sources: list[dict] = []
    if intent in ("tutor", "homework_help", "summarize"):
        try:
            from app.rag.retriever import retrieve_context
            chunks = await retrieve_context(message, user.id, db)
            if chunks:
                context_text = "\n\n".join(c["content"] for c in chunks)
                sources = [c["metadata"] for c in chunks]
        except Exception as e:
            logger.warning("chat.rag.skip", error=str(e))

    # ── 5. Build Anthropic messages ────────────────────────────────────────────
    system_prompt = _get_system_prompt(student_level, language, context_text, intent)
    anthropic_msgs = [{"role": m.role, "content": m.content} for m in history]
    anthropic_msgs.append({"role": "user", "content": message})

    # ── 6. Save user message ───────────────────────────────────────────────────
    user_msg = ChatMessage(session_id=session.id, role="user", content=message, intent=intent)
    db.add(user_msg)
    if not history:
        session.title = message[:60] + ("…" if len(message) > 60 else "")
    await db.commit()

    # ── 7. Stream LLM ──────────────────────────────────────────────────────────
    full = ""
    try:
        client = anthropic.AsyncAnthropic(api_key=api_key)
        async with client.messages.stream(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            system=system_prompt,
            messages=anthropic_msgs,
        ) as stream:
            async for token in stream.text_stream:
                full += token
                yield sse({"type": "text", "content": token})

        for src in sources:
            fname = src.get("filename")
            if fname:
                yield sse({"type": "source", "filename": fname, "course": src.get("course", "")})

        # Save assistant message
        db.add(ChatMessage(
            session_id=session.id,
            role="assistant",
            content=full,
            intent=intent,
            rag_chunks_used={"sources": sources} if sources else None,
        ))
        await db.commit()
        yield sse({"type": "done"})

    except anthropic.AuthenticationError:
        yield sse({"type": "error", "content": "API key inválida. Verifica tu clave en Ajustes."})
    except Exception as exc:
        logger.error("chat.stream.error", error=str(exc))
        yield sse({"type": "error", "content": "Error generando respuesta. Inténtalo de nuevo."})
