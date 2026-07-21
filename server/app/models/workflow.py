import datetime
from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.models.user import User

class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=True)  # e.g., 'standard', 'custom'
    status = Column(String, default="draft")  # draft, active, archived
    completionDate = Column(Date, nullable=True)
    createdBy = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    created_by_name = Column(String, nullable=True)  # From diagram 'created_by'
    updated_by_name = Column(String, nullable=True)  # From diagram 'updated_by'
    assignee_names = Column(JSON, nullable=True)
    shared_viewer_ids = Column(JSON, nullable=True)
    shared_viewer_names = Column(JSON, nullable=True)
    tags = Column(JSON, nullable=True, default=list)

    creator = relationship("User", foreign_keys=[createdBy])
    stages = relationship("Stage", back_populates="workflow", cascade="all, delete-orphan")
