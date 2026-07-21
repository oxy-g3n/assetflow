"""add_workflow_viewers

Revision ID: 5e31f3a2c7b4
Revises: 9f2f6f8c1a21
Create Date: 2026-03-13 23:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "5e31f3a2c7b4"
down_revision: Union[str, Sequence[str], None] = "9f2f6f8c1a21"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("workflows", sa.Column("shared_viewer_ids", sa.JSON(), nullable=True))
    op.add_column("workflows", sa.Column("shared_viewer_names", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("workflows", "shared_viewer_names")
    op.drop_column("workflows", "shared_viewer_ids")
