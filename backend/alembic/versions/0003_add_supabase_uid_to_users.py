"""add supabase_uid to users

Revision ID: 0003
Revises: 0002
Create Date: 2026-04-16

NOTE: This migration is a no-op. The column and index were already created in migration 0000.
"""

from alembic import op
import sqlalchemy as sa

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Column supabase_uid and its unique index already created in migration 0000.
    pass


def downgrade() -> None:
    pass
