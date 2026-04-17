"""Application settings loaded from environment variables via pydantic-settings."""

import json
from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # LLM — server-level fallbacks; users supply their own keys in production
    anthropic_api_key: str = ""
    gemini_api_key: str = ""
    default_llm_provider: str = "anthropic"
    cohere_api_key: str = ""

    # Encryption key for user secrets (Fernet, 32 url-safe base64 bytes)
    # Generate: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
    fernet_secret_key: str

    # ── Supabase ────────────────────────────────────────────────────────────────
    # Connection string — use the *Session pooler* URL from Supabase Dashboard:
    # Settings > Database > Connection string > URI (mode=session, port 5432)
    database_url: str

    # Supabase project URL and keys (Settings > API)
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    # JWT secret for token verification (Settings > API > JWT Settings > JWT Secret)
    supabase_jwt_secret: str

    # Supabase Storage bucket for uploaded documents
    supabase_storage_bucket: str = "documents"

    # ── Redis / Upstash ─────────────────────────────────────────────────────────
    # Local:   redis://localhost:6379/0
    # Upstash: rediss://default:<password>@<host>:<port>
    redis_url: str

    # ── Google OAuth (for Google Classroom connector) ───────────────────────────
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:3000/auth/callback"

    # ── Moodle connector ────────────────────────────────────────────────────────
    moodle_base_url: str = ""
    moodle_wstoken: str = ""

    # ── LlamaCloud ──────────────────────────────────────────────────────────────
    llama_cloud_api_key: str = ""

    # ── App ─────────────────────────────────────────────────────────────────────
    environment: Literal["development", "production"] = "development"
    backend_cors_origins: list[str] = ["http://localhost:3000"]
    # Regex for wildcard CORS — covers all *.vercel.app preview/production URLs.
    # Override via env var CORS_ORIGIN_REGEX for custom domains.
    cors_origin_regex: str = r"https://.*\.vercel\.app"
    max_upload_size_mb: int = 50
    chunk_size: int = 512
    chunk_overlap: int = 64
    top_k_retrieval: int = 8

    @field_validator("backend_cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str | list) -> list[str]:
        if isinstance(v, str):
            return json.loads(v)
        return v


settings = Settings()
