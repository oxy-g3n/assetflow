import asyncio
import os
from sqlalchemy import select

from app.core import security
from app.db.session import AsyncSessionLocal
from app.models.region import Region
from app.models.user import User


SHARED_ADMIN_PASSWORD = os.getenv("SHARED_ADMIN_PASSWORD", "admin123")


ADMIN_USERS = [
    {
        "email": "superadmin@assetflow.com",
        "password": SHARED_ADMIN_PASSWORD,
        "name": "Super Admin",
        "role": "superadmin",
        "avatar": "SA",
    },
    {
        "email": "admin@assetflow.com",
        "password": SHARED_ADMIN_PASSWORD,
        "name": "Admin",
        "role": "admin",
        "avatar": "AD",
    },
]


async def ensure_region(db):
    result = await db.execute(select(Region).order_by(Region.id))
    region = result.scalars().first()
    if region:
        return region

    region = Region(name="Default Region")
    db.add(region)
    await db.flush()
    return region


async def seed_admin_users():
    async with AsyncSessionLocal() as db:
        region = await ensure_region(db)

        for user_data in ADMIN_USERS:
            existing_user = await db.execute(select(User).filter(User.email == user_data["email"]))
            if existing_user.scalars().first():
                print(f"Skipping existing user: {user_data['email']}")
                continue

            db.add(
                User(
                    email=user_data["email"],
                    hashed_password=security.get_password_hash(user_data["password"]),
                    name=user_data["name"],
                    role=user_data["role"],
                    region_id=region.id,
                    avatar=user_data["avatar"],
                )
            )
            print(f"Created user: {user_data['email']} ({user_data['role']})")

        await db.commit()
        print(f"Seed complete. Region ID used: {region.id}")


if __name__ == "__main__":
    asyncio.run(seed_admin_users())
