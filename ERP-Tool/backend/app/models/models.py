from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid

def generate_uuid():
    return str(uuid.uuid4())

# ─── Auth, RBAC & Session Management (Pydantic / MongoDB) ──────────────────────

class User(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    email: str
    password: str                                   
    firstName: str
    lastName: str
    isActive: bool = True
    mfaSecret: Optional[str] = None
    mfaEnabled: bool = False
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class Role(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    name: str
    description: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class Permission(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    name: str
    description: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class UserRole(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    userId: str
    roleId: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class RolePermission(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    roleId: str
    permissionId: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class Session(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    userId: str
    token: str
    ipAddress: Optional[str] = None
    userAgent: Optional[str] = None
    isValid: bool = True
    expiresAt: datetime
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class AuditLog(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    userId: Optional[str] = None
    action: str
    resource: str
    details: str
    ipAddress: Optional[str] = None
    userAgent: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# ─── HR Module Models ────────────────────────────────────────────────────────────

class Employee(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    employeeId: str
    firstName: str
    lastName: str
    email: str
    department: str
    designation: str
    salary: float
    dateOfJoining: datetime
    isActive: bool = True
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class Leave(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    employeeId: str
    leaveType: str
    startDate: datetime
    endDate: datetime
    reason: Optional[str] = None
    status: str = "pending" # pending, approved, rejected
    isActive: bool = True
    createdAt: datetime = Field(default_factory=datetime.utcnow)

# ─── Inventory Module Models ─────────────────────────────────────────────────────

class Product(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    sku: str
    name: str
    category: str
    quantity: int = 0
    reorderLevel: int = 10
    unitPrice: float
    isActive: bool = True
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class StockTransaction(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    productId: str
    transactionType: str # in, out
    quantity: int
    notes: Optional[str] = None
    isActive: bool = True
    createdAt: datetime = Field(default_factory=datetime.utcnow)

# ─── CRM Module Models ───────────────────────────────────────────────────────────

class Lead(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    name: str
    contact: Optional[str] = None
    email: Optional[str] = None
    source: str
    status: str = "new" # new, contacted, qualified, lost
    assignedTo: Optional[str] = None
    expectedValue: float = 0.0
    isActive: bool = True
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class Deal(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    leadId: str
    title: str
    value: float
    stage: str = "prospecting" # prospecting, proposal, won, lost
    isActive: bool = True
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class Contact(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    company: Optional[str] = None
    isActive: bool = True
    createdAt: datetime = Field(default_factory=datetime.utcnow)

# ─── Finance Module Models ───────────────────────────────────────────────────────

class Account(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    accountCode: str
    accountName: str
    type: str
    openingBalance: float = 0.0
    isActive: bool = True
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class JournalEntry(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    accountId: str
    amount: float
    type: str # debit, credit
    date: datetime
    description: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class Invoice(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    customerId: str
    amount: float
    status: str = "draft"
    dueDate: datetime
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class Budget(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    departmentId: str
    amount: float
    startDate: datetime
    endDate: datetime
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class Expense(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    amount: float
    category: str
    date: datetime
    description: Optional[str] = None
    status: str = "pending"
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class ApprovalLevel(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    roleId: str
    level: int

class ApprovalWorkflow(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    resourceId: str
    status: str = "pending"
    levels: list[ApprovalLevel] = []
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class TaxDeadline(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    title: str
    dueDate: datetime
    status: str = "upcoming"
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class Statement(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    accountId: str
    startDate: datetime
    endDate: datetime
    balance: float
    createdAt: datetime = Field(default_factory=datetime.utcnow)

# ─── Procurement & E-Commerce Models ─────────────────────────────────────────────

class Supplier(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    name: str
    contactInfo: Optional[str] = None
    isActive: bool = True
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class PurchaseOrder(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    supplierId: str
    totalAmount: float
    status: str = "draft"
    orderDate: datetime = Field(default_factory=datetime.utcnow)
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class CustomerOrder(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    customerId: str
    totalAmount: float
    status: str = "pending"
    orderDate: datetime = Field(default_factory=datetime.utcnow)
    createdAt: datetime = Field(default_factory=datetime.utcnow)

# ─── Assets & Manufacturing Models ───────────────────────────────────────────────

class FixedAsset(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    name: str
    value: float
    purchaseDate: datetime
    status: str = "active"
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class ProductionOrder(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    productId: str
    quantity: int
    status: str = "planned"
    startDate: Optional[datetime] = None
    endDate: Optional[datetime] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class Opportunity(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    title: str
    value: float
    probability: int
    status: str = "open"
    createdAt: datetime = Field(default_factory=datetime.utcnow)
