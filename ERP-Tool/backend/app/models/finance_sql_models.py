from sqlalchemy import Column, String, Float, Boolean, Integer, DateTime, ForeignKey, Text, Numeric
from datetime import datetime
import uuid

from app.utils.db import Base

def generate_uuid():
    return str(uuid.uuid4())

class FinanceAccount(Base):
    __tablename__ = "finance_accounts"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(50), unique=True, index=True)
    name = Column(String(100), index=True)
    type = Column(String(50))
    balance = Column(Numeric(15, 4), default=0.0)
    status = Column(String(50), default="ACTIVE")
    createdAt = Column(DateTime, default=datetime.utcnow)

class JournalEntry(Base):
    __tablename__ = "finance_journal_entries"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    blockIndex = Column(Integer, index=True)
    voucherType = Column(String(50))
    voucherNo = Column(String(100), unique=True, index=True)
    date = Column(DateTime, default=datetime.utcnow)
    amount = Column(Numeric(15, 4))
    currency = Column(String(10), default="USD")
    debitAcc = Column(String(100))
    creditAcc = Column(String(100))
    narration = Column(Text, nullable=True)
    prevHash = Column(String(255))
    blockHash = Column(String(255))
    createdAt = Column(DateTime, default=datetime.utcnow)

class Invoice(Base):
    __tablename__ = "finance_invoices"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    invoiceNo = Column(String(100), unique=True, index=True)
    customerName = Column(String(255), index=True)
    subtotal = Column(Numeric(15, 4))
    taxRate = Column(Numeric(15, 4))
    taxAmount = Column(Numeric(15, 4))
    totalAmount = Column(Numeric(15, 4))
    currency = Column(String(10), default="USD")
    status = Column(String(50), default="PENDING")
    invoiceDate = Column(String(50))
    dueDate = Column(DateTime, nullable=True)
    sent = Column(Boolean, default=False)
    createdAt = Column(DateTime, default=datetime.utcnow)

class Budget(Base):
    __tablename__ = "finance_budgets"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    budgetName = Column(String(255))
    category = Column(String(100))
    costCenter = Column(String(100))
    period = Column(String(50))
    amount = Column(Numeric(15, 4))
    spent = Column(Numeric(15, 4), default=0.0)
    year = Column(Integer)
    month = Column(Integer, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)

class Expense(Base):
    __tablename__ = "finance_expenses"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    description = Column(Text)
    category = Column(String(100))
    amount = Column(Numeric(15, 4))
    date = Column(DateTime)
    paidBy = Column(String(255))
    receiptStatus = Column(String(50), default="Pending")
    status = Column(String(50), default="PENDING")
    approvedBy = Column(String(255), nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)

class ApprovalWorkflow(Base):
    __tablename__ = "finance_approval_workflows"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    requestNo = Column(String(100), unique=True, index=True)
    type = Column(String(100))
    amount = Column(Numeric(15, 4))
    requester = Column(String(255))
    date = Column(String(50))
    reason = Column(Text, nullable=True)
    status = Column(String(50), default="PENDING")
    currentLevel = Column(Integer, default=1)
    createdAt = Column(DateTime, default=datetime.utcnow)

class ApprovalLevel(Base):
    __tablename__ = "finance_approval_levels"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    workflowId = Column(String(36), ForeignKey("finance_approval_workflows.id"))
    level = Column(Integer)
    approver = Column(String(255))
    status = Column(String(50), default="PENDING")
    timestamp = Column(String(100), nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)

class TaxDeadline(Base):
    __tablename__ = "finance_tax_deadlines"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    taxName = Column(String(255))
    taxType = Column(String(100))
    rate = Column(Numeric(15, 4))
    applicableOn = Column(String(255))
    effectiveDate = Column(DateTime)
    dueDate = Column(DateTime)
    period = Column(String(50))
    status = Column(String(50), default="PENDING")
    createdAt = Column(DateTime, default=datetime.utcnow)

class Statement(Base):
    __tablename__ = "finance_statements"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    statementType = Column(String(100))
    period = Column(String(100))
    totalIncome = Column(Numeric(15, 4))
    totalExpense = Column(Numeric(15, 4))
    netAmount = Column(Numeric(15, 4))
    status = Column(String(50), default="Generated")
    createdAt = Column(DateTime, default=datetime.utcnow)

class FinanceAuditLog(Base):
    __tablename__ = "finance_audit_logs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    userId = Column(String(36), nullable=True)
    action = Column(String(50))
    tableName = Column(String(100))
    recordId = Column(String(36))
    oldValue = Column(Text, nullable=True)
    newValue = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
