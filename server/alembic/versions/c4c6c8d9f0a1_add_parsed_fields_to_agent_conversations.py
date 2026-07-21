"""add_parsed_fields_to_agent_conversations

Revision ID: c4c6c8d9f0a1
Revises: 7c4c8d9e1f2a
Create Date: 2026-03-20 11:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c4c6c8d9f0a1"
down_revision: Union[str, Sequence[str], None] = "7c4c8d9e1f2a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("agent_conversations", sa.Column("model_payload", sa.JSON(), nullable=True))
    op.add_column("agent_conversations", sa.Column("archive_output", sa.JSON(), nullable=True))
    op.add_column("agent_conversations", sa.Column("summary", sa.Text(), nullable=True))
    op.add_column("agent_conversations", sa.Column("relevance_flag", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("agent_conversations", "relevance_flag")
    op.drop_column("agent_conversations", "summary")
    op.drop_column("agent_conversations", "archive_output")
    op.drop_column("agent_conversations", "model_payload")
