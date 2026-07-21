"""
One-time backfill: sets created_by_name on workflows where it is NULL.
  - If createdBy is set, fetches the user's name and writes it.
  - If both createdBy and created_by_name are NULL, assigns the first admin user found.
Run from /server: python backfill_creator_name.py
"""
import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal

# Import ALL models so SQLAlchemy can resolve all relationships
import app.models.workflow  # noqa
import app.models.stage  # noqa
import app.models.substage  # noqa
import app.models.user  # noqa
import app.models.data_model  # noqa
import app.models.workflow_assignment  # noqa
import app.models.template  # noqa
import app.models.library  # noqa
import app.models.field_mapping  # noqa
import app.models.region  # noqa

from app.models.workflow import Workflow
from app.models.user import User


async def backfill():
    async with AsyncSessionLocal() as db:
        # Find the first admin user as a fallback
        admin_result = await db.execute(
            select(User).filter(User.role.in_(["admin", "superadmin"])).limit(1)
        )
        admin = admin_result.scalar_one_or_none()
        if not admin:
            print("No admin user found — exiting.")
            return

        print(f"Fallback admin: {admin.name} (id={admin.id})")

        # Load all workflows with null created_by_name
        result = await db.execute(
            select(Workflow).filter(Workflow.created_by_name == None)
        )
        workflows = result.scalars().all()
        print(f"Found {len(workflows)} workflows with null created_by_name")

        for wf in workflows:
            if wf.createdBy:
                # Fetch the creator name
                user_result = await db.execute(
                    select(User).filter(User.id == wf.createdBy)
                )
                user = user_result.scalar_one_or_none()
                if user:
                    wf.created_by_name = user.name
                    print(f"  Workflow {wf.id}: set created_by_name = '{user.name}'")
                else:
                    wf.createdBy = admin.id
                    wf.created_by_name = admin.name
                    print(f"  Workflow {wf.id}: user not found, assigned admin '{admin.name}'")
            else:
                # No creator at all — assign admin
                wf.createdBy = admin.id
                wf.created_by_name = admin.name
                print(f"  Workflow {wf.id}: no creator, assigned admin '{admin.name}'")

        await db.commit()
        print("Backfill complete!")


if __name__ == "__main__":
    asyncio.run(backfill())
