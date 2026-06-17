from sqlalchemy import Column, String, Boolean, DateTime, Float, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

def generate_uuid():
    return str(uuid.uuid4())

from app.utils.db import Base

# ─── Auth, RBAC & Session Management (SQLAlchemy) ──────────────────────

class User(Base):
    __tablename__ = "User"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(191), unique=True, nullable=False, index=True)
    password = Column(String(191), nullable=False)
    firstName = Column(String(191), nullable=False)
    lastName = Column(String(191), nullable=False)
    isActive = Column(Boolean, default=True, nullable=False)
    mfaSecret = Column(String(191), nullable=True)
    mfaEnabled = Column(Boolean, default=False, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    auditLogs = relationship("AuditLog", back_populates="user")

class Role(Base):
    __tablename__ = "Role"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(191), unique=True, nullable=False, index=True)
    description = Column(String(191), nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

    users = relationship("UserRole", back_populates="role", cascade="all, delete-orphan")
    permissions = relationship("RolePermission", back_populates="role", cascade="all, delete-orphan")

class Permission(Base):
    __tablename__ = "Permission"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(191), unique=True, nullable=False, index=True)
    description = Column(String(191), nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

    rolePermissions = relationship("RolePermission", back_populates="permission", cascade="all, delete-orphan")

class UserRole(Base):
    __tablename__ = "UserRole"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    userId = Column(String(36), ForeignKey("User.id"), nullable=False)
    roleId = Column(String(36), ForeignKey("Role.id"), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="roles")
    role = relationship("Role", back_populates="users")

class RolePermission(Base):
    __tablename__ = "RolePermission"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    roleId = Column(String(36), ForeignKey("Role.id"), nullable=False)
    permissionId = Column(String(36), ForeignKey("Permission.id"), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

    role = relationship("Role", back_populates="permissions")
    permission = relationship("Permission", back_populates="rolePermissions")

class Session(Base):
    __tablename__ = "Session"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    userId = Column(String(36), ForeignKey("User.id"), nullable=False)
    token = Column(String(500), unique=True, nullable=False, index=True)
    ipAddress = Column(String(191), nullable=True)
    userAgent = Column(Text, nullable=True)
    isValid = Column(Boolean, default=True, nullable=False)
    expiresAt = Column(DateTime, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="sessions")

class AuditLog(Base):
    __tablename__ = "AuditLog"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    userId = Column(String(36), ForeignKey("User.id"), nullable=True)
    action = Column(String(191), nullable=False)
    resource = Column(String(191), nullable=False)
    details = Column(Text, nullable=True)
    ipAddress = Column(String(191), nullable=True)
    userAgent = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="auditLogs")

# ─── HR Module Models ────────────────────────────────────────────────────────────

class Employee(Base):
    __tablename__ = "Employee"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    employeeId = Column(String(191), unique=True, nullable=False, index=True)
    firstName = Column(String(191), nullable=False)
    lastName = Column(String(191), nullable=False)
    email = Column(String(191), unique=True, nullable=False)
    department = Column(String(191), nullable=False)
    designation = Column(String(191), nullable=False)
    salary = Column(Float, nullable=False)
    dateOfJoining = Column(DateTime, nullable=False)
    isActive = Column(Boolean, default=True, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class Leave(Base):
    __tablename__ = "Leave"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    employeeId = Column(String(36), ForeignKey("Employee.id"), nullable=False)
    leaveType = Column(String(191), nullable=False)
    startDate = Column(DateTime, nullable=False)
    endDate = Column(DateTime, nullable=False)
    reason = Column(Text, nullable=True)
    status = Column(String(191), default="pending", nullable=False)  # pending, approved, rejected
    isActive = Column(Boolean, default=True, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

# ─── Inventory Module Models ─────────────────────────────────────────────────────

class Product(Base):
    __tablename__ = "Product"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    sku = Column(String(191), unique=True, nullable=False, index=True)
    name = Column(String(191), nullable=False)
    category = Column(String(191), nullable=False)
    quantity = Column(Integer, default=0, nullable=False)
    reorderLevel = Column(Integer, default=10, nullable=False)
    unitPrice = Column(Float, nullable=False)
    isActive = Column(Boolean, default=True, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class StockTransaction(Base):
    __tablename__ = "StockTransaction"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    productId = Column(String(36), ForeignKey("Product.id"), nullable=False)
    transactionType = Column(String(191), nullable=False)  # in, out
    quantity = Column(Integer, nullable=False)
    notes = Column(Text, nullable=True)
    isActive = Column(Boolean, default=True, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

# ─── CRM Module Models ───────────────────────────────────────────────────────────

class Lead(Base):
    __tablename__ = "Lead"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(191), nullable=False)
    contact = Column(String(191), nullable=True)
    email = Column(String(191), nullable=True)
    source = Column(String(191), nullable=False)
    status = Column(String(191), default="new", nullable=False)  # new, contacted, qualified, lost
    assignedTo = Column(String(191), nullable=True)
    expectedValue = Column(Float, default=0.0, nullable=False)
    isActive = Column(Boolean, default=True, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class Deal(Base):
    __tablename__ = "Deal"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    leadId = Column(String(36), ForeignKey("Lead.id"), nullable=False)
    title = Column(String(191), nullable=False)
    value = Column(Float, nullable=False)
    stage = Column(String(191), default="prospecting", nullable=False)  # prospecting, proposal, won, lost
    isActive = Column(Boolean, default=True, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

class Contact(Base):
    __tablename__ = "Contact"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(191), nullable=False)
    phone = Column(String(191), nullable=True)
    email = Column(String(191), nullable=True)
    company = Column(String(191), nullable=True)
    isActive = Column(Boolean, default=True, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

# ─── Finance Module Models ────────────────────────────────────────────────────────

class Account(Base):
    __tablename__ = "Account"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(191), unique=True, nullable=False, index=True)
    name = Column(String(191), nullable=False)
    type = Column(String(191), nullable=False)  # ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
    balance = Column(Float, default=0.0, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

class JournalEntry(Base):
    __tablename__ = "JournalEntry"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    blockIndex = Column(Integer, unique=True, nullable=False, index=True)
    voucherNo = Column(String(191), nullable=False)
    date = Column(DateTime, nullable=False)
    amount = Column(Float, nullable=False)
    debitAcc = Column(String(191), nullable=False)
    creditAcc = Column(String(191), nullable=False)
    blockHash = Column(String(191), nullable=False)
    prevHash = Column(String(191), nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
