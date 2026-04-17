# ── Stage 1: builder ──────────────────────────────────────────────────────────
# Full build environment — compiles C extensions, installs all prod deps.
# This stage is discarded; only site-packages are carried forward.
FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Build-time system libs (compile asyncpg, hiredis, cryptography, grpcio…)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

RUN pip install uv

# Copy dependency manifest + lock file for reproducible resolution
COPY pyproject.toml uv.lock ./

# Export exact locked versions for production only (no [dev], no [video]).
# uv export reads uv.lock and writes a pinned requirements.txt.
# uv pip install then installs those exact versions — fully reproducible.
# --no-dev excludes [dev] optional group.
# Optional extras ([video]) are not included unless --extra is passed — excluded by default.
RUN uv export --frozen --no-dev \
        --format requirements-txt --output-file /tmp/requirements.txt && \
    uv pip install --system --no-cache -r /tmp/requirements.txt

# ── Stage 2: runner ───────────────────────────────────────────────────────────
# Minimal runtime image — no compiler, no build headers, no test tools.
FROM python:3.12-slim AS runner

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Copy only the installed packages and their entry-point binaries
COPY --from=builder /usr/local/lib/python3.12/site-packages \
                    /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin \
                    /usr/local/bin

# Copy application source (no tests, no .env, no __pycache__ — see .dockerignore)
COPY app/      ./app/
COPY alembic/  ./alembic/
COPY alembic.ini .

# Railway injects $PORT at runtime; falls back to 8000 locally.
# Shell form is required so ${PORT:-8000} is expanded by sh.
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 2
