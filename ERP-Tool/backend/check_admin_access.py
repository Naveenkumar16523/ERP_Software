"""
Check and ensure admin/CEO has full access to all modules
"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.models.models import ERPUser, ERPRole, ModuleAccess, Base
from passlib.context import CryptContext

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ DATABASE_URL not set in environment variables!")
    exit(1)

print(f"Connecting to: {DATABASE_URL}")

connect_args = {}
if "tidbcloud.com" in DATABASE_URL:
    connect_args = {"ssl": {}}

try:
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        connect_args=connect_args,
        pool_pre_ping=True,
        pool_recycle=3600
    )
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print("✅ Successfully connected to MySQL database")
except Exception as e:
    print(f"❌ Failed to connect to MySQL: {e}")
    exit(1)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    # Check CEO user
    ceo_user = db.query(ERPUser).filter(ERPUser.username == "ceo").first()
    
    if not ceo_user:
        print("❌ CEO user not found!")
    else:
        print("✅ CEO user found:")
        print(f"  Username: {ceo_user.username}")
        print(f"  isCEO: {ceo_user.isCEO}")
        print(f"  isActive: {ceo_user.isActive}")
        print(f"  Role ID: {ceo_user.roleId}")
        
        # Check CEO role
        ceo_role = db.query(ERPRole).filter(ERPRole.id == ceo_user.roleId).first()
        if ceo_role:
            print(f"\n✅ CEO role found:")
            print(f"  Role Name: {ceo_role.name}")
            print(f"  Description: {ceo_role.description}")
            
            # Check module access for CEO role
            module_access = db.query(ModuleAccess).filter(ModuleAccess.roleId == ceo_role.id).all()
            print(f"\n  Module Access Count: {len(module_access)}")
            
            # List all modules and their access
            modules = [
                "dashboard", "finance", "human_resources", "inventory", "manufacturing",
                "procurement", "crm", "payroll", "fixed_assets", "projects", "supply_chain",
                "ecommerce", "analytics_hub", "banking", "healthcare", "education",
                "sustainability", "marketing", "security", "migration_hub", "rpa_automation"
            ]
            
            print("\n  Current Module Access:")
            for ma in module_access:
                print(f"    {ma.moduleKey}: Read={ma.canRead}, Write={ma.canWrite}, Export={ma.canExport}")
            
            # Check for missing modules
            existing_module_keys = {ma.moduleKey for ma in module_access}
            missing_modules = set(modules) - existing_module_keys
            
            if missing_modules:
                print(f"\n  ⚠️  Missing modules: {missing_modules}")
                
                # Add missing modules with full access
                print("\n  Adding missing modules with full access...")
                for module_key in missing_modules:
                    new_access = ModuleAccess(
                        roleId=ceo_role.id,
                        moduleKey=module_key,
                        canRead=True,
                        canWrite=True,
                        canExport=True
                    )
                    db.add(new_access)
                db.commit()
                print("  ✅ Added all missing modules with full access")
            else:
                print("\n  ✅ CEO has access to all modules")
                
            # Ensure all modules have full access
            print("\n  Ensuring all modules have full access...")
            for ma in module_access:
                if not (ma.canRead and ma.canWrite and ma.canExport):
                    ma.canRead = True
                    ma.canWrite = True
                    ma.canExport = True
            db.commit()
            print("  ✅ All modules updated to full access")
        else:
            print(f"\n❌ CEO role not found for user!")
    
    print("\n✅ Admin access configuration completed!")
    print("\nCEO Login Credentials:")
    print("  Username: ceo")
    print("  Password: admin123")
    
except Exception as e:
    print(f"❌ Error: {e}")
    db.rollback()
    raise
finally:
    db.close()
