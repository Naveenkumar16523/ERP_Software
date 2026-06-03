"""
Seed script for RBAC system - Creates departments, roles, module access, and CEO user
"""
from sqlalchemy.orm import Session
from app.utils.db import engine, SessionLocal
from app.models.models import ERPDepartment, ERPRole, ModuleAccess, ERPUser
from passlib.context import CryptContext
import sys

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Module definitions
MODULES = [
    "dashboard",
    "finance",
    "human_resources",
    "inventory",
    "manufacturing",
    "procurement",
    "crm",
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

# Department definitions
DEPARTMENTS = [
    {"name": "Finance", "code": "FIN"},
    {"name": "Human Resources", "code": "HR"},
    {"name": "Operations", "code": "OPS"},
    {"name": "Sales & Marketing", "code": "SAL"},
    {"name": "IT", "code": "IT"},
    {"name": "Sustainability", "code": "SUS"}
]

# Role definitions with module access
ROLES_CONFIG = [
    {
        "name": "finance_staff",
        "department": "Finance",
        "description": "Finance Department Staff",
        "modules": ["dashboard", "finance", "banking", "analytics_hub"],
        "module_permissions": {
            "payroll": {"canRead": True, "canWrite": False, "canExport": False}
        }
    },
    {
        "name": "hr_staff",
        "department": "Human Resources",
        "description": "HR Department Staff",
        "modules": ["dashboard", "human_resources", "payroll", "healthcare", "education"],
        "module_permissions": {
            "payroll": {"canRead": True, "canWrite": True, "canExport": True}
        }
    },
    {
        "name": "operations_staff",
        "department": "Operations",
        "description": "Operations Department Staff",
        "modules": ["dashboard", "inventory", "manufacturing", "supply_chain", "procurement", "fixed_assets", "projects"]
    },
    {
        "name": "sales_marketing_staff",
        "department": "Sales & Marketing",
        "description": "Sales & Marketing Department Staff",
        "modules": ["dashboard", "crm", "ecommerce", "marketing", "analytics_hub"]
    },
    {
        "name": "it_staff",
        "department": "IT",
        "description": "IT Department Staff",
        "modules": ["dashboard", "security", "migration_hub", "rpa_automation", "analytics_hub"]
    },
    {
        "name": "sustainability_staff",
        "department": "Sustainability",
        "description": "Sustainability Department Staff",
        "modules": ["dashboard", "sustainability", "analytics_hub"]
    },
    {
        "name": "ceo",
        "department": "Finance",  # CEO doesn't need a specific department, but we'll use Finance as default
        "description": "CEO / Superadmin with full access",
        "modules": MODULES,  # All modules
        "is_ceo_role": True
    }
]

def seed_database():
    db = SessionLocal()
    try:
        print("Starting RBAC seed...")
        
        # Create departments
        dept_map = {}
        for dept_data in DEPARTMENTS:
            existing = db.query(ERPDepartment).filter(ERPDepartment.code == dept_data["code"]).first()
            if not existing:
                dept = ERPDepartment(name=dept_data["name"], code=dept_data["code"])
                db.add(dept)
                db.flush()
                dept_map[dept_data["name"]] = dept.id
                print(f"Created department: {dept_data['name']}")
            else:
                dept_map[dept_data["name"]] = existing.id
                print(f"Department already exists: {dept_data['name']}")
        
        db.commit()
        
        # Create roles and module access
        for role_config in ROLES_CONFIG:
            dept_id = dept_map.get(role_config["department"])
            if not dept_id:
                print(f"Warning: Department {role_config['department']} not found, skipping role {role_config['name']}")
                continue
            
            # Check if role exists
            existing_role = db.query(ERPRole).filter(ERPRole.name == role_config["name"]).first()
            if existing_role:
                role = existing_role
                print(f"Role already exists: {role_config['name']}")
            else:
                role = ERPRole(
                    name=role_config["name"],
                    description=role_config["description"],
                    departmentId=dept_id
                )
                db.add(role)
                db.flush()
                print(f"Created role: {role_config['name']}")
            
            # Clear existing module access for this role
            db.query(ModuleAccess).filter(ModuleAccess.roleId == role.id).delete()
            
            # Add module access
            for module in role_config["modules"]:
                # Check for custom permissions
                if "module_permissions" in role_config and module in role_config["module_permissions"]:
                    perms = role_config["module_permissions"][module]
                else:
                    perms = {"canRead": True, "canWrite": True, "canExport": True}
                
                # CEO gets full access
                if role_config.get("is_ceo_role"):
                    perms = {"canRead": True, "canWrite": True, "canExport": True}
                
                module_access = ModuleAccess(
                    roleId=role.id,
                    moduleKey=module,
                    canRead=perms["canRead"],
                    canWrite=perms["canWrite"],
                    canExport=perms["canExport"]
                )
                db.add(module_access)
            
            print(f"Added {len(role_config['modules'])} module permissions for role: {role_config['name']}")
        
        db.commit()
        
        # Create CEO user
        ceo_role = db.query(ERPRole).filter(ERPRole.name == "ceo").first()
        if ceo_role:
            existing_ceo = db.query(ERPUser).filter(ERPUser.isCEO == True).first()
            if not existing_ceo:
                ceo_user = ERPUser(
                    username="ceo",
                    passwordHash=pwd_context.hash("admin123"),  # Change this in production!
                    fullName="CEO",
                    email="ceo@company.com",
                    roleId=ceo_role.id,
                    departmentId=dept_map["Finance"],
                    isActive=True,
                    isCEO=True
                )
                db.add(ceo_user)
                db.commit()
                print("Created CEO user (username: ceo, password: admin123)")
            else:
                print("CEO user already exists")
        
        print("\n✅ RBAC seed completed successfully!")
        print("\nDefault CEO credentials:")
        print("  Username: ceo")
        print("  Password: admin123")
        print("\n⚠️  Please change the CEO password in production!")
        
    except Exception as e:
        print(f"Error during seed: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    # Create tables
    from app.models.models import Base
    Base.metadata.create_all(bind=engine)
    print("Database tables created/verified")
    
    # Seed data
    seed_database()
