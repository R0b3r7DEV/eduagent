"""add gemini_api_key_encrypted and llm_provider to users

Revision ID: 0004
Revises: 0003
Create Date: 2026-04-17
"""

import sqlalchemy as sa
from alembic import op

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "llm_provider",
            sa.String(20),
            nullable=False,
            server_default="anthropic",
        ),
    )
    op.add_column(
        "users",
        sa.Column("gemini_api_key_encrypted", sa.String(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "gemini_api_key_encrypted")
    op.drop_column("users", "llm_provider")
