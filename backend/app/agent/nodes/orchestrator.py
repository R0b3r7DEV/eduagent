"""Orchestrator node — detects user intent."""
import anthropic
import structlog
from app.agent.state import AgentState
from app.agent.prompts.orchestrator import SYSTEM_PROMPT

logger = structlog.get_logger()
VALID = {"tutor", "homework_help", "summarize", "tasks", "general"}


async def orchestrator_node(state: AgentState) -> dict:
    messages = state.get("messages", [])
    last = messages[-1].content if messages else ""
    history = "\n".join(f"{m.type}: {m.content[:80]}" for m in messages[-5:])

    client = anthropic.AsyncAnthropic(api_key=state["api_key"])
    try:
        resp = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=10,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": f"Historial:\n{history}\n\nMensaje: {last}"}],
        )
        intent = resp.content[0].text.strip().lower().split()[0]
    except Exception:
        intent = "tutor"

    intent = intent if intent in VALID else "tutor"
    logger.info("orchestrator.intent", intent=intent)
    return {"intent": intent}
