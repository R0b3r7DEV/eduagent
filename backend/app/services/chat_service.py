"""Chat service — session management, RAG, and SSE streaming.

Supports any LLMProvider (Anthropic or Gemini) transparently.
"""
import json
import uuid
from typing import AsyncGenerator

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agent.llm_provider import LLMProvider, get_provider
from app.models.session import ChatMessage, ChatSession

logger = structlog.get_logger()


def _get_system_prompt(level: str, language: str, context: str, intent: str) -> str:
    from app.agent.prompts import summarizer, tutor_adult, tutor_child, tutor_teen

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


async def _detect_intent(message: str, history: list, llm: LLMProvider) -> str:
    valid = {"tutor", "homework_help", "summarize", "tasks", "general"}
    hist = "\n".join(f"{m.role}: {m.content[:80]}" for m in history[-5:]) or "—"
    prompt = (
        f"Historial:\n{hist}\n\nMensaje: {message}\n\n"
        "Clasifica la intención (una palabra): tutor / homework_help / summarize / tasks / general"
    )
    try:
        intent = await llm.complete(
            messages=[{"role": "user", "content": prompt}],
            system_prompt="Eres un clasificador de intenciones. Responde solo con una palabra.",
            max_tokens=10,
        )
        word = intent.strip().lower().split()[0]
        return word if word in valid else "tutor"
    except Exception:
        return "tutor"


async def stream_response(
    message: str,
    provider: str,
    api_key: str,
    user,
    session_id: str | None,
    db: AsyncSession,
    language: str = "es",
) -> AsyncGenerator[str, None]:
    """Yield SSE-formatted strings for the chat stream."""

    def sse(payload: dict) -> str:
        return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"

    student_level = user.student_level or "adult"
    llm = get_provider(provider, api_key)

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
    intent = await _detect_intent(message, history, llm)
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

    # ── 5. Build messages ──────────────────────────────────────────────────────
    system_prompt = _get_system_prompt(student_level, language, context_text, intent)
    messages = [{"role": m.role, "content": m.content} for m in history]
    messages.append({"role": "user", "content": message})

    # ── 6. Save user message ───────────────────────────────────────────────────
    user_msg = ChatMessage(session_id=session.id, role="user", content=message, intent=intent)
    db.add(user_msg)
    if not history:
        session.title = message[:60] + ("…" if len(message) > 60 else "")
    await db.commit()

    # ── 7. Stream ──────────────────────────────────────────────────────────────
    full = ""
    try:
        async for token in llm.stream(messages, system_prompt):
            full += token
            yield sse({"type": "text", "content": token})

        for src in sources:
            fname = src.get("filename")
            if fname:
                yield sse({"type": "source", "filename": fname, "course": src.get("course", "")})

        db.add(ChatMessage(
            session_id=session.id,
            role="assistant",
            content=full,
            intent=intent,
            rag_chunks_used={"sources": sources} if sources else None,
        ))
        await db.commit()
        yield sse({"type": "done"})

    except Exception as exc:
        err = str(exc).lower()
        if "auth" in err or "api key" in err or "invalid" in err:
            yield sse({"type": "error", "content": "API key inválida. Verifica tu clave en Ajustes."})
        else:
            logger.error("chat.stream.error", provider=provider, error=str(exc))
            yield sse({"type": "error", "content": "Error generando respuesta. Inténtalo de nuevo."})
