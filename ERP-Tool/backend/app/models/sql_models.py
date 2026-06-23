import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.utils.db import Base

def generate_uuid():
    return str(uuid.uuid4())

class ERPDepartment(Base):
    __tablename__ = "erp_departments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    code = Column(String(20), unique=True, nullable=False)

    roles = relationship("ERPRole", back_populates="department")
    users = relationship("ERPUser", back_populates="department")

class ERPRole(Base):
    __tablename__ = "erp_roles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    departmentId = Column(String(36), ForeignKey("erp_departments.id"), nullable=False)

    department = relationship("ERPDepartment", back_populates="roles")
    users = relationship("ERPUser", back_populates="role")
    module_access = relationship("ModuleAccess", back_populates="role", cascade="all, delete-orphan")

class ERPUser(Base):
    __tablename__ = "erp_users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    username = Column(String(100), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    passwordHash = Column(String(255), nullable=False)
    fullName = Column(String(255), nullable=False)
    
    roleId = Column(String(36), ForeignKey("erp_roles.id"), nullable=False)
    departmentId = Column(String(36), ForeignKey("erp_departments.id"), nullable=False)
    
    isActive = Column(Boolean, default=True)
    isCEO = Column(Boolean, default=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    role = relationship("ERPRole", back_populates="users")
    department = relationship("ERPDepartment", back_populates="users")

class ModuleAccess(Base):
    __tablename__ = "module_access"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    roleId = Column(String(36), ForeignKey("erp_roles.id"), nullable=False)
    moduleKey = Column(String(100), nullable=False)
    
    canRead = Column(Boolean, default=True)
    canWrite = Column(Boolean, default=False)
    canExport = Column(Boolean, default=False)

    role = relationship("ERPRole", back_populates="module_access")

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    userId = Column(String(36), ForeignKey("erp_users.id"), nullable=False)
    token = Column(String(500), unique=True, nullable=False)
    isRevoked = Column(Boolean, default=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    expiresAt = Column(DateTime, nullable=False)

    user = relationship("ERPUser")

class AccessRequest(Base):
    __tablename__ = "access_requests"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    fullName = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    department = Column(String(100), nullable=False)
    reason = Column(Text, nullable=True)
    status = Column(String(50), default="pending") # pending, approved, denied
    
    reviewedBy = Column(String(36), ForeignKey("erp_users.id"), nullable=True)
    reviewedAt = Column(DateTime, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    denialReason = Column(Text, nullable=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    userId = Column(String(36), nullable=True)
    action = Column(String(100), nullable=False)
    resource = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    ipAddress = Column(String(50), nullable=True)
    userAgent = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
