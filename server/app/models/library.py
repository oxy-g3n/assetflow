import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class Library(Base):
    __tablename__ = "libraries"

    id = Column(Integer, primary_key=True, index=True)
    label = Column(String, nullable=False)
    region_id = Column(Integer, ForeignKey("regions.id"), nullable=True)
    file_path = Column(String, nullable=True)
    stage_id = Column(Integer, ForeignKey("stages.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    stage = relationship("Stage", back_populates="libraries")
    region = relationship("Region")
