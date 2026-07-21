from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app import schemas
from app.api.deps import get_current_user, get_db
from app.models.data_model import DataModel
from app.models.stage import Stage
from app.models.user import User
from app.models.workflow import Workflow
from app.models.workflow_assignment import WorkflowAssignment

router = APIRouter(
    prefix="/data-models",
    tags=["data-models"],
    dependencies=[Depends(get_current_user)],
)


def is_assigned_workflow_member(current_user: User, workflow: Optional[Workflow]) -> bool:
    if workflow is None:
        return False
    for stage in workflow.stages:
        for assignment in stage.assignments:
            if assignment.user_id == current_user.id:
                return True
    return False


def can_access_data_model(current_user: User, data_model: DataModel) -> bool:
    if current_user.role in {"admin", "superadmin"}:
        return True
    return (
        data_model.created_by == current_user.id
        or data_model.region_id == current_user.region_id
        or is_assigned_workflow_member(current_user, data_model.workflow)
    )


def can_manage_data_model(current_user: User, data_model: DataModel) -> bool:
    if current_user.role in {"admin", "superadmin"}:
        return True
    return (
        data_model.created_by == current_user.id
        or is_assigned_workflow_member(current_user, data_model.workflow)
    )


async def load_data_model_or_404(
    data_model_id: int,
    db: AsyncSession,
) -> Optional[DataModel]:
    result = await db.execute(
        select(DataModel)
        .filter(DataModel.id == data_model_id)
        .options(
            selectinload(DataModel.creator),
            selectinload(DataModel.workflow)
            .selectinload(Workflow.stages)
            .selectinload(Stage.assignments)
            .selectinload(WorkflowAssignment.user),
        )
    )
    return result.scalar_one_or_none()


@router.get("/", response_model=List[schemas.DataModelResponse])
async def list_data_models(
    workflow_id: Optional[int] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        select(DataModel)
        .options(
            selectinload(DataModel.creator),
            selectinload(DataModel.workflow)
            .selectinload(Workflow.stages)
            .selectinload(Stage.assignments)
            .selectinload(WorkflowAssignment.user),
        )
        .order_by(DataModel.updated_at.desc())
    )
    if workflow_id is not None:
        query = query.filter(DataModel.workflow_id == workflow_id)

    result = await db.execute(query)
    data_models = result.scalars().all()
    return [
        data_model
        for data_model in data_models
        if can_access_data_model(current_user, data_model)
    ]


@router.post(
    "/",
    response_model=schemas.DataModelResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_data_model(
    data_model_in: schemas.DataModelCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data_model_in.workflow_id is not None:
        workflow_result = await db.execute(
            select(Workflow).filter(Workflow.id == data_model_in.workflow_id)
        )
        if workflow_result.scalar_one_or_none() is None:
            raise HTTPException(status_code=404, detail="Workflow not found")

    payload = data_model_in.model_dump()
    payload["created_by"] = current_user.id
    payload["region_id"] = data_model_in.region_id or current_user.region_id
    payload["updated_by_name"] = current_user.name or current_user.email

    db_data_model = DataModel(**payload)
    db.add(db_data_model)
    await db.commit()
    await db.refresh(db_data_model)

    loaded = await load_data_model_or_404(db_data_model.id, db)
    return loaded


@router.get("/{data_model_id}", response_model=schemas.DataModelResponse)
async def get_data_model(
    data_model_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data_model = await load_data_model_or_404(data_model_id, db)
    if data_model is None:
        raise HTTPException(status_code=404, detail="Data model not found")
    if not can_access_data_model(current_user, data_model):
        raise HTTPException(status_code=403, detail="Not authorized to access this data model")
    return data_model


@router.put("/{data_model_id}", response_model=schemas.DataModelResponse)
async def update_data_model(
    data_model_id: int,
    data_model_in: schemas.DataModelUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data_model = await load_data_model_or_404(data_model_id, db)
    if data_model is None:
        raise HTTPException(status_code=404, detail="Data model not found")
    if not can_manage_data_model(current_user, data_model):
        raise HTTPException(status_code=403, detail="Not authorized to update this data model")

    if data_model_in.workflow_id is not None:
        workflow_result = await db.execute(
            select(Workflow).filter(Workflow.id == data_model_in.workflow_id)
        )
        if workflow_result.scalar_one_or_none() is None:
            raise HTTPException(status_code=404, detail="Workflow not found")

    update_data = data_model_in.model_dump(exclude_unset=True)
    if "region_id" in update_data and update_data["region_id"] is None:
        update_data["region_id"] = data_model.region_id
    update_data["updated_by_name"] = current_user.name or current_user.email

    for field, value in update_data.items():
        setattr(data_model, field, value)

    await db.commit()
    await db.refresh(data_model)
    loaded = await load_data_model_or_404(data_model.id, db)
    return loaded


@router.delete("/{data_model_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_data_model(
    data_model_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data_model = await load_data_model_or_404(data_model_id, db)
    if data_model is None:
        raise HTTPException(status_code=404, detail="Data model not found")
    if not can_manage_data_model(current_user, data_model):
        raise HTTPException(status_code=403, detail="Not authorized to delete this data model")

    await db.delete(data_model)
    await db.commit()
    return None
