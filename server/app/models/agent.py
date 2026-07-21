import datetime
from sqlalchemy import Column, Integer, String, DateTime, JSON
from app.db.session import Base

class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # e.g., 'extractor', 'validator', 'generator'
    config = Column(JSON, nullable=True)   # Agent-specific configuration
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
