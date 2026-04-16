"""Tutor node stub (streaming handled in chat_service)."""
from app.agent.state import AgentState


async def tutor_node(state: AgentState) -> dict:
    # Streaming is handled directly in chat_service.py for token-level SSE.
    return state
