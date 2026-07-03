from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

def generate_uuid():
    return str(uuid.uuid4())

from app.utils.db import Base

class SecurityAlert(Base):
    __tablename__ = "sec_alerts"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    type = Column(String(100))
    severity = Column(String(50)) # CRITICAL, HIGH, MEDIUM, LOW
    description = Column(String(255))
    status = Column(String(50), default="ACTIVE") # ACTIVE, INVESTIGATING, RESOLVED
    assignedTo = Column(String(100), nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)

class AccessLog(Base):
    __tablename__ = "sec_access_logs"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    userId = Column(String(100))
    ipAddress = Column(String(50))
    action = Column(String(100))
    status = Column(String(50), default="SUCCESS") # SUCCESS, FAILED
    timestamp = Column(DateTime, default=datetime.utcnow)

class UserActivity(Base):
    __tablename__ = "sec_user_activities"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    userId = Column(String(100))
    module = Column(String(100))
    action = Column(String(100))
    metadata_info = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class ComplianceItem(Base):
    __tablename__ = "sec_compliance_items"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    standard = Column(String(100)) # e.g. SOC2, ISO27001
    status = Column(String(50), default="Compliant") # Compliant, Needs Review, Failing
    nextAuditDate = Column(DateTime, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
