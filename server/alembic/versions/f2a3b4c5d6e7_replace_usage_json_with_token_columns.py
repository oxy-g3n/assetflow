"""replace_usage_json_with_token_columns

Revision ID: f2a3b4c5d6e7
Revises: e1f2a3b4c5d6
Create Date: 2026-03-20 12:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f2a3b4c5d6e7"
down_revision: Union[str, Sequence[str], None] = "e1f2a3b4c5d6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("agent_conversations", sa.Column("input_tokens", sa.Integer(), nullable=True))
    op.add_column("agent_conversations", sa.Column("cached_tokens", sa.Integer(), nullable=True))
    op.add_column("agent_conversations", sa.Column("output_tokens", sa.Integer(), nullable=True))
    op.add_column("agent_conversations", sa.Column("reasoning_tokens", sa.Integer(), nullable=True))
    op.add_column("agent_conversations", sa.Column("total_tokens", sa.Integer(), nullable=True))

    op.drop_column("agent_conversations", "usage")
    op.drop_column("agent_conversations", "relevance_flag")
    op.drop_column("agent_conversations", "summary")
    op.drop_column("agent_conversations", "archive_output")
    op.drop_column("agent_conversations", "model_payload")


def downgrade() -> None:
    op.add_column("agent_conversations", sa.Column("model_payload", sa.JSON(), nullable=True))
    op.add_column("agent_conversations", sa.Column("archive_output", sa.JSON(), nullable=True))
    op.add_column("agent_conversations", sa.Column("summary", sa.Text(), nullable=True))
    op.add_column("agent_conversations", sa.Column("relevance_flag", sa.Integer(), nullable=True))
    op.add_column("agent_conversations", sa.Column("usage", sa.JSON(), nullable=True))

    op.drop_column("agent_conversations", "total_tokens")
    op.drop_column("agent_conversations", "reasoning_tokens")
    op.drop_column("agent_conversations", "output_tokens")
    op.drop_column("agent_conversations", "cached_tokens")
    op.drop_column("agent_conversations", "input_tokens")
