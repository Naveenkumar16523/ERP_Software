from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

def generate_uuid():
    return str(uuid.uuid4())

from app.utils.db import Base

class AIConversation(Base):
    __tablename__ = "ai_conversations"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    userId = Column(String(36), index=True) # ID or email of the user
    title = Column(String(255), default="New Conversation")
    createdAt = Column(DateTime, default=datetime.utcnow)

class AIMessage(Base):
    __tablename__ = "ai_messages"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    conversationId = Column(String(36), ForeignKey('ai_conversations.id'))
    role = Column(String(50)) # 'user' or 'assistant'
    content = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
