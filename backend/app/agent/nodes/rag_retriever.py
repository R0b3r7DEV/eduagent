"""RAG retriever node."""
import structlog
from app.agent.state import AgentState

logger = structlog.get_logger()


async def rag_retriever_node(state: AgentState) -> dict:
    """Fetch relevant document chunks for the current query."""
    if state.get("intent") not in ("tutor", "homework_help", "summarize"):
        return {"retrieved_context": []}
    messages = state.get("messages", [])
    query = messages[-1].content if messages else ""
    try:
        from app.rag.retriever import retrieve_context
        chunks = await retrieve_context(query, state["user_id"])
        logger.info("rag.retrieved", chunks=len(chunks))
        return {"retrieved_context": chunks}
    except Exception as e:
        logger.warning("rag.retriever.error", error=str(e))
        return {"retrieved_context": []}
