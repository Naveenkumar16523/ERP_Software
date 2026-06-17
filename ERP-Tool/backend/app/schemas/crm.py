from pydantic import BaseModel
from typing import Optional

class LeadBase(BaseModel):
    name: str
    contact: Optional[str] = None
    email: Optional[str] = None
    source: str
    status: str = "new"
    assignedTo: Optional[str] = None
    expectedValue: float = 0.0

class LeadCreate(LeadBase):
    pass

class LeadUpdate(BaseModel):
    name: Optional[str] = None
    contact: Optional[str] = None
    email: Optional[str] = None
    source: Optional[str] = None
    status: Optional[str] = None
    assignedTo: Optional[str] = None
    expectedValue: Optional[float] = None
    isActive: Optional[bool] = None

class DealBase(BaseModel):
    leadId: str
    title: str
    value: float
    stage: str = "prospecting"

class DealCreate(DealBase):
    pass

class DealUpdate(BaseModel):
    title: Optional[str] = None
    value: Optional[float] = None
    stage: Optional[str] = None
    isActive: Optional[bool] = None

class ContactBase(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    company: Optional[str] = None

class ContactCreate(ContactBase):
    pass

class ContactUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    company: Optional[str] = None
    isActive: Optional[bool] = None
