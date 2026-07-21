import asyncio
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.region import Region
from app.core import security
from sqlalchemy import select

async def create_engineer():
    async with AsyncSessionLocal() as db:
        # Get first region
        result = await db.execute(select(Region))
        region = result.scalars().first()
        if not region:
            print("No regions found! Create a region first.")
            return

        # Check if user already exists
        email = "engineer1@example.com"
        result = await db.execute(select(User).filter(User.email == email))
        user = result.scalars().first()
        if user:
            print(f"User {email} already exists.")
            return

        # Create engineer
        new_user = User(
            email=email,
            hashed_password=security.get_password_hash("password123"),
            name="Engineer One",
            role="engineer",
            region_id=region.id,
            avatar="EO"
        )
        db.add(new_user)
        await db.commit()
        print(f"User {email} created successfully with role engineer.")

if __name__ == "__main__":
    asyncio.run(create_engineer())
