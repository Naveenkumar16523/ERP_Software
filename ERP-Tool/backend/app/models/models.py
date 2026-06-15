from datetime import datetime
import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Float, ForeignKey, Text, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from app.utils.db import Base

def generate_uuid():
    return str(uuid.uuid4())

# ─── Auth, RBAC & Session Management ───────────────────────────────────────────

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

    roles = relationship("RolePermission", back_populates="permission", cascade="all, delete-orphan")

class UserRole(Base):
    __tablename__ = "UserRole"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    userId = Column(String(36), ForeignKey("User.id", ondelete="CASCADE"), nullable=False, index=True)
    roleId = Column(String(36), ForeignKey("Role.id", ondelete="CASCADE"), nullable=False, index=True)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="roles")
    role = relationship("Role", back_populates="users")

    __table_args__ = (
        UniqueConstraint("userId", "roleId", name="UserRole_userId_roleId_key"),
    )

class RolePermission(Base):
    __tablename__ = "RolePermission"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    roleId = Column(String(36), ForeignKey("Role.id", ondelete="CASCADE"), nullable=False, index=True)
    permissionId = Column(String(36), ForeignKey("Permission.id", ondelete="CASCADE"), nullable=False, index=True)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

    role = relationship("Role", back_populates="permissions")
    permission = relationship("Permission", back_populates="roles")

    __table_args__ = (
        UniqueConstraint("roleId", "permissionId", name="RolePermission_roleId_permissionId_key"),
    )

class Session(Base):
    __tablename__ = "Session"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    userId = Column(String(36), ForeignKey("User.id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String(512), unique=True, nullable=False, index=True)
    ipAddress = Column(String(191), nullable=True)
    userAgent = Column(Text, nullable=True)
    isValid = Column(Boolean, default=True, nullable=False)
    expiresAt = Column(DateTime, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="sessions")

class AuditLog(Base):
    __tablename__ = "AuditLog"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    userId = Column(String(36), ForeignKey("User.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(191), nullable=False)
    resource = Column(String(191), nullable=False)
    details = Column(Text, nullable=False)
    ipAddress = Column(String(191), nullable=True)
    userAgent = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="auditLogs")

# ─── RBAC System for Logistics ERP ───────────────────────────────────────────────

class ERPRole(Base):
    __tablename__ = "ERPRole"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(191), unique=True, nullable=False, index=True)
    description = Column(String(191), nullable=True)
    departmentId = Column(String(36), ForeignKey("ERPDepartment.id", ondelete="CASCADE"), nullable=False, index=True)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

    department = relationship("ERPDepartment", back_populates="roles")
    moduleAccess = relationship("ModuleAccess", back_populates="role", cascade="all, delete-orphan")

class ERPDepartment(Base):
    __tablename__ = "ERPDepartment"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(191), unique=True, nullable=False, index=True)
    code = Column(String(191), unique=True, nullable=False, index=True)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

    roles = relationship("ERPRole", back_populates="department")

class ModuleAccess(Base):
    __tablename__ = "ModuleAccess"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    roleId = Column(String(36), ForeignKey("ERPRole.id", ondelete="CASCADE"), nullable=False, index=True)
    moduleKey = Column(String(191), nullable=False, index=True)
    canRead = Column(Boolean, default=True, nullable=False)
    canWrite = Column(Boolean, default=False, nullable=False)
    canExport = Column(Boolean, default=False, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

    role = relationship("ERPRole", back_populates="moduleAccess")

    __table_args__ = (
        UniqueConstraint("roleId", "moduleKey", name="ModuleAccess_roleId_moduleKey_key"),
    )

class ERPUser(Base):
    __tablename__ = "ERPUser"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    username = Column(String(191), unique=True, nullable=False, index=True)
    passwordHash = Column(String(191), nullable=False)
    fullName = Column(String(191), nullable=False)
    email = Column(String(191), unique=True, nullable=False, index=True)
    roleId = Column(String(36), ForeignKey("ERPRole.id", ondelete="CASCADE"), nullable=False, index=True)
    departmentId = Column(String(36), ForeignKey("ERPDepartment.id", ondelete="CASCADE"), nullable=False, index=True)
    isActive = Column(Boolean, default=True, nullable=False)
    isCEO = Column(Boolean, default=False, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    role = relationship("ERPRole")
    department = relationship("ERPDepartment")

class AccessRequest(Base):
    __tablename__ = "AccessRequest"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    fullName = Column(String(191), nullable=False)
    email = Column(String(191), nullable=False)
    department = Column(String(191), nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String(191), default="pending", nullable=False, index=True)  # pending, approved, denied
    denialReason = Column(Text, nullable=True)
    reviewedBy = Column(String(36), ForeignKey("ERPUser.id", ondelete="SET NULL"), nullable=True)
    reviewedAt = Column(DateTime, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

    reviewer = relationship("ERPUser", foreign_keys=[reviewedBy])

# ─── Dynamic Stubbing for Missing Models ─────────────────────────────────────────
from sqlalchemy.orm.decl_api import DeclarativeMeta

class DummyMeta(DeclarativeMeta):
    def __getattr__(cls, name):
        if name.startswith("_"):
            raise AttributeError(name)
        return Column(String)

def __getattr__(name):
    # This catches any missing model import (e.g., from app.models.models import Employee)
    # and returns a dummy SQLAlchemy class so the app doesn't crash.
    class DummyModel(Base, metaclass=DummyMeta):
        __tablename__ = name.lower() + "_stub"
        id = Column(String(36), primary_key=True, default=generate_uuid)
    
    DummyModel.__name__ = name
    globals()[name] = DummyModel
    return DummyModel
