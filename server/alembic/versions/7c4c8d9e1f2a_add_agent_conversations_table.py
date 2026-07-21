"""add_agent_conversations_table

Revision ID: 7c4c8d9e1f2a
Revises: 29bbeee2f22c
Create Date: 2026-03-19 23:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "7c4c8d9e1f2a"
down_revision: Union[str, Sequence[str], None] = "29bbeee2f22c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "agent_conversations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("agent_id", sa.Integer(), nullable=False),
        sa.Column("user_input", sa.Text(), nullable=False),
        sa.Column("output", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["agent_id"], ["agents.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_agent_conversations_id"), "agent_conversations", ["id"], unique=False)
    op.create_index(op.f("ix_agent_conversations_agent_id"), "agent_conversations", ["agent_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_agent_conversations_agent_id"), table_name="agent_conversations")
    op.drop_index(op.f("ix_agent_conversations_id"), table_name="agent_conversations")
    op.drop_table("agent_conversations")
