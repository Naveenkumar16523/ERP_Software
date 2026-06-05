"""
Add CEO user directly to MySQL database
This script connects to the same database as the running backend
"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.models.models import ERPUser, ERPRole, ERPDepartment, ModuleAccess, Base
from passlib.context import CryptContext

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Force use of MySQL DATABASE_URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ DATABASE_URL not set in environment variables!")
    print("Please set DATABASE_URL in your .env file")
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
    # Test connection
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print("✅ Successfully connected to MySQL database")
except Exception as e:
    print(f"❌ Failed to connect to MySQL: {e}")
    exit(1)

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)
print("Database tables created/verified")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    # Check if departments exist
    departments = db.query(ERPDepartment).all()
    print(f"Found {len(departments)} departments")
    
    if not departments:
        print("Creating departments...")
        dept_data = [
            {"name": "Finance", "code": "FIN"},
            {"name": "Human Resources", "code": "HR"},
            {"name": "Operations", "code": "OPS"},
            {"name": "Sales & Marketing", "code": "SLS"},
            {"name": "IT / System", "code": "IT"},
            {"name": "Sustainability", "code": "SUS"}
        ]
        for data in dept_data:
            dept = ERPDepartment(**data)
            db.add(dept)
        db.commit()
        print("Departments created")
    
    # Get IT department
    it_dept = db.query(ERPDepartment).filter(ERPDepartment.code == "IT").first()
    if not it_dept:
        it_dept = ERPDepartment(name="IT / System", code="IT")
        db.add(it_dept)
        db.commit()
        print("Created IT department")
    
    # Check or create CEO role
    ceo_role = db.query(ERPRole).filter(ERPRole.name == "CEO").first()
    if not ceo_role:
        ceo_role = ERPRole(
            name="CEO",
            description="Chief Executive Officer with full system access",
            departmentId=it_dept.id
        )
        db.add(ceo_role)
        db.flush()
        
        # CEO has full access to all modules
        modules = [
            "dashboard", "finance", "human_resources", "inventory", "manufacturing",
            "procurement", "crm", "payroll", "fixed_assets", "projects", "supply_chain",
            "ecommerce", "analytics_hub", "banking", "healthcare", "education",
            "sustainability", "marketing", "security", "migration_hub", "rpa_automation"
        ]
        for module_key in modules:
            module_access = ModuleAccess(
                roleId=ceo_role.id,
                moduleKey=module_key,
                canRead=True,
                canWrite=True,
                canExport=True
            )
            db.add(module_access)
        
        db.commit()
        print("✅ Created CEO role with full module access")
    else:
        print("CEO role already exists")
    
    # Check or create CEO user
    existing_ceo = db.query(ERPUser).filter(ERPUser.username == "ceo").first()
    if not existing_ceo:
        ceo_user = ERPUser(
            username="ceo",
            passwordHash=pwd_context.hash("admin123"),
            fullName="Chief Executive Officer",
            email="ceo@company.com",
            roleId=ceo_role.id,
            departmentId=it_dept.id,
            isActive=True,
            isCEO=True
        )
        db.add(ceo_user)
        db.commit()
        print("✅ Created CEO user")
        print("   Username: ceo")
        print("   Password: admin123")
    else:
        print("CEO user already exists")
        # Verify password
        is_valid = pwd_context.verify("admin123", existing_ceo.passwordHash)
        print(f"   Password valid: {is_valid}")
        print(f"   isCEO: {existing_ceo.isCEO}")
        print(f"   isActive: {existing_ceo.isActive}")
    
    print("\n✅ CEO setup completed successfully!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    db.rollback()
    raise
finally:
    db.close()
