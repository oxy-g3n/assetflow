import asyncio
from app.db.session import AsyncSessionLocal
from app.models.workflow import Workflow
from app.models.stage import Stage
from app.models.substage import Substage
from app.models.template import Template
from app.models.library import Library
from app.models.field_mapping import FieldMapping
from app.models.workflow_assignment import WorkflowAssignment
from app.models.user import User
from sqlalchemy import select

async def verify_persistence():
    async with AsyncSessionLocal() as db:
        # 1. Get the latest workflow
        result = await db.execute(select(Workflow).order_by(Workflow.created_at.desc()).limit(1))
        wf = result.scalar_one_or_none()
        
        if not wf:
            print("No workflows found.")
            return

        print(f"Checking Workflow: {wf.name} (ID: {wf.id})")
        print(f"Assignee Names (Column): {wf.assignee_names}")
        
        if wf.assignee_names:
            print("SUCCESS: Assignee names are persisted in the column.")
        else:
            print("FAILURE: Assignee names column is empty.")

if __name__ == "__main__":
    asyncio.run(verify_persistence())
