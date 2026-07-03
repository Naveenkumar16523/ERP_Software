from sqlalchemy import Column, String, Boolean, DateTime
from datetime import datetime
import uuid

def generate_uuid():
    return str(uuid.uuid4())

from app.utils.db import Base

class MobileAppConfig(Base):
    __tablename__ = "mobile_app_config"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    featureName = Column(String(100), unique=True)
    description = Column(String(255))
    status = Column(String(50), default="Planned") # Active, Planned
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
