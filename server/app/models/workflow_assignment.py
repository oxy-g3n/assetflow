import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class WorkflowAssignment(Base):
    __tablename__ = "workflow_assignments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=True)
    stage_id = Column(Integer, ForeignKey("stages.id"), nullable=False)
    role = Column(String, default="assignee")  # assignee, reviewer
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User")
    agent = relationship("Agent")
    stage = relationship("Stage", back_populates="assignments")
