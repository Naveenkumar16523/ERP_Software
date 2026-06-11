"""
Recreates all SQLAlchemy model tables in Supabase (or SQLite fallback).
Run this AFTER dropping all tables from the Supabase SQL Editor.

Usage:
    python recreate_tables.py
"""

import os
import sys
import socket

# Global socket timeout (3s) to prevent hanging DNS lookups
socket.setdefaulttimeout(3.0)

# Add backend app to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL")

print(f"\n[Config] DATABASE_URL resolved")

# Build engine
if DATABASE_URL and "postgresql" in DATABASE_URL:
    try:
        from urllib.parse import urlparse
        parsed = urlparse(DATABASE_URL)
        print(f"[DB] Resolving host: {parsed.hostname}...")
        ip = socket.gethostbyname(parsed.hostname)
        print(f"[DB] Host resolved to {ip}")
        engine = create_engine(DATABASE_URL, connect_args={"connect_timeout": 5})
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("[DB] ✅ Connected to Supabase PostgreSQL successfully!")
    except Exception as e:
        print(f"[DB] ⚠️  PostgreSQL not reachable: {e}")
        print("[DB] Falling back to local SQLite (erp.db)...")
        DATABASE_URL = "sqlite:///./erp.db"
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    print("[DB] No PostgreSQL DATABASE_URL found. Using local SQLite (erp.db)...")
    DATABASE_URL = "sqlite:///./erp.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Import ALL models so SQLAlchemy knows about them
print("\n[Models] Importing all model definitions...")
from app.utils.db import Base

# Import every model module so Base.metadata is populated
from app.models.models import (
    # Auth & RBAC
    User, Role, Permission, UserRole, RolePermission, Session, AuditLog,
    ERPUser, ERPRole, ERPDepartment, ModuleAccess, AccessRequest,
    # Finance
    Account, JournalEntry, Invoice, Budget, Expense,
    ApprovalWorkflow, ApprovalLevel, TaxDeadline,
    # HR
    Department, Employee, Candidate, LeaveRequest, AttendanceLog, PaySlip,
    PerformanceReview, OnboardingChecklist, OnboardingTask,
    # Inventory
    Product, Warehouse, StockTransaction, InventoryBatch,
    # Procurement
    Supplier, PurchaseRequisition, RFQ, PurchaseOrder, GoodsReceipt, SupplierInvoice,
    # CRM
    Lead, Contact, CustomerAccount, Opportunity, Quote,
    # Manufacturing
    BillOfMaterials, BOMComponent, WorkCenter, ProductionOrder, OEELog,
    # Fixed Assets
    FixedAsset, DepreciationLog, MaintenanceOrder,
    # E-Commerce
    StoreProduct, CustomerOrder, OrderItem, LoyaltyAccount,
    # Supply Chain
    Shipment,
    # Banking
    BankAccount, BankTransaction, BankLoan,
    # Projects
    Project, ProjectTask,
    # Support
    SupportTicket,
    # Healthcare
    Patient, Appointment, Prescription,
    # Education
    Course, Enrollment, Assessment,
    # Sustainability
    CarbonEntry, ESGReport, GreenInitiative,
    # Marketing
    MarketingCampaign, MarketingLead, SocialPost,
    # Security
    SecurityEvent, SecurityIncident,
    # Analytics
    AnalyticsReport, KPISnapshot,
    # RPA Automation
    AutomationWorkflow, BotRunLog,
)

print(f"[Models] ✅ {len(Base.metadata.tables)} tables registered")

# Create all tables
print("\n[DB] Creating all tables...")
try:
    Base.metadata.create_all(bind=engine)
    print(f"[DB] ✅ All {len(Base.metadata.tables)} tables created successfully!\n")
    print("Registered tables:")
    for tbl in sorted(Base.metadata.tables.keys()):
        print(f"  ✓ {tbl}")
    print(f"\n[Done] Database is ready for fresh data entry.")
except Exception as e:
    print(f"[DB] ❌ Error creating tables: {e}")
    sys.exit(1)
