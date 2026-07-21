from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app import schemas

router = APIRouter(
    prefix="/users",
    tags=["users"],
    dependencies=[Depends(get_current_user)]
)

@router.get("/", response_model=List[schemas.UserResponse])
async def list_users(
    role: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(User)
    if role:
        query = query.filter(User.role == role)
    
    result = await db.execute(query)
    return result.scalars().all()

@router.patch("/{user_id}/role", response_model=schemas.UserResponse)
async def update_user_role(
    user_id: int,
    role_in: schemas.UserUpdateRole,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "superadmin":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Only superadmins can change user roles")
    
    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User not found")
    
    user.role = role_in.role
    await db.commit()
    await db.refresh(user)
    return user
