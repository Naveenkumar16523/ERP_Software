"""
drop_and_recreate.py
=====================
Step 1: Connect to Supabase PostgreSQL
Step 2: DROP SCHEMA public CASCADE  (wipes ALL tables)
Step 3: CREATE SCHEMA public        (recreates empty schema)
Step 4: Recreate all tables from SQLAlchemy models

Usage:
    python drop_and_recreate.py
"""

import os
import sys
import socket
import time

# ── 0. Globals ──────────────────────────────────────────────────────────────
socket.setdefaulttimeout(10.0)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")

print("=" * 60)
print("  ERP Database — Drop & Recreate All Tables")
print("=" * 60)

# ── 1. Connect via psycopg2 ─────────────────────────────────────────────────
try:
    import psycopg2
    from urllib.parse import urlparse, unquote

    parsed = urlparse(DATABASE_URL)
    host     = parsed.hostname
    port     = parsed.port or 5432
    dbname   = parsed.path.lstrip("/").split("?")[0]
    user     = unquote(parsed.username)
    password = unquote(parsed.password)

    print(f"\n[Step 1] Connecting to PostgreSQL...")
    print(f"         Host : {host}")
    print(f"         Port : {port}")
    print(f"         DB   : {dbname}")
    print(f"         User : {user}")

    conn = psycopg2.connect(
        host=host,
        port=port,
        dbname=dbname,
        user=user,
        password=password,
        connect_timeout=10,
        sslmode="require",
    )
    conn.autocommit = True
    cur = conn.cursor()
    print("         ✅ Connected successfully!\n")

except Exception as e:
    print(f"\n❌ Could not connect to Supabase PostgreSQL: {e}")
    print("\n👉 Please run the SQL manually in Supabase Dashboard → SQL Editor:")
    print("""
    DROP SCHEMA public CASCADE;
    CREATE SCHEMA public;
    GRANT ALL ON SCHEMA public TO postgres;
    GRANT ALL ON SCHEMA public TO public;
    """)
    sys.exit(1)

# ── 2. Drop schema ───────────────────────────────────────────────────────────
print("[Step 2] Dropping all tables (DROP SCHEMA public CASCADE)...")
try:
    cur.execute("DROP SCHEMA public CASCADE;")
    print("         ✅ All tables dropped.\n")
except Exception as e:
    print(f"         ❌ Failed to drop schema: {e}")
    sys.exit(1)

# ── 3. Recreate schema ───────────────────────────────────────────────────────
print("[Step 3] Recreating empty public schema...")
try:
    cur.execute("CREATE SCHEMA public;")
    cur.execute("GRANT ALL ON SCHEMA public TO postgres;")
    cur.execute("GRANT ALL ON SCHEMA public TO public;")
    print("         ✅ Schema recreated.\n")
except Exception as e:
    print(f"         ❌ Failed to recreate schema: {e}")
    sys.exit(1)

cur.close()
conn.close()

# ── 4. Recreate tables via SQLAlchemy models ─────────────────────────────────
print("[Step 4] Recreating all tables from SQLAlchemy models...")

try:
    from sqlalchemy import create_engine, text

    # Build a clean URL (strip pgbouncer params for DDL operations)
    clean_url = DATABASE_URL.split("?")[0]

    engine = create_engine(
        clean_url,
        connect_args={"connect_timeout": 10, "sslmode": "require"},
        pool_pre_ping=True,
    )

    # Import Base and all models
    from app.utils.db import Base
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
        Supplier, PurchaseRequisition, RFQ, PurchaseOrder,
        GoodsReceipt, SupplierInvoice,
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

    table_count = len(Base.metadata.tables)
    print(f"         Found {table_count} table definitions in models.\n")

    Base.metadata.create_all(bind=engine)

    print(f"         ✅ All {table_count} tables recreated!\n")

    print("Tables created:")
    for name in sorted(Base.metadata.tables.keys()):
        print(f"   ✓  {name}")

except Exception as e:
    print(f"\n❌ Error recreating tables: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n" + "=" * 60)
print("  ✅ DONE! Database is clean and ready for fresh data entry.")
print("=" * 60)
