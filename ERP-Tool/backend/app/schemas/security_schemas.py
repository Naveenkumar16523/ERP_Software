from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime

class SecurityAlertBase(BaseModel):
    type: str
    severity: str
    description: str
    status: str
    assignedTo: Optional[str] = None

class SecurityAlertResponse(SecurityAlertBase):
    id: str
    createdAt: datetime
    class Config:
        from_attributes = True

class AccessLogBase(BaseModel):
    userId: str
    ipAddress: str
    action: str
    status: str

class AccessLogResponse(AccessLogBase):
    id: str
    timestamp: datetime
    class Config:
        from_attributes = True

class UserActivityBase(BaseModel):
    userId: str
    module: str
    action: str
    metadata_info: Optional[Dict[str, Any]] = None

class UserActivityResponse(UserActivityBase):
    id: str
    timestamp: datetime
    class Config:
        from_attributes = True

class ComplianceItemBase(BaseModel):
    standard: str
    status: str
    nextAuditDate: Optional[datetime] = None

class ComplianceItemResponse(ComplianceItemBase):
    id: str
    createdAt: datetime
    class Config:
        from_attributes = True

class SecurityAlertUpdate(BaseModel):
    status: Optional[str] = None
    assignedTo: Optional[str] = None
