"""AgentState — single source of truth for the LangGraph agent graph."""

from typing import Annotated, Literal, TypedDict

from langgraph.graph.message import add_messages


class AgentState(TypedDict):
    messages: Annotated[list, add_messages]
    user_id: str
    student_level: Literal["child", "teen", "adult"]
    student_age: int
    intent: str
    retrieved_context: list[dict]
    lms_tasks: list[dict]
    session_id: str
    language: str  # "es" by default
    api_key: str   # resolved Anthropic API key for this request
