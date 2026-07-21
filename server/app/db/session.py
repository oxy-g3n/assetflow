from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# In production, use the DATABASE_URL from settings
engine = create_async_engine(
    settings.DATABASE_URL, pool_pre_ping=True
)
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)

SYNC_DATABASE_URL = settings.DATABASE_URL.replace("+asyncpg", "")
SyncEngine = create_engine(SYNC_DATABASE_URL, pool_pre_ping=True)
SyncSessionLocal = sessionmaker(
    bind=SyncEngine,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
