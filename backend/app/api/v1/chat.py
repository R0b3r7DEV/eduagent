"""Chat endpoint — SSE streaming via LangGraph agent."""

import json
from typing import AsyncGenerator

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.dependencies import get_current_user, resolve_anthropic_key
from app.schemas.chat import ChatRequest

router = APIRouter()

_SSE_HEADERS = {"X-Accel-Buffering": "no", "Cache-Control": "no-cache"}

_NO_KEY_MESSAGE = (
    "Para poder ayudarte necesito que añadas tu API key de Anthropic. "
    "Es gratuita para empezar en console.anthropic.com → API Keys. "
    "Una vez la tengas, añádela en Configuración → Mi API Key."
)


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"


async def _no_key_stream() -> AsyncGenerator[str, None]:
    yield _sse({"type": "no_api_key", "content": _NO_KEY_MESSAGE})
    yield _sse({"type": "done"})


async def _chat_stream(api_key: str, request: ChatRequest) -> AsyncGenerator[str, None]:
    # TODO: route through LangGraph agent graph.
    # Placeholder — calls Anthropic directly so the SSE pipeline is exercised end-to-end.
    import anthropic

    client = anthropic.AsyncAnthropic(api_key=api_key)
    async with client.messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        messages=[{"role": "user", "content": request.message}],
    ) as stream:
        async for text in stream.text_stream:
            yield _sse({"type": "text", "content": text})
    yield _sse({"type": "done"})


@router.post("/stream")
async def stream_chat(
    request: ChatRequest,
    current_user=Depends(get_current_user),
) -> StreamingResponse:
    """
    Stream a chat response via SSE.

    If the user has no Anthropic API key (and the server key is unavailable
    in the current environment), stream a guidance message instead of calling
    the LLM — no HTTP error is raised so the frontend SSE handler stays intact.
    """
    api_key = resolve_anthropic_key(current_user)

    generator = _chat_stream(api_key, request) if api_key else _no_key_stream()

    return StreamingResponse(generator, media_type="text/event-stream", headers=_SSE_HEADERS)


@router.get("/sessions")
async def list_sessions():
    # TODO: list user chat sessions
    return []


@router.get("/sessions/{session_id}")
async def get_session(session_id: str):
    # TODO: return session messages
    return {"session_id": session_id, "messages": []}


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    # TODO: delete session from Redis + DB
    return {"deleted": session_id}
