from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, ForeignKey, Numeric, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

def generate_uuid():
    return str(uuid.uuid4())

from app.utils.db import Base

class Lead(Base):
    __tablename__ = "crm_leads"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), index=True)
    company = Column(String(255))
    email = Column(String(255))
    phone = Column(String(100))
    status = Column(String(50), default="New") # New, Contacted, Qualified, Lost, Won
    expectedRevenue = Column(Numeric(15, 4), default=0.0)
    
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class SupportTicket(Base):
    __tablename__ = "crm_support_tickets"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255))
    description = Column(Text)
    leadId = Column(String(36), ForeignKey("crm_leads.id"), nullable=True) # Link to Lead/Customer
    status = Column(String(50), default="Open") # Open, In Progress, Resolved
    priority = Column(String(50), default="Medium") # Low, Medium, High
    
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
