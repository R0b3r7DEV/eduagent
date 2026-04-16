"""add anthropic_api_key_encrypted to users

Revision ID: 0001
Revises: 0000
Create Date: 2026-04-16

NOTE: This migration is a no-op. The column was already created in 0000_create_all_tables.
"""

from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = "0000"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Column anthropic_api_key_encrypted already created as VARCHAR in migration 0000.
    pass


def downgrade() -> None:
    pass
