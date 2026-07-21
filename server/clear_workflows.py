import asyncio
from sqlalchemy import delete, select

from app.db.session import AsyncSessionLocal
from app.models.stage import Stage
from app.models.substage import Substage
from app.models.template import Template
from app.models.library import Library
from app.models.field_mapping import FieldMapping
from app.models.workflow_assignment import WorkflowAssignment
from app.models.workflow import Workflow


async def clear_workflows():
    async with AsyncSessionLocal() as db:
        existing = await db.execute(select(Workflow.id))
        workflow_ids = existing.scalars().all()

        if not workflow_ids:
            print("No workflows found.")
            return

        await db.execute(delete(WorkflowAssignment))
        await db.execute(delete(FieldMapping))
        await db.execute(delete(Template))
        await db.execute(delete(Library))
        await db.execute(delete(Substage))
        await db.execute(delete(Stage))
        await db.execute(delete(Workflow))
        await db.commit()
        print(f"Deleted {len(workflow_ids)} workflows.")


if __name__ == "__main__":
    asyncio.run(clear_workflows())
