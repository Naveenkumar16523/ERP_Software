from sqlalchemy import Column, String, Float, Boolean, Integer, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.utils.db import Base

def generate_uuid():
    return str(uuid.uuid4())

class EwayBill(Base):
    __tablename__ = "compliance_eway_bills"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    ewayBillNumber = Column(String(50), unique=True, index=True)
    shipmentId = Column(String(36), ForeignKey('sc_shipments.id'), nullable=True)
    invoiceId = Column(String(36), ForeignKey('finance_invoices.id'), nullable=True)
    vehicleNumber = Column(String(50), nullable=True)
    fromGstin = Column(String(50), nullable=True)
    toGstin = Column(String(50), nullable=True)
    fromAddress = Column(Text, nullable=True)
    toAddress = Column(Text, nullable=True)
    goodsValue = Column(Numeric(15, 4), default=0.0)
    hsnCode = Column(String(50), nullable=True)
    distanceKm = Column(Integer, default=0)
    validUntil = Column(DateTime, nullable=True)
    status = Column(String(50), default="ACTIVE") # ACTIVE, CANCELLED, REJECTED
    createdAt = Column(DateTime, default=datetime.utcnow)
