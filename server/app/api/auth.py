from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.schemas import UserLogin, Token, UserCreate, UserResponse
from app.core import security
from app.api.deps import get_db
from app.models.user import User

router = APIRouter()

@router.post("/signup", response_model=UserResponse)
async def signup(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if user already exists
    result = await db.execute(select(User).filter(User.email == user_in.email))
    user = result.scalars().first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists",
        )
    
    # Create new user
    new_user = User(
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password),
        name=user_in.name,
        role=user_in.role,
        region_id=user_in.region_id,
        avatar=user_in.avatar
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
async def login(login_data: UserLogin, db: AsyncSession = Depends(get_db)):
    # Find user in real pg database
    result = await db.execute(select(User).filter(User.email == login_data.email))
    user = result.scalars().first()
    
    if not user or not security.verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    # Optional: Verify if the user belongs to the login region
    if user.region_id != login_data.region_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User is not authorized for this region",
        )

    access_token = security.create_access_token(
        subject=user.email,
        role=user.role,
        region_id=user.region_id
    )
    
    return {
        "id": user.id,
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "region_id": user.region_id,
        "email": user.email,
        "name": user.name,
        "avatar": user.avatar
    }
