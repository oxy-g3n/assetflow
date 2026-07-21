import asyncio
import sys
from app.db.session import AsyncSessionLocal
from app.models.region import Region

async def add_region(name: str):
    async with AsyncSessionLocal() as session:
        new_region = Region(name=name)
        session.add(new_region)
        try:
            await session.commit()
            await session.refresh(new_region)
            print(f"Successfully added region: {new_region.name} with ID: {new_region.id}")
        except Exception as e:
            await session.rollback()
            print(f"Error adding region: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python add_region.py <name>")
        print("Example: python add_region.py India")
    else:
        asyncio.run(add_region(sys.argv[1]))
