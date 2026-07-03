from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

def generate_uuid():
    return str(uuid.uuid4())

from app.utils.db import Base

class AutomationBot(Base):
    __tablename__ = "auto_bots"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    botId = Column(String(50), unique=True, index=True) # e.g. bot-1
    name = Column(String(100))
    description = Column(String(255))
    icon = Column(String(10)) # Emoji or code
    category = Column(String(50))
    status = Column(String(50), default="Idle") # Idle, Running, Error
    lastRun = Column(DateTime, nullable=True)
    runsToday = Column(Integer, default=0)
    successRate = Column(Float, default=100.0)
    createdAt = Column(DateTime, default=datetime.utcnow)

class BotRunLog(Base):
    __tablename__ = "auto_bot_run_logs"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    botId = Column(String(50), ForeignKey('auto_bots.botId'))
    timestamp = Column(DateTime, default=datetime.utcnow)
    logOutput = Column(Text) # JSON serialized array of strings or standard text
    status = Column(String(50), default="Completed") # Completed, Failed, Running
    createdAt = Column(DateTime, default=datetime.utcnow)
