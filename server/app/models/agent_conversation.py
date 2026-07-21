import datetime

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, Text

from app.db.session import Base


class AgentConversation(Base):
    __tablename__ = "agent_conversations"

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=False, index=True)
    user_input = Column(Text, nullable=False)
    output = Column(Text, nullable=False)
    response_id = Column(Text, nullable=True)
    response_created_at = Column(DateTime, nullable=True)
    response_completed_at = Column(DateTime, nullable=True)
    response_meta = Column(JSON, nullable=True)
    input_tokens = Column(Integer, nullable=True)
    cached_tokens = Column(Integer, nullable=True)
    output_tokens = Column(Integer, nullable=True)
    reasoning_tokens = Column(Integer, nullable=True)
    total_tokens = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
