import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class Substage(Base):
    __tablename__ = "substages"

    id = Column(Integer, primary_key=True, index=True)
    stage_id = Column(Integer, ForeignKey("stages.id"), nullable=False)
    title = Column(String, nullable=False)
    subtitle = Column(String, nullable=True)
    status = Column(String, default="pending")
    type = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    stage = relationship("Stage", back_populates="substages")
