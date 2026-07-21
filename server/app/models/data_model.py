import datetime

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db.session import Base


class DataModel(Base):
    __tablename__ = "data_models"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    status = Column(String, nullable=False, default="draft")
    methodology = Column(String, nullable=True)
    region_id = Column(Integer, ForeignKey("regions.id"), nullable=False)
    workflow_id = Column(Integer, ForeignKey("workflows.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    updated_by_name = Column(String, nullable=True)
    conceptual_payload = Column(JSON, nullable=False, default=dict)
    logical_payload = Column(JSON, nullable=False, default=dict)
    physical_payload = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
    )

    creator = relationship("User", foreign_keys=[created_by])
    region = relationship("Region")
    workflow = relationship("Workflow", foreign_keys=[workflow_id])
