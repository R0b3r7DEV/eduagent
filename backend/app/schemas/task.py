"""Pydantic schemas for task request/response."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class TaskRead(BaseModel):
    id: str
    title: str
    description: str | None
    course_name: str | None
    subject: str | None
    due_date: datetime | None
    status: Literal["pending", "in_progress", "done"]
    priority: int | None

    model_config = {"from_attributes": True}


class TaskUpdate(BaseModel):
    status: Literal["pending", "in_progress", "done"] | None = None
    priority: int | None = None
