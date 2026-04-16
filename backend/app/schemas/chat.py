"""Pydantic schemas for chat request/response."""

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    session_id: str
    message: str = Field(..., min_length=1, max_length=4096)
    language: str = "es"


class ChatMessageSchema(BaseModel):
    role: str
    content: str


class ChatSessionSchema(BaseModel):
    session_id: str
    title: str | None = None
    messages: list[ChatMessageSchema] = []
