FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install uv
RUN pip install uv

COPY pyproject.toml .
RUN uv pip install --system --no-cache ".[dev]"

COPY . .

# ── Production stage ──────────────────────────────────────────────────────────
# Uses shell form so $PORT (injected by Railway) is expanded at runtime.
# Falls back to 8000 when running locally without Railway.
FROM base AS production
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 2

# ── Development stage (hot-reload) ────────────────────────────────────────────
FROM base AS development
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --reload
