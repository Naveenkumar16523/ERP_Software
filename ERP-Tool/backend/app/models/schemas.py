from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

class UserRegister(BaseModel):
    firstName: str = Field(..., min_length=1, max_length=100)
    lastName: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class MFAVerify(BaseModel):
    token: str = Field(..., min_length=6, max_length=6)

class LeadStageUpdate(BaseModel):
    status: str

class AssetCreate(BaseModel):
    assetCode: str
    name: str
    category: str
    location: str
    serialNo: Optional[str] = None
    purchaseDate: datetime
    purchaseCost: float
    salvageValue: Optional[float] = None
    usefulLifeYears: Optional[int] = None
    depMethod: Optional[str] = None
    depRate: Optional[float] = None

class OrderPlace(BaseModel):
    customerId: str
    items: List[dict]
    shippingAddress: dict
    paymentMethod: str

class SupportTicketCreate(BaseModel):
    subject: str
    description: str
    priority: str = "MEDIUM"
    category: str

class ShipmentCreate(BaseModel):
    trackingNumber: str
    origin: str
    destination: str
    carrier: str
    estimatedDelivery: datetime

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    startDate: datetime
    endDate: Optional[datetime] = None
    budget: Optional[float] = None
    status: str = "PLANNING"

class ProjectTaskCreate(BaseModel):
    projectId: str
    title: str
    description: Optional[str] = None
    dueDate: Optional[datetime] = None
    status: str = "TODO"

class OEELogCreate(BaseModel):
    workCenterId: str
    availability: float
    performance: float
    quality: float
    timestamp: datetime

class VoucherCreate(BaseModel):
    voucherType: str
    amount: float
    debitAcc: str
    creditAcc: str
    narration: Optional[str] = ""
    date: Optional[datetime] = None
    referenceNo: Optional[str] = None

class AccountCreate(BaseModel):
    code: str
    name: str
    type: str
    balance: float = 0.0

class InvoiceCreate(BaseModel):
    invoiceNo: str
    customerName: str
    invoiceDate: str
    dueDate: str
    subtotal: float
    taxRate: float
    status: str = "PENDING"

class BudgetCreate(BaseModel):
    budgetName: str
    category: str
    period: str
    amount: float
    spent: float = 0.0
    year: int
    month: Optional[int] = None

class ExpenseCreate(BaseModel):
    description: str
    category: str
    amount: float
    date: str
    paidBy: str
    receiptStatus: str = "Pending"

class ApprovalWorkflowCreate(BaseModel):
    name: str
    description: Optional[str] = None
    entityType: str
    requiredApprovals: int

class TaxDeadlineCreate(BaseModel):
    taxType: str
    dueDate: datetime
    amount: Optional[float] = None
    status: str = "PENDING"

class StatementCreate(BaseModel):
    accountId: str
    period: str
    startDate: datetime
    endDate: datetime
