"""alter anthropic_api_key_encrypted from BYTEA to VARCHAR

Revision ID: 0002
Revises: 0001
Create Date: 2026-04-16
"""

from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Cast existing BYTEA values to TEXT (encode as escape string).
    # On a fresh DB with no rows this is a no-op; on existing data the
    # Fernet tokens stored as bytes will be re-encoded as their text form.
    op.alter_column(
        "users",
        "anthropic_api_key_encrypted",
        existing_type=sa.LargeBinary(),
        type_=sa.String(),
        postgresql_using="encode(anthropic_api_key_encrypted, 'escape')",
        nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "users",
        "anthropic_api_key_encrypted",
        existing_type=sa.String(),
        type_=sa.LargeBinary(),
        postgresql_using="anthropic_api_key_encrypted::bytea",
        nullable=True,
    )
