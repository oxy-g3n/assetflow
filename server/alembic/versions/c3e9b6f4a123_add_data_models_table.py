"""add_data_models_table

Revision ID: c3e9b6f4a123
Revises: 9f2f6f8c1a21
Create Date: 2026-03-15 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c3e9b6f4a123"
down_revision: Union[str, Sequence[str], None] = "9f2f6f8c1a21"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "data_models",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="draft"),
        sa.Column("methodology", sa.String(), nullable=True),
        sa.Column("region_id", sa.Integer(), nullable=False),
        sa.Column("workflow_id", sa.Integer(), nullable=True),
        sa.Column("created_by", sa.Integer(), nullable=False),
        sa.Column("conceptual_payload", sa.JSON(), nullable=False),
        sa.Column("logical_payload", sa.JSON(), nullable=False),
        sa.Column("physical_payload", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.ForeignKeyConstraint(["region_id"], ["regions.id"]),
        sa.ForeignKeyConstraint(["workflow_id"], ["workflows.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_data_models_id"), "data_models", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_data_models_id"), table_name="data_models")
    op.drop_table("data_models")
