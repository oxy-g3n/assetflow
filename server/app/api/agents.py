from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.api.deps import get_db, get_current_user
from app.models.agent import Agent
from app import schemas

router = APIRouter(
    prefix="/agents",
    tags=["agents"],
    dependencies=[Depends(get_current_user)]
)

@router.get("/", response_model=List[schemas.AgentResponse])
async def list_agents(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    result = await db.execute(select(Agent))
    return result.scalars().all()

@router.post("/", response_model=schemas.AgentResponse, status_code=status.HTTP_201_CREATED)
async def create_agent(
    agent_in: schemas.AgentCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_agent = Agent(**agent_in.model_dump())
    db.add(db_agent)
    await db.commit()
    await db.refresh(db_agent)
    return db_agent

@router.get("/{agent_id}", response_model=schemas.AgentResponse)
async def get_agent(
    agent_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    result = await db.execute(select(Agent).filter(Agent.id == agent_id))
    db_agent = result.scalar_one_or_none()
    if not db_agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return db_agent
