from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

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

class AccountType(str, Enum):
    ASSET = "ASSET"
    LIABILITY = "LIABILITY"
    EQUITY = "EQUITY"
    REVENUE = "REVENUE"
    EXPENSE = "EXPENSE"

class AccountCreate(BaseModel):
    code: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1)
    type: str
    balance: float = Field(default=0.0)

class VoucherType(str, Enum):
    PAYMENT = "PAYMENT"
    RECEIPT = "RECEIPT"
    JOURNAL = "JOURNAL"
    CONTRA = "CONTRA"

class VoucherCreate(BaseModel):
    voucherType: VoucherType
    amount: float = Field(..., gt=0.0, max_digits=15)
    debitAcc: str = Field(..., min_length=1, max_length=100)
    creditAcc: str = Field(..., min_length=1, max_length=100)
    narration: Optional[str] = Field(default="")
    date: Optional[str] = Field(default=None)
    referenceNo: Optional[str] = Field(default=None)

    @field_validator('debitAcc', 'creditAcc')
    @classmethod
    def strip_spaces(cls, v: str) -> str:
        return v.strip()

class EmployeeCreate(BaseModel):
    employeeCode: str = Field(..., min_length=1, max_length=20)
    firstName: str = Field(..., min_length=1, max_length=100)
    lastName: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(default=None, max_length=20)
    departmentId: str
    jobTitle: str = Field(..., min_length=1, max_length=100)
    managerId: Optional[str] = Field(default=None)
    baseSalary: float = Field(..., gt=0.0)

    @field_validator('employeeCode')
    @classmethod
    def format_code(cls, v: str) -> str:
        return v.strip().upper()

class LeaveRequestCreate(BaseModel):
    leaveType: str  # CASUAL, SICK, ANNUAL, MATERNITY
    startDate: datetime
    endDate: datetime
    reason: Optional[str] = None

class LeaveStatusUpdate(BaseModel):
    status: str  # APPROVED, REJECTED

class OEELogCreate(BaseModel):
    workCenterId: str
    date: datetime
    plannedProductionTime: float = Field(..., gt=0.0)
    runTime: float = Field(..., ge=0.0)
    plannedQuantity: float = Field(..., gt=0.0)
    totalQuantity: float = Field(..., ge=0.0)
    goodQuantity: float = Field(..., ge=0.0)

    @model_validator(mode='after')
    def validate_oee_metrics(self) -> 'OEELogCreate':
        if self.goodQuantity > self.totalQuantity:
            raise ValueError('goodQuantity cannot exceed totalQuantity')
        if self.runTime > self.plannedProductionTime:
            raise ValueError('runTime cannot exceed plannedProductionTime')
        return self

class ProductType(str, Enum):
    RAW_MATERIAL = "RAW_MATERIAL"
    FINISHED_GOOD = "FINISHED_GOOD"

class ProductCreate(BaseModel):
    code: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    type: ProductType
    reorderPoint: Optional[float] = 10.0
    safetyStock: Optional[float] = 5.0
    costPrice: Optional[float] = 0.0
    salePrice: Optional[float] = 0.0
    expiryDate: Optional[datetime] = None

class ProductUpdate(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    type: str
    reorderPoint: float
    safetyStock: float
    costPrice: float
    salePrice: float
    expiryDate: Optional[datetime] = None

class WarehouseCreate(BaseModel):
    name: str = Field(..., min_length=1)
    location: Optional[str] = None

class StockTransactionType(str, Enum):
    RECEIPT = "RECEIPT"
    ISSUE = "ISSUE"
    TRANSFER = "TRANSFER"

class StockTransactionCreate(BaseModel):
    productId: str
    warehouseId: str
    quantity: float
    unitCost: Optional[float] = 0.0
    type: StockTransactionType
    referenceNo: Optional[str] = None

class SupplierCreate(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None

class LeadCreate(BaseModel):
    name: str = Field(..., min_length=1)
    company: str = Field(..., min_length=1)
    email: str
    phone: Optional[str] = None
    status: str  # NEW, CONTACTED, QUALIFIED, LOST
    source: Optional[str] = None
    value: Optional[float] = 0.0

class LeadStageUpdate(BaseModel):
    status: str

class CustomerCreate(BaseModel):
    name: str = Field(..., min_length=1)
    industry: Optional[str] = None
    phone: Optional[str] = None
    billingAddress: Optional[str] = None

class AssetCreate(BaseModel):
    assetCode: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1)
    category: str
    location: Optional[str] = None
    serialNo: Optional[str] = None
    purchaseDate: datetime
    purchaseCost: float = Field(..., ge=0.0)
    salvageValue: Optional[float] = 0.0
    usefulLifeYears: Optional[int] = 5
    depMethod: Optional[str] = "STRAIGHT_LINE"
    depRate: Optional[float] = 0.2

class OrderItemInput(BaseModel):
    productId: str
    quantity: int = Field(..., gt=0)

class OrderPlace(BaseModel):
    customerName: str = Field(..., min_length=1)
    customerEmail: EmailStr
    shippingAddress: Optional[str] = None
    items: List[OrderItemInput]

class InvoiceCreate(BaseModel):
    customerName: str
    subtotal: float
    taxRate: float = Field(default=0.0)
    dueDate: Optional[str] = None
    invoiceDate: Optional[str] = None
    invoiceNo: Optional[str] = None
    status: Optional[str] = "PENDING"

class BudgetCreate(BaseModel):
    budgetName: str
    category: str
    period: str
    amount: float
    spent: Optional[float] = 0.0
    year: int
    month: Optional[int] = None
    costCenter: Optional[str] = None

class ExpenseCreate(BaseModel):
    description: str
    category: str
    amount: float
    date: str
    paidBy: Optional[str] = None
    receiptStatus: Optional[str] = "Pending"

class ApprovalWorkflowCreate(BaseModel):
    type: str
    amount: float
    requester: str
    requestNo: Optional[str] = None
    date: Optional[str] = None
    reason: Optional[str] = None
    status: Optional[str] = "PENDING"

class TaxDeadlineCreate(BaseModel):
    taxName: Optional[str] = None
    taxType: str
    rate: Optional[float] = 0.0
    applicableOn: Optional[str] = None
    effectiveDate: Optional[str] = None
    dueDate: str
    period: str
    status: Optional[str] = "PENDING"

class StatementCreate(BaseModel):
    statementType: str
    period: str
    totalIncome: Optional[float] = 0.0
    totalExpense: Optional[float] = 0.0
    netAmount: Optional[float] = 0.0
    status: Optional[str] = "Generated"

class ProjectCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    manager: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    budget: float = Field(default=0.0)

class ProjectTaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    assignedTo: Optional[str] = None
    dueDate: Optional[str] = None

class SupportTicketCreate(BaseModel):
    title: str
    customer: str
    priority: str
    assignedTo: Optional[str] = None

class ShipmentCreate(BaseModel):
    carrier: str
    origin: str
    destination: str
    estimatedDelivery: Optional[str] = None
