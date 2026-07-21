"""add_response_meta_to_agent_conversations

Revision ID: d9f1a2b3c4d5
Revises: c4c6c8d9f0a1
Create Date: 2026-03-20 11:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d9f1a2b3c4d5"
down_revision: Union[str, Sequence[str], None] = "c4c6c8d9f0a1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("agent_conversations", sa.Column("response_id", sa.Text(), nullable=True))
    op.add_column("agent_conversations", sa.Column("response_meta", sa.JSON(), nullable=True))
    op.add_column("agent_conversations", sa.Column("usage", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("agent_conversations", "usage")
    op.drop_column("agent_conversations", "response_meta")
    op.drop_column("agent_conversations", "response_id")
