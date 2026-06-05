"""
Complete RBAC Seed Script - Exact implementation per specification
Creates departments, roles, module access, and CEO user with exact permissions
"""

from sqlalchemy.orm import Session
from app.utils.db import engine, SessionLocal, Base
from app.models.models import ERPDepartment, ERPRole, ModuleAccess, ERPUser
from passlib.context import CryptContext
import sys

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Exact 21 modules as specified
MODULES = [
    "dashboard",
    "finance",
    "human_resources",
    "inventory",
    "manufacturing",
    "procurement",
    "crm_pipeline",
    "payroll",
    "fixed_assets",
    "projects",
    "supply_chain",
    "ecommerce",
    "analytics_hub",
    "banking",
    "healthcare",
    "education",
    "sustainability",
    "marketing",
    "security",
    "migration_hub",
    "rpa_automation"
]

# Exact role-module permissions per specification
ROLE_MODULE_PERMISSIONS = {
    "finance_staff": [
        "dashboard",
        "finance",
        "banking",
        "analytics_hub"
    ],
    "hr_staff": [
        "dashboard",
        "human_resources",
        "payroll",
        "healthcare",
        "education"
    ],
    "operations_staff": [
        "dashboard",
        "inventory",
        "manufacturing",
        "supply_chain",
        "procurement",
        "fixed_assets",
        "projects"
    ],
    "sales_staff": [
        "dashboard",
        "crm_pipeline",
        "ecommerce",
        "marketing",
        "analytics_hub"
    ],
    "it_staff": [
        "dashboard",
        "security",
        "migration_hub",
        "rpa_automation",
        "analytics_hub"
    ],
    "sustainability_staff": [
        "dashboard",
        "sustainability",
        "analytics_hub"
    ],
    "superadmin": MODULES  # CEO gets all 21 modules
}

# Department definitions
DEPARTMENTS = [
    {"id": "dept_finance", "name": "Finance", "code": "FIN"},
    {"id": "dept_hr", "name": "Human Resources", "code": "HR"},
    {"id": "dept_operations", "name": "Operations", "code": "OPS"},
    {"id": "dept_sales", "name": "Sales & Marketing", "code": "SLS"},
    {"id": "dept_it", "name": "IT / System", "code": "IT"},
    {"id": "dept_sustainability", "name": "Sustainability", "code": "SUS"}
]

# Role definitions with department mapping
ROLES = [
    {"id": "role_finance_staff", "name": "finance_staff", "description": "Finance Department Staff", "department_id": "dept_finance"},
    {"id": "role_hr_staff", "name": "hr_staff", "description": "Human Resources Department Staff", "department_id": "dept_hr"},
    {"id": "role_operations_staff", "name": "operations_staff", "description": "Operations Department Staff", "department_id": "dept_operations"},
    {"id": "role_sales_staff", "name": "sales_staff", "description": "Sales & Marketing Department Staff", "department_id": "dept_sales"},
    {"id": "role_it_staff", "name": "it_staff", "description": "IT / System Department Staff", "department_id": "dept_it"},
    {"id": "role_sustainability_staff", "name": "sustainability_staff", "description": "Sustainability Department Staff", "department_id": "dept_sustainability"},
    {"id": "role_superadmin", "name": "superadmin", "description": "CEO / Superadmin with full access", "department_id": "dept_finance"}
]

def seed_departments(db: Session):
    """Create ERP departments"""
    print("=== Seeding Departments ===")
    dept_map = {}
    
    for dept_data in DEPARTMENTS:
        # Check by name first (more reliable than ID for existing data)
        existing = db.query(ERPDepartment).filter(ERPDepartment.name == dept_data["name"]).first()
        if existing:
            dept_map[dept_data["id"]] = existing
            print(f"  Department already exists: {dept_data['name']}")
            continue
        
        # Check by code as well
        existing_by_code = db.query(ERPDepartment).filter(ERPDepartment.code == dept_data["code"]).first()
        if existing_by_code:
            dept_map[dept_data["id"]] = existing_by_code
            print(f"  Department already exists (by code): {dept_data['name']}")
            continue
        
        # Check by ID as fallback
        existing_by_id = db.query(ERPDepartment).filter(ERPDepartment.id == dept_data["id"]).first()
        if existing_by_id:
            dept_map[dept_data["id"]] = existing_by_id
            print(f"  Department already exists (by ID): {dept_data['name']}")
        else:
            dept = ERPDepartment(
                id=dept_data["id"],
                name=dept_data["name"],
                code=dept_data["code"]
            )
            db.add(dept)
            db.commit()
            db.flush()
            dept_map[dept_data["id"]] = dept
            print(f"  Created department: {dept_data['name']} (ID: {dept_data['id']})")
    
    return dept_map

