"""User ORM model."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Index, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # UUID issued by Supabase Auth (auth.users.id) — used to link JWT → our row
    supabase_uid: Mapped[str | None] = mapped_column(String, unique=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    name: Mapped[str | None] = mapped_column(String)
    age: Mapped[int | None] = mapped_column(Integer)
    student_level: Mapped[str | None] = mapped_column(String(10))  # child|teen|adult
    parental_consent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # Fernet-encrypted Anthropic API key (stored as base64 VARCHAR, nullable = not set)
    anthropic_api_key_encrypted: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
