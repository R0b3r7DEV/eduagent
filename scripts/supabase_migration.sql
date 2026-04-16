-- ============================================================
-- EduAgent AI — Migración completa contra Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ── 1. Extensión pgvector ─────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;

-- ── 2. Tabla alembic_version (para que Alembic sepa el estado) ─
CREATE TABLE IF NOT EXISTS alembic_version (
    version_num VARCHAR(32) NOT NULL,
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);

-- ── 3. users ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    supabase_uid                VARCHAR     UNIQUE,
    email                       VARCHAR     NOT NULL UNIQUE,
    name                        VARCHAR,
    age                         INTEGER,
    student_level               VARCHAR(10),
    parental_consent_at         TIMESTAMPTZ,
    anthropic_api_key_encrypted VARCHAR,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_users_supabase_uid ON users (supabase_uid);

-- ── 4. lms_connections ────────────────────────────────────
CREATE TABLE IF NOT EXISTS lms_connections (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID        NOT NULL REFERENCES users(id),
    provider       VARCHAR(50) NOT NULL,
    credentials    JSONB,
    config         JSONB,
    last_synced_at TIMESTAMPTZ,
    is_active      BOOLEAN     NOT NULL DEFAULT true
);

-- ── 5. documents ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id),
    filename    VARCHAR,
    file_type   VARCHAR(20),
    size_bytes  INTEGER,
    course_name VARCHAR,
    subject     VARCHAR,
    ingested_at TIMESTAMPTZ,
    chunk_count INTEGER,
    status      VARCHAR(20) NOT NULL DEFAULT 'pending'
);

-- ── 6. document_chunks (con columna vector(1024)) ─────────
CREATE TABLE IF NOT EXISTS document_chunks (
    id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID    NOT NULL REFERENCES documents(id),
    content     TEXT    NOT NULL,
    chunk_index INTEGER NOT NULL,
    embedding   vector(1024),
    metadata    JSONB
);

-- ── 7. tasks ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID        NOT NULL REFERENCES users(id),
    lms_connection_id UUID        REFERENCES lms_connections(id),
    external_id       VARCHAR,
    title             VARCHAR     NOT NULL,
    description       TEXT,
    course_name       VARCHAR,
    subject           VARCHAR,
    due_date          TIMESTAMPTZ,
    status            VARCHAR(20) NOT NULL DEFAULT 'pending',
    priority          INTEGER,
    lms_url           VARCHAR,
    synced_at         TIMESTAMPTZ
);

-- ── 8. chat_sessions ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_sessions (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users(id),
    title      VARCHAR,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 9. chat_messages ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID        NOT NULL REFERENCES chat_sessions(id),
    role            VARCHAR(20) NOT NULL,
    content         TEXT        NOT NULL,
    intent          VARCHAR(50),
    rag_chunks_used JSONB,
    tokens_used     INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 10. Marcar migraciones como aplicadas ─────────────────
INSERT INTO alembic_version (version_num) VALUES ('0003')
ON CONFLICT DO NOTHING;

-- ── 11. Verificación ──────────────────────────────────────
SELECT
    t.table_name,
    COUNT(c.column_name) AS columnas
FROM information_schema.tables t
JOIN information_schema.columns c
    ON c.table_name = t.table_name AND c.table_schema = 'public'
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
GROUP BY t.table_name
ORDER BY t.table_name;
