"""Pydantic schemas for user request/response."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, computed_field


class UserRead(BaseModel):
    id: str
    email: str
    name: str | None
    age: int | None
    student_level: Literal["child", "teen", "adult"] | None
    created_at: datetime
    # Derived: True when the encrypted key column is set. Never return the key itself.
    anthropic_api_key_encrypted: str | None = Field(exclude=True, default=None)

    @computed_field  # type: ignore[misc]
    @property
    def has_anthropic_key(self) -> bool:
        return self.anthropic_api_key_encrypted is not None

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    """Mutable profile fields the user can change after signup."""

    name: str | None = None
    age: int | None = Field(default=None, ge=5, le=120)


class ApiKeySet(BaseModel):
    """Request body for saving a user's Anthropic API key."""

    api_key: str = Field(..., min_length=20, max_length=200)


class ApiKeyStatus(BaseModel):
    """Response for GET /user/api-key/status — never exposes the key itself."""

    has_key: bool
