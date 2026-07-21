from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.api.deps import get_db, get_current_user
from app.models.workflow import Workflow
from app.models.stage import Stage
from app.models.substage import Substage
from app.models.template import Template
from app.models.library import Library
from app.models.field_mapping import FieldMapping
from app.models.workflow_assignment import WorkflowAssignment
from app.models.user import User
from app.models.data_model import DataModel
from app import schemas

router = APIRouter(
    prefix="/workflows",
    tags=["workflows"],
    dependencies=[Depends(get_current_user)]
)


def can_access_workflow(current_user: User, workflow: Workflow) -> bool:
    """Viewers, admins, creators, and anyone with any stage assignment can access."""
    shared_viewer_ids = workflow.shared_viewer_ids or []
    if current_user.role in {"admin", "superadmin"}:
        return True
    if workflow.createdBy == current_user.id:
        return True
    if current_user.id in shared_viewer_ids:
        return True
    # developer / reviewer assigned to any stage
    for stage in workflow.stages:
        for assignment in stage.assignments:
            if assignment.user_id == current_user.id:
                return True
    return False


def can_manage_workflow(current_user: User, workflow: Workflow) -> bool:
    """Only admins and the workflow creator can update workflow config/metadata."""
    return (
        current_user.role in {"admin", "superadmin"}
        or workflow.createdBy == current_user.id
    )


def can_edit_stage(current_user: User, workflow: Workflow, stage) -> bool:
    """Admin/creator can edit any stage. Developer (assignee) can edit their assigned stage."""
    if can_manage_workflow(current_user, workflow):
        return True
    for assignment in stage.assignments:
        if assignment.user_id == current_user.id and assignment.role == "assignee":
            return True
    return False


def can_review_stage(current_user: User, workflow: Workflow, stage) -> bool:
    """Admin/creator or reviewer-assigned user can review/approve a stage."""
    if can_manage_workflow(current_user, workflow):
        return True
    for assignment in stage.assignments:
        if assignment.user_id == current_user.id and assignment.role == "reviewer":
            return True
    return False

