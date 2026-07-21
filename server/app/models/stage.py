import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class Stage(Base):
    __tablename__ = "stages"

    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id"), nullable=False)
    label = Column(String, nullable=False)
    stage_index = Column(Integer, default=0)
    sequence = Column(String, nullable=True)
    status = Column(String, default="pending")
    statusText = Column(String, nullable=True)
    description = Column(String, nullable=True)
    methodology = Column(String, nullable=True)
    isActive = Column(Boolean, default=True)
    disabled = Column(Boolean, default=False)
    assignee_count = Column(Integer, default=0)
    validation_enabled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    workflow = relationship("Workflow", back_populates="stages")
    substages = relationship("Substage", back_populates="stage", cascade="all, delete-orphan")
    templates = relationship("Template", back_populates="stage", cascade="all, delete-orphan")
    libraries = relationship("Library", back_populates="stage", cascade="all, delete-orphan")
    field_mappings = relationship("FieldMapping", back_populates="stage", cascade="all, delete-orphan")
    assignments = relationship("WorkflowAssignment", back_populates="stage", cascade="all, delete-orphan")
