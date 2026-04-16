"""add supabase_uid to users

Revision ID: 0003
Revises: 0002
Create Date: 2026-04-16
"""

from alembic import op
import sqlalchemy as sa

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("supabase_uid", sa.String(), nullable=True),
    )
    op.create_index("ix_users_supabase_uid", "users", ["supabase_uid"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_users_supabase_uid", table_name="users")
    op.drop_column("users", "supabase_uid")