@router.post("/", response_model=schemas.WorkflowResponse, status_code=status.HTTP_201_CREATED)
async def create_workflow(
    workflow_in: schemas.WorkflowCreate, 
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Extract nested stages
    stages_data = workflow_in.stages or []
    workflow_data = workflow_in.model_dump(exclude={"stages"})
    
    # Set creator if not provided
    if not workflow_data.get("createdBy"):
        workflow_data["createdBy"] = current_user.id
    workflow_data["created_by_name"] = workflow_data.get("created_by_name") or current_user.name
        
    db_workflow = Workflow(**workflow_data)
    db_workflow.assignee_names = []
    db.add(db_workflow)
    await db.flush()  # Get the workflow ID
    
    all_assigned_ids = set()
    for stage_in in stages_data:
        # Extract nested substages
        substages_data = stage_in.substages or []
        assignments_data = stage_in.assignments or []
        all_assigned_ids.update(assignments_data)
        stage_data = stage_in.model_dump(exclude={"substages", "assignments", "reviewers", "agent_assignments", "workflow_id"})
        
        db_stage = Stage(**stage_data, workflow_id=db_workflow.id)
        db.add(db_stage)
        await db.flush() # Get the stage ID
        
        for user_id in assignments_data:
            db_assignment = WorkflowAssignment(user_id=user_id, stage_id=db_stage.id, role="assignee")
            db.add(db_assignment)

        # Create reviewer assignments
        reviewers_data = stage_in.reviewers or []
        for user_id in reviewers_data:
            db_assignment = WorkflowAssignment(user_id=user_id, stage_id=db_stage.id, role="reviewer")
            db.add(db_assignment)
        
        # Create agent assignments
        agents_data = stage_in.agent_assignments or []
        for agent_id in agents_data:
            db_assignment = WorkflowAssignment(agent_id=agent_id, stage_id=db_stage.id, role="assignee")
            db.add(db_assignment)
        
        for substage_in in substages_data:
            substage_data = substage_in.model_dump(exclude={"stage_id"})
            db_substage = Substage(**substage_data, stage_id=db_stage.id)
            db.add(db_substage)

    # Persist assignee names to database
    if all_assigned_ids:
        user_result = await db.execute(select(User.name).filter(User.id.in_(list(all_assigned_ids))))
        names = sorted([n for n in user_result.scalars().all() if n])
        db_workflow.assignee_names = names

    if workflow_in.shared_viewer_ids:
        viewer_result = await db.execute(select(User.name).filter(User.id.in_(workflow_in.shared_viewer_ids)))
        db_workflow.shared_viewer_names = sorted([n for n in viewer_result.scalars().all() if n])
    else:
        db_workflow.shared_viewer_names = []

    await db.commit()
    await db.refresh(db_workflow)
    
    # Reload with relationships for response
    result = await db.execute(
        select(Workflow)
        .filter(Workflow.id == db_workflow.id)
        .options(
            selectinload(Workflow.creator),
            selectinload(Workflow.stages).selectinload(Stage.assignments).selectinload(WorkflowAssignment.user),
            selectinload(Workflow.stages).selectinload(Stage.substages)
        )
    )
    db_workflow = result.scalar_one()
    
    # Calculate assignee names
    names = set()
    for stage in db_workflow.stages:
        for assignment in stage.assignments:
            if assignment.user and assignment.user.name:
                names.add(assignment.user.name)
    db_workflow.assignee_names = sorted(list(names))
    
    return db_workflow


@router.get("/", response_model=List[schemas.WorkflowResponse])
async def list_workflows(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    result = await db.execute(
        select(Workflow).options(
            selectinload(Workflow.creator),
            selectinload(Workflow.stages).selectinload(Stage.assignments).selectinload(WorkflowAssignment.user),
            selectinload(Workflow.stages).selectinload(Stage.substages)
        )
    )
    workflows = result.scalars().all()
    workflows = [wf for wf in workflows if can_access_workflow(current_user, wf)]
    
    for wf in workflows:
        wf.shared_viewer_ids = wf.shared_viewer_ids or []
        wf.shared_viewer_names = wf.shared_viewer_names or []
        wf.tags = wf.tags or []
        names = set()
        for stage in wf.stages:
            for assignment in stage.assignments:
                if assignment.user and assignment.user.name:
                    names.add(assignment.user.name)
        wf.assignee_names = sorted(list(names))
        
    return workflows

@router.get("/{workflow_id}", response_model=schemas.WorkflowResponse)
async def get_workflow(
    workflow_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    result = await db.execute(
        select(Workflow)
        .filter(Workflow.id == workflow_id)
        .options(
            selectinload(Workflow.creator),
            selectinload(Workflow.stages).selectinload(Stage.assignments).selectinload(WorkflowAssignment.user),
            selectinload(Workflow.stages).selectinload(Stage.substages)
        )
    )
    db_workflow = result.scalar_one_or_none()
    if not db_workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    if not can_access_workflow(current_user, db_workflow):
        raise HTTPException(status_code=403, detail="Not authorized to access this workflow")

    db_workflow.shared_viewer_ids = db_workflow.shared_viewer_ids or []
    db_workflow.shared_viewer_names = db_workflow.shared_viewer_names or []
    db_workflow.tags = db_workflow.tags or []
        
    names = set()
    for stage in db_workflow.stages:
        for assignment in stage.assignments:
            if assignment.user and assignment.user.name:
                names.add(assignment.user.name)
    db_workflow.assignee_names = sorted(list(names))
    
    return db_workflow

@router.put("/{workflow_id}", response_model=schemas.WorkflowResponse)
async def update_workflow(
    workflow_id: int,
    workflow_in: schemas.WorkflowCreate, 
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Only admins / creators can update workflow metadata/config
    wf_check_result = await db.execute(select(Workflow).filter(Workflow.id == workflow_id))
    wf_check = wf_check_result.scalar_one_or_none()
    if wf_check and not can_manage_workflow(current_user, wf_check):
        raise HTTPException(status_code=403, detail="Only admins or the workflow creator can update workflow configuration.")
    # Fetch existing workflow
    result = await db.execute(select(Workflow).filter(Workflow.id == workflow_id))
    db_workflow = result.scalar_one_or_none()
    if not db_workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Update metadata
    update_data = workflow_in.model_dump(exclude={"stages"})
    for field, value in update_data.items():
        setattr(db_workflow, field, value)
    
    # Simple strategy: Re-create stages and nested components
    # (In a more complex app, we might want to diff and update selectively)
    
    # Delete existing stages (cascading will handle children)
    await db.execute(
        select(Stage)
        .filter(Stage.workflow_id == workflow_id)
    )
    # Actually, SQLAlchemy's cascade delete orphan will handle this if we clear the stages list
    # But since we are using AsyncSession and might not have stages loaded, let's do it explicitly
    
    # Load stages to ensure they are available for deletion if needed, 
    # but explicit delete is safer for nested components
    # However, our models have cascade="all, delete-orphan", so clearing should work.
    
    # For now, let's just clear and re-add for simplicity in this proto
    result = await db.execute(
        select(Stage).filter(Stage.workflow_id == workflow_id)
    )
    existing_stages = result.scalars().all()
    for s in existing_stages:
        await db.delete(s)
    
    await db.flush()

    stages_data = workflow_in.stages or []
    all_assigned_ids = set()
    for stage_in in stages_data:
        substages_data = stage_in.substages or []
        assignments_data = stage_in.assignments or []
        all_assigned_ids.update(assignments_data)
        stage_dict = stage_in.model_dump(exclude={"substages", "assignments", "reviewers", "agent_assignments", "workflow_id"})
        
        db_stage = Stage(**stage_dict, workflow_id=db_workflow.id)
        db.add(db_stage)
        await db.flush()
        
        for user_id in assignments_data:
            db_assignment = WorkflowAssignment(user_id=user_id, stage_id=db_stage.id, role="assignee")
            db.add(db_assignment)
        
        # Create reviewer assignments
        reviewers_data = stage_in.reviewers or []
        for user_id in reviewers_data:
            db_assignment = WorkflowAssignment(user_id=user_id, stage_id=db_stage.id, role="reviewer")
            db.add(db_assignment)
        
        # Create agent assignments
        agents_data = stage_in.agent_assignments or []
        for agent_id in agents_data:
            db_assignment = WorkflowAssignment(agent_id=agent_id, stage_id=db_stage.id, role="assignee")
            db.add(db_assignment)
            
        for substage_in in substages_data:
            substage_dict = substage_in.model_dump(exclude={"stage_id"})
            db_substage = Substage(**substage_dict, stage_id=db_stage.id)
            db.add(db_substage)

    # Re-cache assignee names
    if all_assigned_ids:
        user_result = await db.execute(select(User.name).filter(User.id.in_(list(all_assigned_ids))))
        names = sorted([n for n in user_result.scalars().all() if n])
        db_workflow.assignee_names = names
    else:
        db_workflow.assignee_names = []

    if workflow_in.shared_viewer_ids:
        viewer_result = await db.execute(select(User.name).filter(User.id.in_(workflow_in.shared_viewer_ids)))
        db_workflow.shared_viewer_names = sorted([n for n in viewer_result.scalars().all() if n])
    else:
        db_workflow.shared_viewer_names = []

    await db.commit()
    await db.refresh(db_workflow)
    
    # Return reloaded workflow with relationships
    return await get_workflow(workflow_id, db, current_user)


@router.patch("/{workflow_id}/transfer-owner", response_model=schemas.WorkflowResponse)
async def transfer_workflow_owner(
    workflow_id: int,
    body: schemas.TransferOwnerRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Transfer workflow ownership to another user. Superadmin only."""
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=403,
            detail="Only a Superadmin can transfer workflow ownership."
        )

    # Fetch the workflow
    wf_result = await db.execute(
        select(Workflow).filter(Workflow.id == workflow_id)
    )
    db_workflow = wf_result.scalar_one_or_none()
    if not db_workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    # Fetch the new owner user
    user_result = await db.execute(select(User).filter(User.id == body.new_owner_id))
    new_owner = user_result.scalar_one_or_none()
    if not new_owner:
        raise HTTPException(status_code=404, detail="User not found")

    db_workflow.createdBy = new_owner.id
    db_workflow.created_by_name = new_owner.name

    await db.commit()
    return await get_workflow(workflow_id, db, current_user)


@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workflow(workflow_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workflow).filter(Workflow.id == workflow_id))
    db_workflow = result.scalar_one_or_none()
    if not db_workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Nullify workflow_id on linked data models to avoid FK violation
    linked_models_result = await db.execute(
        select(DataModel).filter(DataModel.workflow_id == workflow_id)
    )
    linked_models = linked_models_result.scalars().all()
    for dm in linked_models:
        dm.workflow_id = None
    await db.flush()
    
    await db.delete(db_workflow)
    await db.commit()
    return None


# --- Stages within Workflows ---

@router.post("/{workflow_id}/stages", response_model=schemas.StageResponse)
async def add_stage_to_workflow(
    workflow_id: int, 
    stage_in: schemas.StageBase, 
    db: AsyncSession = Depends(get_db)
):
    # Verify workflow exists
    wf_result = await db.execute(select(Workflow).filter(Workflow.id == workflow_id))
    if not wf_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    db_stage = Stage(**stage_in.model_dump(), workflow_id=workflow_id)
    db.add(db_stage)
    await db.commit()
    await db.refresh(db_stage)
    return db_stage

@router.get("/{workflow_id}/stages", response_model=List[schemas.StageResponse])
async def list_workflow_stages(workflow_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Stage).filter(Stage.workflow_id == workflow_id).order_by(Stage.stage_index))
    return result.scalars().all()

# --- Substages ---

@router.post("/stages/{stage_id}/substages", response_model=schemas.SubstageResponse)
async def create_substage(stage_id: int, substage_in: schemas.SubstageBase, db: AsyncSession = Depends(get_db)):
    db_substage = Substage(**substage_in.model_dump(), stage_id=stage_id)
    db.add(db_substage)
    await db.commit()
    await db.refresh(db_substage)
    return db_substage

@router.get("/stages/{stage_id}/substages", response_model=List[schemas.SubstageResponse])
async def list_substages(stage_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Substage).filter(Substage.stage_id == stage_id))
    return result.scalars().all()

# --- Assets (Templates & Libraries) ---

@router.post("/stages/{stage_id}/templates", response_model=schemas.TemplateResponse)
async def add_template(stage_id: int, template_in: schemas.TemplateBase, db: AsyncSession = Depends(get_db)):
    db_template = Template(**template_in.model_dump(), stage_id=stage_id)
    db.add(db_template)
    await db.commit()
    await db.refresh(db_template)
    return db_template

@router.post("/stages/{stage_id}/libraries", response_model=schemas.LibraryResponse)
async def add_library(stage_id: int, library_in: schemas.LibraryBase, db: AsyncSession = Depends(get_db)):
    db_library = Library(**library_in.model_dump(), stage_id=stage_id)
    db.add(db_library)
    await db.commit()
    await db.refresh(db_library)
    return db_library

@router.get("/stages/{stage_id}/assets")
async def get_stage_assets(stage_id: int, db: AsyncSession = Depends(get_db)):
    t_result = await db.execute(select(Template).filter(Template.stage_id == stage_id))
    l_result = await db.execute(select(Library).filter(Library.stage_id == stage_id))
    return {
        "templates": t_result.scalars().all(),
        "libraries": l_result.scalars().all()
    }

# --- Field Mappings ---


@router.post("/stages/{stage_id}/mappings", response_model=schemas.FieldMappingResponse)
async def create_mapping(stage_id: int, mapping_in: schemas.FieldMappingBase, db: AsyncSession = Depends(get_db)):
    db_mapping = FieldMapping(**mapping_in.model_dump(), stage_id=stage_id)
    db.add(db_mapping)
    await db.commit()
    await db.refresh(db_mapping)
    return db_mapping

@router.get("/stages/{stage_id}/mappings", response_model=List[schemas.FieldMappingResponse])
async def list_mappings(stage_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FieldMapping).filter(FieldMapping.stage_id == stage_id))
    return result.scalars().all()

# --- Independent Assignments ---

@router.post("/stages/{stage_id}/assignments", response_model=List[schemas.WorkflowAssignmentResponse])
async def assign_users_to_stage(
    stage_id: int,
    assignment_in: schemas.StageAssignmentsUpdate,
    db: AsyncSession = Depends(get_db)
):
    # Verify stage exists
    stage_result = await db.execute(select(Stage).filter(Stage.id == stage_id))
    stage = stage_result.scalar_one_or_none()
    if not stage:
        raise HTTPException(status_code=404, detail="Stage not found")

    # Clear existing assignments or just add new ones? 
    # Usually "assigned user" in a flow might mean a full update for that stage.
    # Let's do a full sync for this stage.
    await db.execute(
        select(WorkflowAssignment).filter(WorkflowAssignment.stage_id == stage_id)
    )
    result = await db.execute(select(WorkflowAssignment).filter(WorkflowAssignment.stage_id == stage_id))
    existing = result.scalars().all()
    for e in existing:
        await db.delete(e)
    
    await db.flush()

    new_assignments = []
    for user_id in assignment_in.user_ids:
        db_assignment = WorkflowAssignment(user_id=user_id, stage_id=stage_id)
        db.add(db_assignment)
        new_assignments.append(db_assignment)
    
    await db.commit()
    
    # Reload with user details
    result = await db.execute(
        select(WorkflowAssignment)
        .filter(WorkflowAssignment.stage_id == stage_id)
        .options(selectinload(WorkflowAssignment.user))
    )
    return result.scalars().all()

@router.delete("/stages/{stage_id}/assignments/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_user_assignment(stage_id: int, user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(WorkflowAssignment)
        .filter(WorkflowAssignment.stage_id == stage_id, WorkflowAssignment.user_id == user_id)
    )
    db_assignment = result.scalar_one_or_none()
    if not db_assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    await db.delete(db_assignment)
    await db.commit()
    return None
