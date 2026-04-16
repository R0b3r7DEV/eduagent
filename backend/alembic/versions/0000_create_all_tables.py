"""create all tables

Revision ID: 0000
Revises:
Create Date: 2026-04-16
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0000"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── pgvector extension ─────────────────────────────────────────────────────
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # ── users ──────────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("supabase_uid", sa.String(), nullable=True, unique=True),
        sa.Column("email", sa.String(), nullable=False, unique=True),
        sa.Column("name", sa.String(), nullable=True),
        sa.Column("age", sa.Integer(), nullable=True),
        sa.Column("student_level", sa.String(10), nullable=True),
        sa.Column("parental_consent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("anthropic_api_key_encrypted", sa.String(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("ix_users_supabase_uid", "users", ["supabase_uid"], unique=True)

    # ── lms_connections ────────────────────────────────────────────────────────
    op.create_table(
        "lms_connections",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("provider", sa.String(50), nullable=False),
        sa.Column("credentials", postgresql.JSONB(), nullable=True),
        sa.Column("config", postgresql.JSONB(), nullable=True),
        sa.Column("last_synced_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )

    # ── documents ─────────────────────────────────────────────────────────────
    op.create_table(
        "documents",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("filename", sa.String(), nullable=True),
        sa.Column("file_type", sa.String(20), nullable=True),
        sa.Column("size_bytes", sa.Integer(), nullable=True),
        sa.Column("course_name", sa.String(), nullable=True),
        sa.Column("subject", sa.String(), nullable=True),
        sa.Column("ingested_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("chunk_count", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default=sa.text("'pending'")),
    )

    # ── document_chunks ────────────────────────────────────────────────────────
    op.create_table(
        "document_chunks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("document_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("documents.id"), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("chunk_index", sa.Integer(), nullable=False),
        sa.Column("embedding", sa.String(), nullable=True),  # stored via pgvector raw SQL
        sa.Column("metadata", postgresql.JSONB(), nullable=True),
    )
    # Add vector column separately (pgvector type not natively in SA)
    op.execute("ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS embedding vector(1024)")
    op.execute("ALTER TABLE document_chunks DROP COLUMN IF EXISTS embedding")
    op.execute("ALTER TABLE document_chunks ADD COLUMN embedding vector(1024)")

    # ── tasks ──────────────────────────────────────────────────────────────────
    op.create_table(
        "tasks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("lms_connection_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("lms_connections.id"), nullable=True),
        sa.Column("external_id", sa.String(), nullable=True),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("course_name", sa.String(), nullable=True),
        sa.Column("subject", sa.String(), nullable=True),
        sa.Column("due_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default=sa.text("'pending'")),
        sa.Column("priority", sa.Integer(), nullable=True),
        sa.Column("lms_url", sa.String(), nullable=True),
        sa.Column("synced_at", sa.DateTime(timezone=True), nullable=True),
    )

    # ── chat_sessions ──────────────────────────────────────────────────────────
    op.create_table(
        "chat_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title", sa.String(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )

    # ── chat_messages ──────────────────────────────────────────────────────────
    op.create_table(
        "chat_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("chat_sessions.id"), nullable=False),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("intent", sa.String(50), nullable=True),
        sa.Column("rag_chunks_used", postgresql.JSONB(), nullable=True),
        sa.Column("tokens_used", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_table("chat_messages")
    op.drop_table("chat_sessions")
    op.drop_table("tasks")
    op.drop_table("document_chunks")
    op.drop_table("documents")
    op.drop_table("lms_connections")
    op.drop_index("ix_users_supabase_uid", table_name="users")
    op.drop_table("users")
