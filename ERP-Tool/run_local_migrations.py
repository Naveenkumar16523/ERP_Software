import os
import sqlite3
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load env
load_dotenv(os.path.join(os.path.dirname(__file__), 'backend', '.env'))

DATABASE_URL = os.getenv("DATABASE_URL")
SQLITE_DB = os.path.join(os.path.dirname(__file__), 'backend', 'erp.db')
if not os.path.exists(SQLITE_DB):
    SQLITE_DB = os.path.join(os.path.dirname(__file__), 'erp.db')

def migrate_sqlite():
    print(f"[SQLite] Migrating local database: {SQLITE_DB}...")
    try:
        conn = sqlite3.connect(SQLITE_DB)
        cursor = conn.cursor()
        
        # Expense Tracker
        print("  - Checking Expense Table...")
        try:
            cursor.execute('ALTER TABLE "Expense" ADD COLUMN "paidBy" TEXT;')
            print("    + Added 'paidBy' column")
        except sqlite3.OperationalError as e:
            print(f"    * 'paidBy' check: {e}")
            
        try:
            cursor.execute('ALTER TABLE "Expense" ADD COLUMN "receiptStatus" TEXT DEFAULT \'Pending\';')
            print("    + Added 'receiptStatus' column")
        except sqlite3.OperationalError as e:
            print(f"    * 'receiptStatus' check: {e}")

        # ApprovalWorkflow
        print("  - Checking ApprovalWorkflow Table...")
        try:
            cursor.execute('ALTER TABLE "ApprovalWorkflow" ADD COLUMN "requestNo" TEXT;')
            print("    + Added 'requestNo' column")
        except sqlite3.OperationalError as e:
            print(f"    * 'requestNo' check: {e}")
            
        try:
            cursor.execute('ALTER TABLE "ApprovalWorkflow" ADD COLUMN "date" TEXT;')
            print("    + Added 'date' column")
        except sqlite3.OperationalError as e:
            print(f"    * 'date' check: {e}")
            
        try:
            cursor.execute('ALTER TABLE "ApprovalWorkflow" ADD COLUMN "reason" TEXT;')
            print("    + Added 'reason' column")
        except sqlite3.OperationalError as e:
            print(f"    * 'reason' check: {e}")

        # TaxDeadline
        print("  - Checking TaxDeadline Table...")
        try:
            cursor.execute('ALTER TABLE "TaxDeadline" ADD COLUMN "taxName" TEXT;')
            print("    + Added 'taxName' column")
        except sqlite3.OperationalError as e:
            print(f"    * 'taxName' check: {e}")
            
        try:
            cursor.execute('ALTER TABLE "TaxDeadline" ADD COLUMN "rate" REAL DEFAULT 0.0;')
            print("    + Added 'rate' column")
        except sqlite3.OperationalError as e:
            print(f"    * 'rate' check: {e}")
            
        try:
            cursor.execute('ALTER TABLE "TaxDeadline" ADD COLUMN "applicableOn" TEXT;')
            print("    + Added 'applicableOn' column")
        except sqlite3.OperationalError as e:
            print(f"    * 'applicableOn' check: {e}")
            
        try:
            cursor.execute('ALTER TABLE "TaxDeadline" ADD COLUMN "effectiveDate" TEXT;')
            print("    + Added 'effectiveDate' column")
        except sqlite3.OperationalError as e:
            print(f"    * 'effectiveDate' check: {e}")

        # Statement Table
        print("  - Checking Statement Table...")
        try:
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS "Statement" (
                "id" VARCHAR(36) PRIMARY KEY,
                "statementType" VARCHAR(191) NOT NULL,
                "period" VARCHAR(191) NOT NULL,
                "totalIncome" REAL DEFAULT 0.0,
                "totalExpense" REAL DEFAULT 0.0,
                "netAmount" REAL DEFAULT 0.0,
                "status" VARCHAR(191) DEFAULT 'Generated' NOT NULL,
                "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            ''')
            print("    + Statement table created or already exists")
        except sqlite3.OperationalError as e:
            print(f"    * Statement table check failed: {e}")

        conn.commit()
        conn.close()
        print("[SQLite] ✅ Migration successfully completed.")
    except Exception as e:
        print(f"[SQLite] ❌ Migration failed: {e}")

def migrate_supabase():
    if not DATABASE_URL or "postgresql" not in DATABASE_URL:
        print("[Supabase] No postgres URL configured. Skipping.")
        return

    print(f"[Supabase] Attempting to connect & migrate remote database...")
    try:
        engine = create_engine(DATABASE_URL, connect_args={"connect_timeout": 5})
        with engine.connect() as conn:
            # Expense Tracker
            print("  - Migrating Expense table...")
            try:
                conn.execute(text('ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "paidBy" text;'))
                conn.execute(text('ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "receiptStatus" text DEFAULT \'Pending\';'))
                print("    + Expense updated successfully.")
            except Exception as e:
                print(f"    * Expense table check: {e}")

            # Approvals
            print("  - Migrating ApprovalWorkflow table...")
            try:
                conn.execute(text('ALTER TABLE "ApprovalWorkflow" ADD COLUMN IF NOT EXISTS "requestNo" text;'))
                conn.execute(text('ALTER TABLE "ApprovalWorkflow" ADD COLUMN IF NOT EXISTS "date" text;'))
                conn.execute(text('ALTER TABLE "ApprovalWorkflow" ADD COLUMN IF NOT EXISTS "reason" text;'))
                print("    + ApprovalWorkflow updated successfully.")
            except Exception as e:
                print(f"    * ApprovalWorkflow table check: {e}")

            # TaxCompliance
            print("  - Migrating TaxDeadline table...")
            try:
                conn.execute(text('ALTER TABLE "TaxDeadline" ADD COLUMN IF NOT EXISTS "taxName" text;'))
                conn.execute(text('ALTER TABLE "TaxDeadline" ADD COLUMN IF NOT EXISTS "rate" float8 DEFAULT 0.0;'))
                conn.execute(text('ALTER TABLE "TaxDeadline" ADD COLUMN IF NOT EXISTS "applicableOn" text;'))
                conn.execute(text('ALTER TABLE "TaxDeadline" ADD COLUMN IF NOT EXISTS "effectiveDate" text;'))
                print("    + TaxDeadline updated successfully.")
            except Exception as e:
                print(f"    * TaxDeadline table check: {e}")

            # Statement
            print("  - Creating Statement table...")
            try:
                conn.execute(text('''
                CREATE TABLE IF NOT EXISTS "Statement" (
                    "id" varchar(36) PRIMARY KEY,
                    "statementType" varchar(191) NOT NULL,
                    "period" varchar(191) NOT NULL,
                    "totalIncome" float8 DEFAULT 0.0,
                    "totalExpense" float8 DEFAULT 0.0,
                    "netAmount" float8 DEFAULT 0.0,
                    "status" varchar(191) DEFAULT 'Generated' NOT NULL,
                    "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
                );
                '''))
                print("    + Statement table created successfully.")
            except Exception as e:
                print(f"    * Statement table check: {e}")

            conn.commit()
            print("[Supabase] ✅ Migration successfully completed.")
    except Exception as e:
        print(f"[Supabase] ⚠️  Unable to connect to Supabase: {e}")
        print("[Supabase] NOTE: If you are running inside a restricted sandbox environment, please run the SQL scripts directly in the Supabase SQL editor.")

if __name__ == "__main__":
    migrate_sqlite()
    migrate_supabase()
