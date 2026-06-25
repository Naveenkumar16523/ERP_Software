from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, ForeignKey, Numeric, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

def generate_uuid():
    return str(uuid.uuid4())

from app.utils.db import Base

class TaxRule(Base):
    __tablename__ = "payroll_tax_rules"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    region = Column(String(100), default="Default")
    minSalary = Column(Numeric(15, 4), default=0)
    maxSalary = Column(Numeric(15, 4), nullable=True) # None for no upper limit
    taxPercent = Column(Numeric(5, 2), default=0)
    createdAt = Column(DateTime, default=datetime.utcnow)

class PayrollRecord(Base):
    __tablename__ = "payroll_records"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    employeeId = Column(String(36), ForeignKey("hr_employees.id"))
    employeeName = Column(String(255))
    month = Column(Integer)
    year = Column(Integer)
    
    baseSalary = Column(Numeric(15, 4), default=0)
    allowances = Column(Numeric(15, 4), default=0)
    
    # Deductions
    unpaidLeaveDeductionDays = Column(Integer, default=0)
    unpaidLeaveDeductionAmount = Column(Numeric(15, 4), default=0)
    taxDeduction = Column(Numeric(15, 4), default=0)
    
    netPay = Column(Numeric(15, 4), default=0)
    
    status = Column(String(50), default="Draft") # Draft, Processed, Paid
    payslipPdf = Column(Text, nullable=True) # Base64
    
    createdAt = Column(DateTime, default=datetime.utcnow)
    processedAt = Column(DateTime, nullable=True)
