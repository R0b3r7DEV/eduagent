"""Pydantic schemas for document request/response."""

from datetime import datetime

from pydantic import BaseModel


class DocumentRead(BaseModel):
    id: str
    filename: str | None
    file_type: str | None
    size_bytes: int | None
    course_name: str | None
    subject: str | None
    status: str
    chunk_count: int | None
    ingested_at: datetime | None

    model_config = {"from_attributes": True}
