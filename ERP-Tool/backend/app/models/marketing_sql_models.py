from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

def generate_uuid():
    return str(uuid.uuid4())

from app.utils.db import Base

class MarketingDummy(Base):
    __tablename__ = "marketing_dummy"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100))
