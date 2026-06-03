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

# ─── Finance Module ────────────────────────────────────────────────────────────

class JournalEntry(Base):
    __tablename__ = "JournalEntry"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    blockIndex = Column(Integer, unique=True, nullable=False, index=True)
    voucherType = Column(String(191), nullable=False)
    voucherNo = Column(String(191), unique=True, nullable=False, index=True)
    date = Column(DateTime, default=datetime.utcnow, nullable=False)
    amount = Column(Float, nullable=False)
    debitAcc = Column(String(191), nullable=False)
    creditAcc = Column(String(191), nullable=False)
    narration = Column(Text, nullable=False)
    prevHash = Column(String(191), nullable=False)
    blockHash = Column(String(191), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

class Account(Base):
    __tablename__ = "Account"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(191), unique=True, nullable=False, index=True)
    name = Column(String(191), unique=True, nullable=False, index=True)
    type = Column(String(191), nullable=False)  # ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
    balance = Column(Float, default=0.0, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

# ─── Procurement & Suppliers ───────────────────────────────────────────────────

class Supplier(Base):
    __tablename__ = "Supplier"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(191), nullable=False)
    email = Column(String(191), unique=True, nullable=False, index=True)
    phone = Column(String(191), nullable=True)
    address = Column(String(191), nullable=True)
    deliveryScore = Column(Float, default=100.0, nullable=False)
    qualityScore = Column(Float, default=100.0, nullable=False)
    priceScore = Column(Float, default=100.0, nullable=False)
    overallScore = Column(Float, default=100.0, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

    purchaseOrders = relationship("PurchaseOrder", back_populates="supplier")
    goodsReceipts = relationship("GoodsReceipt", back_populates="supplier")
    invoices = relationship("SupplierInvoice", back_populates="supplier")

class PurchaseRequisition(Base):
    __tablename__ = "PurchaseRequisition"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    prNo = Column(String(191), unique=True, nullable=False, index=True)
    requestedBy = Column(String(191), nullable=False)
    department = Column(String(191), nullable=False)
    status = Column(String(191), nullable=False)  # PENDING, APPROVED, REJECTED
    items = Column(Text, nullable=False)  # JSON String
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    rfqs = relationship("RFQ", back_populates="purchaseRequisition")

class RFQ(Base):
    __tablename__ = "RFQ"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    rfqNo = Column(String(191), unique=True, nullable=False, index=True)
    purchaseRequisitionId = Column(String(36), ForeignKey("PurchaseRequisition.id", ondelete="SET NULL"), nullable=True, index=True)
    status = Column(String(191), nullable=False)  # SENT, RECEIVED_QUOTES, CLOSED
    items = Column(Text, nullable=False)  # JSON String
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    purchaseRequisition = relationship("PurchaseRequisition", back_populates="rfqs")
    purchaseOrders = relationship("PurchaseOrder", back_populates="rfq")

class PurchaseOrder(Base):
    __tablename__ = "PurchaseOrder"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    poNo = Column(String(191), unique=True, nullable=False, index=True)
    supplierId = Column(String(36), ForeignKey("Supplier.id"), nullable=False, index=True)
    rfqId = Column(String(36), ForeignKey("RFQ.id", ondelete="SET NULL"), nullable=True, index=True)
    status = Column(String(191), nullable=False)  # DRAFT, APPROVED, SHIPPED, COMPLETED
    items = Column(Text, nullable=False)  # JSON String
    totalAmount = Column(Float, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    supplier = relationship("Supplier", back_populates="purchaseOrders")
    rfq = relationship("RFQ", back_populates="purchaseOrders")
    goodsReceipts = relationship("GoodsReceipt", back_populates="purchaseOrder")
    invoices = relationship("SupplierInvoice", back_populates="purchaseOrder")

class GoodsReceipt(Base):
    __tablename__ = "GoodsReceipt"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    grnNo = Column(String(191), unique=True, nullable=False, index=True)
    purchaseOrderId = Column(String(36), ForeignKey("PurchaseOrder.id"), nullable=False, index=True)
    supplierId = Column(String(36), ForeignKey("Supplier.id"), nullable=False, index=True)
    receivedBy = Column(String(191), nullable=False)
    receivedItems = Column(Text, nullable=False)  # JSON String
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

    purchaseOrder = relationship("PurchaseOrder", back_populates="goodsReceipts")
    supplier = relationship("Supplier", back_populates="goodsReceipts")

class SupplierInvoice(Base):
    __tablename__ = "SupplierInvoice"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    invoiceNo = Column(String(191), unique=True, nullable=False, index=True)
    purchaseOrderId = Column(String(36), ForeignKey("PurchaseOrder.id"), nullable=False, index=True)
    supplierId = Column(String(36), ForeignKey("Supplier.id"), nullable=False, index=True)
    items = Column(Text, nullable=False)  # JSON String
    totalAmount = Column(Float, nullable=False)
    taxAmount = Column(Float, default=0.0, nullable=False)
    status = Column(String(191), nullable=False)  # UNPAID, PAID, MATCH_FAILED, MATCH_PASSED
    matchingLog = Column(Text, nullable=True)  # JSON String
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

    purchaseOrder = relationship("PurchaseOrder", back_populates="invoices")
    supplier = relationship("Supplier", back_populates="invoices")

# ─── HR & Org Management ───────────────────────────────────────────────────────

class Department(Base):
    __tablename__ = "Department"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(191), unique=True, nullable=False, index=True)
    name = Column(String(191), unique=True, nullable=False, index=True)
    parentId = Column(String(36), ForeignKey("Department.id", ondelete="RESTRICT", onupdate="RESTRICT"), nullable=True, index=True)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    employees = relationship("Employee", back_populates="department")

class Employee(Base):
    __tablename__ = "Employee"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    employeeCode = Column(String(191), unique=True, nullable=False, index=True)
    firstName = Column(String(191), nullable=False)
    lastName = Column(String(191), nullable=False)
    email = Column(String(191), unique=True, nullable=False, index=True)
    phone = Column(String(191), nullable=True)
    departmentId = Column(String(36), ForeignKey("Department.id"), nullable=False, index=True)
    jobTitle = Column(String(191), nullable=False)
    managerId = Column(String(36), ForeignKey("Employee.id", ondelete="RESTRICT", onupdate="RESTRICT"), nullable=True, index=True)
    baseSalary = Column(Float, nullable=False)
    joiningDate = Column(DateTime, default=datetime.utcnow, nullable=False)
    isActive = Column(Boolean, default=True, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    department = relationship("Department", back_populates="employees")
    leaveRequests = relationship("LeaveRequest", back_populates="employee", cascade="all, delete-orphan")
    attendanceLogs = relationship("AttendanceLog", back_populates="employee", cascade="all, delete-orphan")
    paySlips = relationship("PaySlip", back_populates="employee", cascade="all, delete-orphan")

class Candidate(Base):
    __tablename__ = "Candidate"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(191), nullable=False)
    email = Column(String(191), unique=True, nullable=False, index=True)
    phone = Column(String(191), nullable=True)
    jobTitle = Column(String(191), nullable=False)
    status = Column(String(191), nullable=False)  # APPLIED, INTERVIEW, OFFERED, REJECTED
    resumeUrl = Column(String(191), nullable=True)
    offerSent = Column(Boolean, default=False, nullable=False)
    offerPay = Column(Float, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class LeaveRequest(Base):
    __tablename__ = "LeaveRequest"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    employeeId = Column(String(36), ForeignKey("Employee.id", ondelete="CASCADE"), nullable=False, index=True)
    leaveType = Column(String(191), nullable=False)  # CASUAL, SICK, ANNUAL, MATERNITY
    startDate = Column(DateTime, nullable=False)
    endDate = Column(DateTime, nullable=False)
    status = Column(String(191), nullable=False)  # PENDING, APPROVED, REJECTED
    reason = Column(Text, nullable=True)
    approvedBy = Column(String(191), nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    employee = relationship("Employee", back_populates="leaveRequests")

class AttendanceLog(Base):
    __tablename__ = "AttendanceLog"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    employeeId = Column(String(36), ForeignKey("Employee.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(DateTime, nullable=False)
    checkIn = Column(DateTime, nullable=True)
    checkOut = Column(DateTime, nullable=True)
    status = Column(String(191), nullable=False)  # PRESENT, ABSENT, LATE, HALF_DAY
    verificationMethod = Column(String(191), nullable=False)  # BIOMETRIC, FACE_SCAN, MANUAL
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

    employee = relationship("Employee", back_populates="attendanceLogs")

    __table_args__ = (
        UniqueConstraint("employeeId", "date", name="AttendanceLog_employeeId_date_key"),
    )

class PaySlip(Base):
    __tablename__ = "PaySlip"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    employeeId = Column(String(36), ForeignKey("Employee.id", ondelete="CASCADE"), nullable=False, index=True)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    baseSalary = Column(Float, nullable=False)
    pfDeduction = Column(Float, nullable=False)
    esiDeduction = Column(Float, nullable=False)
    tdsDeduction = Column(Float, nullable=False)
    netPay = Column(Float, nullable=False)
    status = Column(String(191), nullable=False)  # UNPAID, PAID
    processedAt = Column(DateTime, default=datetime.utcnow, nullable=False)

    employee = relationship("Employee", back_populates="paySlips")

# ─── CRM Models ───────────────────────────────────────────────────────────────

class Lead(Base):
    __tablename__ = "Lead"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(191), nullable=False)
    company = Column(String(191), nullable=False)
    email = Column(String(191), nullable=False)
    phone = Column(String(191), nullable=True)
    status = Column(String(191), nullable=False)  # NEW, CONTACTED, QUALIFIED, LOST
    source = Column(String(191), nullable=True)
    value = Column(Float, default=0.0, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    contacts = relationship("Contact", back_populates="lead")
    opportunities = relationship("Opportunity", back_populates="lead")

class Contact(Base):
    __tablename__ = "Contact"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(191), nullable=False)
    email = Column(String(191), unique=True, nullable=False, index=True)
    phone = Column(String(191), nullable=True)
    company = Column(String(191), nullable=True)
    leadId = Column(String(36), ForeignKey("Lead.id", ondelete="SET NULL"), nullable=True, index=True)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    lead = relationship("Lead", back_populates="contacts")

class CustomerAccount(Base):
    __tablename__ = "CustomerAccount"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(191), unique=True, nullable=False, index=True)
    industry = Column(String(191), nullable=True)
    phone = Column(String(191), nullable=True)
    billingAddress = Column(String(191), nullable=True)
    isReturning = Column(Boolean, default=False, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    opportunities = relationship("Opportunity", back_populates="account")

class Opportunity(Base):
    __tablename__ = "Opportunity"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(191), nullable=False)
    stage = Column(String(191), nullable=False)  # QUALIFICATION, PROPOSAL, NEGOTIATION, WON, LOST
    value = Column(Float, nullable=False)
    closeDate = Column(DateTime, nullable=True)
    leadId = Column(String(36), ForeignKey("Lead.id", ondelete="SET NULL"), nullable=True, index=True)
    accountId = Column(String(36), ForeignKey("CustomerAccount.id", ondelete="SET NULL"), nullable=True, index=True)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    lead = relationship("Lead", back_populates="opportunities")
    account = relationship("CustomerAccount", back_populates="opportunities")
    quotes = relationship("Quote", back_populates="opportunity", cascade="all, delete-orphan")

class Quote(Base):
    __tablename__ = "Quote"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    quoteNo = Column(String(191), unique=True, nullable=False, index=True)
    opportunityId = Column(String(36), ForeignKey("Opportunity.id", ondelete="CASCADE"), nullable=False, index=True)
    items = Column(Text, nullable=False)  # JSON String
    subtotal = Column(Float, nullable=False)
    discount = Column(Float, nullable=False)
    taxAmount = Column(Float, nullable=False)
    total = Column(Float, nullable=False)
    status = Column(String(191), nullable=False)  # DRAFT, SENT, ACCEPTED, EXPIRED
    discountExplanation = Column(Text, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    opportunity = relationship("Opportunity", back_populates="quotes")

# ─── Inventory & Warehouses ───────────────────────────────────────────────────

class Product(Base):
    __tablename__ = "Product"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(191), unique=True, nullable=False, index=True)
    name = Column(String(191), nullable=False)
    description = Column(Text, nullable=True)
    type = Column(String(191), nullable=False)  # RAW_MATERIAL or FINISHED_GOOD
    reorderPoint = Column(Float, default=10.0, nullable=False)
    safetyStock = Column(Float, default=5.0, nullable=False)
    currentStock = Column(Float, default=0.0, nullable=False)
    costPrice = Column(Float, default=0.0, nullable=False)
    salePrice = Column(Float, default=0.0, nullable=False)
    expiryDate = Column(DateTime, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    stockTransactions = relationship("StockTransaction", back_populates="product", cascade="all, delete-orphan")
    bomComponents = relationship("BOMComponent", back_populates="product", cascade="all, delete-orphan")
    boms = relationship("BillOfMaterials", back_populates="finishedProduct", cascade="all, delete-orphan")
    productionOrders = relationship("ProductionOrder", back_populates="finishedProduct", cascade="all, delete-orphan")

class Warehouse(Base):
    __tablename__ = "Warehouse"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(191), unique=True, nullable=False, index=True)
    location = Column(String(191), nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    stockTransactions = relationship("StockTransaction", back_populates="warehouse", cascade="all, delete-orphan")

class StockTransaction(Base):
    __tablename__ = "StockTransaction"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    productId = Column(String(36), ForeignKey("Product.id", ondelete="CASCADE"), nullable=False, index=True)
    warehouseId = Column(String(36), ForeignKey("Warehouse.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity = Column(Float, nullable=False)
    unitCost = Column(Float, nullable=False)
    type = Column(String(191), nullable=False)  # RECEIPT, ISSUE, TRANSFER
    referenceNo = Column(String(191), nullable=True)
    transactionDate = Column(DateTime, default=datetime.utcnow, nullable=False)

    product = relationship("Product", back_populates="stockTransactions")
    warehouse = relationship("Warehouse", back_populates="stockTransactions")

# ─── E-Commerce Store ──────────────────────────────────────────────────────────

class StoreProduct(Base):
    __tablename__ = "StoreProduct"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    sku = Column(String(191), unique=True, nullable=False, index=True)
    name = Column(String(191), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(191), nullable=False)  # Electronics, Apparel, etc.
    price = Column(Float, nullable=False)
    salePrice = Column(Float, nullable=True)
    imageUrl = Column(String(191), nullable=True)
    stock = Column(Integer, default=0, nullable=False)
    isPublished = Column(Boolean, default=True, nullable=False)
    loyaltyPts = Column(Integer, default=0, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    orderItems = relationship("OrderItem", back_populates="product", cascade="all, delete-orphan")

class CustomerOrder(Base):
    __tablename__ = "CustomerOrder"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    orderNo = Column(String(191), unique=True, nullable=False, index=True)
    customerName = Column(String(191), nullable=False)
    customerEmail = Column(String(191), ForeignKey("LoyaltyAccount.customerEmail"), nullable=False, index=True)
    totalAmount = Column(Float, nullable=False)
    discountAmount = Column(Float, default=0.0, nullable=False)
    loyaltyRedeemed = Column(Integer, default=0, nullable=False)
    status = Column(String(191), nullable=False)  # PLACED, PROCESSING, SHIPPED, DELIVERED, CANCELLED
    shippingAddress = Column(Text, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    loyalty = relationship("LoyaltyAccount", back_populates="orders")

class OrderItem(Base):
    __tablename__ = "OrderItem"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    orderId = Column(String(36), ForeignKey("CustomerOrder.id", ondelete="CASCADE"), nullable=False, index=True)
    productId = Column(String(36), ForeignKey("StoreProduct.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    unitPrice = Column(Float, nullable=False)
    totalPrice = Column(Float, nullable=False)

    order = relationship("CustomerOrder", back_populates="items")
    product = relationship("StoreProduct", back_populates="orderItems")

class LoyaltyAccount(Base):
    __tablename__ = "LoyaltyAccount"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    customerEmail = Column(String(191), unique=True, nullable=False, index=True)
    customerName = Column(String(191), nullable=False)
    points = Column(Integer, default=0, nullable=False)
    tier = Column(String(191), default="BRONZE", nullable=False)  # BRONZE, SILVER, GOLD, PLATINUM
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    orders = relationship("CustomerOrder", back_populates="loyalty")

# ─── Fixed Assets & Maintenance ────────────────────────────────────────────────

class FixedAsset(Base):
    __tablename__ = "FixedAsset"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    assetCode = Column(String(191), unique=True, nullable=False, index=True)
    name = Column(String(191), nullable=False)
    category = Column(String(191), nullable=False)  # Machinery, Vehicles, IT Equipment
    location = Column(String(191), nullable=True)
    serialNo = Column(String(191), nullable=True)
    purchaseDate = Column(DateTime, nullable=False)
    purchaseCost = Column(Float, nullable=False)
    salvageValue = Column(Float, default=0.0, nullable=False)
    usefulLifeYears = Column(Integer, default=5, nullable=False)
    depMethod = Column(String(191), default="STRAIGHT_LINE", nullable=False)
    depRate = Column(Float, default=0.2, nullable=False)
    currentBookValue = Column(Float, nullable=False)
    status = Column(String(191), default="ACTIVE", nullable=False)  # ACTIVE, DISPOSED, UNDER_MAINTENANCE
    disposalDate = Column(DateTime, nullable=True)
    disposalValue = Column(Float, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    depreciationLogs = relationship("DepreciationLog", back_populates="asset", cascade="all, delete-orphan")
    maintenanceOrders = relationship("MaintenanceOrder", back_populates="asset")

class DepreciationLog(Base):
    __tablename__ = "DepreciationLog"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    assetId = Column(String(36), ForeignKey("FixedAsset.id", ondelete="CASCADE"), nullable=False, index=True)
    year = Column(Integer, nullable=False)
    openingValue = Column(Float, nullable=False)
    depAmount = Column(Float, nullable=False)
    closingValue = Column(Float, nullable=False)
    method = Column(String(191), nullable=False)  # STRAIGHT_LINE, DECLINING_BALANCE
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

    asset = relationship("FixedAsset", back_populates="depreciationLogs")

class MaintenanceOrder(Base):
    __tablename__ = "MaintenanceOrder"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    workOrderNo = Column(String(191), unique=True, nullable=False, index=True)
    assetId = Column(String(36), ForeignKey("FixedAsset.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(191), nullable=False)
    description = Column(Text, nullable=True)
    type = Column(String(191), nullable=False)  # PREVENTIVE, CORRECTIVE, PREDICTIVE
    priority = Column(String(191), default="MEDIUM", nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    assignedTo = Column(String(191), nullable=True)
    scheduledDate = Column(DateTime, nullable=True)
    completedDate = Column(DateTime, nullable=True)
    cost = Column(Float, default=0.0, nullable=False)
    status = Column(String(191), default="OPEN", nullable=False)  # OPEN, IN_PROGRESS, COMPLETED, CANCELLED
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    asset = relationship("FixedAsset", back_populates="maintenanceOrders")

# ─── Manufacturing Module ──────────────────────────────────────────────────────

class BillOfMaterials(Base):
    __tablename__ = "BillOfMaterials"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    bomNo = Column(String(191), unique=True, nullable=False, index=True)
    finishedProductId = Column(String(36), ForeignKey("Product.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(191), nullable=False)
    quantity = Column(Float, default=1.0, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    finishedProduct = relationship("Product", back_populates="boms")
    components = relationship("BOMComponent", back_populates="bom", cascade="all, delete-orphan")
    productionOrders = relationship("ProductionOrder", back_populates="bom")

class BOMComponent(Base):
    __tablename__ = "BOMComponent"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    bomId = Column(String(36), ForeignKey("BillOfMaterials.id", ondelete="CASCADE"), nullable=False, index=True)
    productId = Column(String(36), ForeignKey("Product.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity = Column(Float, nullable=False)

    bom = relationship("BillOfMaterials", back_populates="components")
    product = relationship("Product", back_populates="bomComponents")

class WorkCenter(Base):
    __tablename__ = "WorkCenter"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(191), unique=True, nullable=False, index=True)
    capacityHours = Column(Float, default=8.0, nullable=False)
    laborRate = Column(Float, default=0.0, nullable=False)
    machineRate = Column(Float, default=0.0, nullable=False)
    efficiency = Column(Float, default=1.0, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    productionOrders = relationship("ProductionOrder", back_populates="workCenter")
    oeeLogs = relationship("OEELog", back_populates="workCenter", cascade="all, delete-orphan")

class ProductionOrder(Base):
    __tablename__ = "ProductionOrder"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    orderNo = Column(String(191), unique=True, nullable=False, index=True)
    finishedProductId = Column(String(36), ForeignKey("Product.id", ondelete="CASCADE"), nullable=False, index=True)
    bomId = Column(String(36), ForeignKey("BillOfMaterials.id", ondelete="CASCADE"), nullable=False, index=True)
    workCenterId = Column(String(36), ForeignKey("WorkCenter.id", ondelete="SET NULL"), nullable=True, index=True)
    quantity = Column(Float, nullable=False)
    status = Column(String(191), nullable=False)  # PLANNED, IN_PROGRESS, COMPLETED, CANCELLED
    startDate = Column(DateTime, nullable=True)
    endDate = Column(DateTime, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    finishedProduct = relationship("Product", back_populates="productionOrders")
    bom = relationship("BillOfMaterials", back_populates="productionOrders")
    workCenter = relationship("WorkCenter", back_populates="productionOrders")

class OEELog(Base):
    __tablename__ = "OEELog"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    workCenterId = Column(String(36), ForeignKey("WorkCenter.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(DateTime, nullable=False)
    plannedProductionTime = Column(Float, nullable=False)
    runTime = Column(Float, nullable=False)
    plannedQuantity = Column(Float, nullable=False)
    totalQuantity = Column(Float, nullable=False)
    goodQuantity = Column(Float, nullable=False)
    availability = Column(Float, nullable=False)
    performance = Column(Float, nullable=False)
    quality = Column(Float, nullable=False)
    oeeScore = Column(Float, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

    workCenter = relationship("WorkCenter", back_populates="oeeLogs")

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
    reviewedBy = Column(String(36), ForeignKey("ERPUser.id", ondelete="SET NULL"), nullable=True)
    reviewedAt = Column(DateTime, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

    reviewer = relationship("ERPUser", foreign_keys=[reviewedBy])
