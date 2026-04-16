"""add anthropic_api_key_encrypted to users

Revision ID: 0001
Revises:
Create Date: 2026-04-16
"""

from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enable pgvector extension (idempotent)
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.add_column(
        "users",
        sa.Column("anthropic_api_key_encrypted", sa.LargeBinary(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "anthropic_api_key_encrypted")
