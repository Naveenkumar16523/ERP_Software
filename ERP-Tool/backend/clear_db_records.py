import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text, MetaData

# Load env variables directly
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Core tables that MUST NOT be cleared
RBAC_TABLES = {
    "ERPUser", "ERPRole", "ERPDepartment", "ModuleAccess", "AccessRequest",
    "User", "Role", "Permission", "UserRole", "RolePermission", "Session", "AuditLog"
}

def clear_database():
    engine = None
    if DATABASE_URL and "postgresql" in DATABASE_URL:
        try:
            print("Attempting to connect to PostgreSQL with 3s timeout...")
            engine = create_engine(DATABASE_URL, connect_args={"connect_timeout": 3})
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            print("PostgreSQL connected successfully!")
        except Exception as e:
            print(f"PostgreSQL connection failed: {e}. Falling back to SQLite.")
            engine = None

    if engine is None:
        print("Connecting to fallback SQLite erp.db...")
        engine = create_engine("sqlite:///./erp.db", connect_args={"check_same_thread": False})

    try:
        metadata = MetaData()
        # Reflect the tables from the engine
        metadata.reflect(bind=engine)
        
        # Deleting tables in reverse order of reflection sorting (dependency order)
        with engine.connect() as conn:
            # We disable foreign key checks temporarily if needed, but reverse sorted list works well
            for table in reversed(metadata.sorted_tables):
                if table.name in RBAC_TABLES:
                    print(f"🛡️  Preserving auth/RBAC table: {table.name}")
                    continue
                    
                print(f"🧹 Clearing operational table: {table.name}...")
                try:
                    conn.execute(table.delete())
                    print(f"✅ Table {table.name} cleared successfully.")
                except Exception as e:
                    print(f"❌ Failed to clear table {table.name}: {e}")
            
            # Commit the transaction
            conn.execute(text("COMMIT"))
            
        print("\n🎉 Database operational data clearance complete!")
        
    except Exception as e:
        print(f"❌ An error occurred during database clearance: {e}")

if __name__ == "__main__":
    clear_database()
