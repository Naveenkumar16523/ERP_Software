from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, ForeignKey, Numeric, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

def generate_uuid():
    return str(uuid.uuid4())

from app.utils.db import Base

class Supplier(Base):
    __tablename__ = "procurement_suppliers"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), index=True)
    contactEmail = Column(String(255))
    contactPhone = Column(String(100))
    rating = Column(Numeric(3, 1), default=0.0)
    status = Column(String(50), default="Active")
    createdAt = Column(DateTime, default=datetime.utcnow)
    
class PurchaseOrder(Base):
    __tablename__ = "procurement_purchase_orders"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    poNumber = Column(String(100), unique=True, index=True)
    supplierId = Column(String(36), ForeignKey("procurement_suppliers.id"))
    department = Column(String(100))
    totalAmount = Column(Numeric(15, 4), default=0)
    status = Column(String(50), default="Draft") # Draft, Pending Approval, Approved, Received, Cancelled
    budgetDeducted = Column(Boolean, default=False)
    budgetId = Column(String(36), nullable=True) # ID of the budget to deduct from
    
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
class POItem(Base):
    __tablename__ = "procurement_po_items"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    purchaseOrderId = Column(String(36), ForeignKey("procurement_purchase_orders.id"))
    itemName = Column(String(255))
    quantity = Column(Integer)
    unitPrice = Column(Numeric(15, 4))
    receivedQuantity = Column(Integer, default=0)
    
    createdAt = Column(DateTime, default=datetime.utcnow)
