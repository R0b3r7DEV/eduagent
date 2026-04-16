"""alter anthropic_api_key_encrypted from BYTEA to VARCHAR

Revision ID: 0002
Revises: 0001
Create Date: 2026-04-16

NOTE: This migration is a no-op. The column was created as VARCHAR in migration 0000.
"""

from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Column was already created as VARCHAR (String) in migration 0000.
    pass


def downgrade() -> None:
    pass
