from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class EmployeeBase(BaseModel):
    employeeId: str
    firstName: str
    lastName: str
    email: str
    department: str
    designation: str
    salary: float
    dateOfJoining: datetime

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    salary: Optional[float] = None
    isActive: Optional[bool] = None

class LeaveBase(BaseModel):
    employeeId: str
    leaveType: str
    startDate: datetime
    endDate: datetime
    reason: Optional[str] = None

class LeaveCreate(LeaveBase):
    pass

class LeaveUpdate(BaseModel):
    status: Optional[str] = None
    isActive: Optional[bool] = None