def seed_roles_and_permissions(db: Session, dept_map: dict):
    """Create roles and module access permissions"""
    print("\n=== Seeding Roles and Module Access ===")
    
    for role_data in ROLES:
        # Check if role exists by name
        existing_role = db.query(ERPRole).filter(ERPRole.name == role_data["name"]).first()
        
        if existing_role:
            role = existing_role
            print(f"  Role already exists: {role_data['name']}")
        else:
            # Check by ID as fallback
            existing_by_id = db.query(ERPRole).filter(ERPRole.id == role_data["id"]).first()
            if existing_by_id:
                role = existing_by_id
                print(f"  Role already exists (by ID): {role_data['name']}")
            else:
                role = ERPRole(
                    id=role_data["id"],
                    name=role_data["name"],
                    description=role_data["description"],
                    departmentId=dept_map[role_data["department_id"]].id
                )
                db.add(role)
                db.commit()
                db.flush()
                print(f"  Created role: {role_data['name']}")
        
        # Clear existing module access for this role
        db.query(ModuleAccess).filter(ModuleAccess.roleId == role.id).delete()
        db.commit()
        
        # Get module permissions for this role
        allowed_modules = ROLE_MODULE_PERMISSIONS.get(role_data["name"], [])
        
        # Add module access
        for module_key in MODULES:
            can_access = module_key in allowed_modules
            
            module_access = ModuleAccess(
                roleId=role.id,
                moduleKey=module_key,
                canRead=can_access,
                canWrite=can_access,  # Full access = all permissions
                canExport=can_access
            )
            db.add(module_access)
        
        db.commit()
        print(f"    Set {len(allowed_modules)} module permissions for role: {role_data['name']}")
        print(f"    Allowed modules: {', '.join(allowed_modules)}")

def create_ceo_user(db: Session, dept_map: dict):
    """Create CEO user account"""
    print("\n=== Creating CEO User ===")
    
    # Get superadmin role
    superadmin_role = db.query(ERPRole).filter(ERPRole.id == "role_superadmin").first()
    if not superadmin_role:
        print("  ERROR: Superadmin role not found!")
        return
    
    # Create or update CEO user
    existing_ceo = db.query(ERPUser).filter(ERPUser.username == "ceo").first()
    
    if not existing_ceo:
        ceo_user = ERPUser(
            username="ceo",
            passwordHash=pwd_context.hash("admin123"),
            fullName="CEO",
            email="ceo@company.com",
            roleId=superadmin_role.id,
            departmentId=dept_map["dept_finance"].id,
            isActive=True,
            isCEO=True
        )
        db.add(ceo_user)
        db.commit()
        print("  Created CEO user")
        print("    Username: ceo")
        print("    Password: admin123")
        print("    Email: ceo@company.com")
    else:
        # Update existing CEO user
        existing_ceo.passwordHash = pwd_context.hash("admin123")
        existing_ceo.fullName = "CEO"
        existing_ceo.email = "ceo@company.com"
        existing_ceo.roleId = superadmin_role.id
        existing_ceo.departmentId = dept_map["dept_finance"].id
        existing_ceo.isActive = True
        existing_ceo.isCEO = True
        db.commit()
        print("  Updated CEO user")
        print("    Username: ceo")
        print("    Password: admin123 (reset)")
        print("    Email: ceo@company.com")

def main():
    """Main seeding function"""
    print("Starting Complete RBAC Seeding...")
    print("=" * 60)
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    print("Database tables created/verified\n")
    
    db = SessionLocal()
    
    try:
        # Seed departments
        dept_map = seed_departments(db)
        
        # Seed roles and permissions
        seed_roles_and_permissions(db, dept_map)
        
        # Create CEO user
        create_ceo_user(db, dept_map)
        
        print("\n" + "=" * 60)
        print("✅ Complete RBAC seeding finished successfully!")
        print("\n📋 Summary:")
        print(f"  - Departments: {len(DEPARTMENTS)}")
        print(f"  - Roles: {len(ROLES)}")
        print(f"  - Modules: {len(MODULES)}")
        print("\n🔐 CEO Login Credentials:")
        print("  Username: ceo")
        print("  Password: admin123")
        print("\n⚠️  IMPORTANT: Change the CEO password in production!")
        
    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()
