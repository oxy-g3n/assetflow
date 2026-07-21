from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.db.session import get_db
from app.models.region import Region
from app.schemas import RegionResponse

router = APIRouter()

@router.get("/", response_model=List[RegionResponse])
async def get_regions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Region))
    regions = result.scalars().all()
    return regions
