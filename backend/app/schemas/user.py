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
    anthropic_api_key_encrypted: str | None = Field(exclude=True, default=None)
    gemini_api_key_encrypted: str | None = Field(exclude=True, default=None)

    @computed_field  # type: ignore[misc]
    @property
    def has_anthropic_key(self) -> bool:
        return self.anthropic_api_key_encrypted is not None

    @computed_field  # type: ignore[misc]
    @property
    def has_gemini_key(self) -> bool:
        return self.gemini_api_key_encrypted is not None

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    name: str | None = None
    age: int | None = Field(default=None, ge=5, le=120)


# ── API key schemas ────────────────────────────────────────────────────────────

class ApiKeySet(BaseModel):
    """POST /user/api-key — set a key for a specific provider."""

    provider: Literal["anthropic", "gemini"] = "anthropic"
    api_key: str = Field(..., min_length=10, max_length=200)


class ApiKeyDelete(BaseModel):
    """DELETE /user/api-key — remove key for a specific provider."""

    provider: Literal["anthropic", "gemini"] = "anthropic"


class ProviderKeyStatus(BaseModel):
    has_key: bool


class ApiKeyStatus(BaseModel):
    """GET /user/api-key/status — never exposes the key itself."""

    anthropic: ProviderKeyStatus
    gemini: ProviderKeyStatus
    active_provider: Literal["anthropic", "gemini"]


class ApiKeyVerifyResult(BaseModel):
    """GET /user/api-key/verify — result of a live test call."""

    provider: Literal["anthropic", "gemini"]
    valid: bool
    error: str | None = None
