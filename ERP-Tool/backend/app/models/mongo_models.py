from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class ERPDepartmentModel(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    name: str
    code: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class ERPRoleModel(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    name: str
    description: Optional[str] = None
    departmentId: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class ModuleAccessModel(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    roleId: str
    moduleKey: str
    canRead: bool = True
    canWrite: bool = False
    canExport: bool = False
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class ERPUserModel(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    username: str
    passwordHash: str
    fullName: str
    email: str
    roleId: str
    departmentId: str
    isActive: bool = True
    isCEO: bool = False
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class AccessRequestModel(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    fullName: str
    email: str
    department: str
    reason: str
    status: str = "pending"
    denialReason: Optional[str] = None
    reviewedBy: Optional[str] = None
    reviewedAt: Optional[datetime] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
