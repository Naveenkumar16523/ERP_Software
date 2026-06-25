from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

def generate_uuid():
    return str(uuid.uuid4())

from app.utils.db import Base

class BankAccount(Base):
    __tablename__ = "banking_accounts"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    accountName = Column(String(100))
    accountNumber = Column(String(50), unique=True, index=True)
    bankName = Column(String(100))
    balance = Column(Integer, default=0) # using integer for cents/paise
    currency = Column(String(10), default="USD")
    status = Column(String(50), default="Active")
    createdAt = Column(DateTime, default=datetime.utcnow)

class BankTransaction(Base):
    __tablename__ = "banking_transactions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    accountId = Column(String(36), ForeignKey("banking_accounts.id"))
    transactionDate = Column(DateTime)
    description = Column(String(255))
    amount = Column(Integer) # positive for deposit, negative for withdrawal
    reconciled = Column(Boolean, default=False)
    matchedInvoiceId = Column(String(36), nullable=True) # Linked to finance_invoices.id when auto-matched
    createdAt = Column(DateTime, default=datetime.utcnow)
