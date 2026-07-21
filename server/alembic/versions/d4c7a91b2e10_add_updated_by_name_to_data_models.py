"""add updated_by_name to data_models

Revision ID: d4c7a91b2e10
Revises: c3e9b6f4a123
Create Date: 2026-03-15 18:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "d4c7a91b2e10"
down_revision = "c3e9b6f4a123"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("data_models", sa.Column("updated_by_name", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("data_models", "updated_by_name")
