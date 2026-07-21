"""add_response_timestamps_to_agent_conversations

Revision ID: e1f2a3b4c5d6
Revises: d9f1a2b3c4d5
Create Date: 2026-03-20 12:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e1f2a3b4c5d6"
down_revision: Union[str, Sequence[str], None] = "d9f1a2b3c4d5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("agent_conversations", sa.Column("response_created_at", sa.DateTime(), nullable=True))
    op.add_column("agent_conversations", sa.Column("response_completed_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("agent_conversations", "response_completed_at")
    op.drop_column("agent_conversations", "response_created_at")
