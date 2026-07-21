"""add_methodology_to_stages

Revision ID: 9f2f6f8c1a21
Revises: 1bc05a0fa234
Create Date: 2026-03-13 22:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9f2f6f8c1a21"
down_revision: Union[str, Sequence[str], None] = "1bc05a0fa234"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("stages", sa.Column("methodology", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("stages", "methodology")
