"""
Seed script for RBAC System - Departments, Roles, and Module Access Matrix
This script creates the department-based role structure with module permissions
as specified in the requirements.
"""

from sqlalchemy.orm import Session
from app.utils.db import SessionLocal, engine, Base
from app.models.models import ERPDepartment, ERPRole, ModuleAccess, ERPUser
from passlib.context import CryptContext
import uuid

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Module access matrix based on requirements
# Key: module_key, Value: access level per department (Full, Hidden, Read-only)
MODULE_ACCESS_MATRIX = {
    "dashboard": {
        "Finance": "Full",
        "HR": "Full",
        "Operations": "Full",
        "Sales": "Full",
        "IT": "Full",
        "Sustainability": "Full"
    },
    "finance": {
        "Finance": "Full",
        "HR": "Hidden",
        "Operations": "Hidden",
        "Sales": "Hidden",
        "IT": "Hidden",
        "Sustainability": "Hidden"
    },
    "human_resources": {
        "Finance": "Hidden",
        "HR": "Full",
        "Operations": "Hidden",
        "Sales": "Hidden",
        "IT": "Hidden",
        "Sustainability": "Hidden"
    },
    "inventory": {
        "Finance": "Hidden",
        "HR": "Hidden",
        "Operations": "Full",
        "Sales": "Hidden",
        "IT": "Hidden",
        "Sustainability": "Hidden"
    },
    "manufacturing": {
        "Finance": "Hidden",
        "HR": "Hidden",
        "Operations": "Full",
        "Sales": "Hidden",
        "IT": "Hidden",
        "Sustainability": "Hidden"
    },
    "procurement": {
        "Finance": "Hidden",
        "HR": "Hidden",
        "Operations": "Full",
        "Sales": "Hidden",
        "IT": "Hidden",
        "Sustainability": "Hidden"
    },
    "crm": {
        "Finance": "Hidden",
        "HR": "Hidden",
        "Operations": "Hidden",
        "Sales": "Full",
        "IT": "Hidden",
        "Sustainability": "Hidden"
    },
    "payroll": {
        "Finance": "Hidden",
        "HR": "Full",
        "Operations": "Hidden",
        "Sales": "Hidden",
        "IT": "Hidden",
        "Sustainability": "Hidden"
    },
    "fixed_assets": {
        "Finance": "Hidden",
        "HR": "Hidden",
        "Operations": "Full",
        "Sales": "Hidden",
        "IT": "Hidden",
        "Sustainability": "Hidden"
    },
    "projects": {
        "Finance": "Hidden",
        "HR": "Hidden",
        "Operations": "Full",
        "Sales": "Hidden",
        "IT": "Hidden",
        "Sustainability": "Hidden"
    },
    "supply_chain": {
        "Finance": "Hidden",
        "HR": "Hidden",
        "Operations": "Full",
        "Sales": "Hidden",
        "IT": "Hidden",
        "Sustainability": "Hidden"
    },
    "ecommerce": {
        "Finance": "Hidden",
        "HR": "Hidden",
        "Operations": "Hidden",
        "Sales": "Full",
        "IT": "Hidden",
        "Sustainability": "Hidden"
    },
    "analytics_hub": {
        "Finance": "Full",
        "HR": "Hidden",
        "Operations": "Hidden",
        "Sales": "Full",
        "IT": "Full",
        "Sustainability": "Full"
    },
    "banking": {
        "Finance": "Full",
        "HR": "Hidden",
        "Operations": "Hidden",
        "Sales": "Hidden",
        "IT": "Hidden",
        "Sustainability": "Hidden"
    },
    "healthcare": {
        "Finance": "Hidden",
        "HR": "Full",
        "Operations": "Hidden",
        "Sales": "Hidden",
        "IT": "Hidden",
        "Sustainability": "Hidden"
    },
    "education": {
        "Finance": "Hidden",
        "HR": "Full",
        "Operations": "Hidden",
        "Sales": "Hidden",
        "IT": "Hidden",
        "Sustainability": "Hidden"
    },
    "sustainability": {
        "Finance": "Hidden",
        "HR": "Hidden",
        "Operations": "Hidden",
        "Sales": "Hidden",
        "IT": "Hidden",
        "Sustainability": "Full"
    },
    "marketing": {
        "Finance": "Hidden",
        "HR": "Hidden",
        "Operations": "Hidden",
        "Sales": "Full",
        "IT": "Hidden",
        "Sustainability": "Hidden"
    },
    "security": {
        "Finance": "Hidden",
        "HR": "Hidden",
        "Operations": "Hidden",
        "Sales": "Hidden",
        "IT": "Full",
        "Sustainability": "Hidden"
    },
    "migration_hub": {
        "Finance": "Hidden",
        "HR": "Hidden",
        "Operations": "Hidden",
        "Sales": "Hidden",
        "IT": "Full",
        "Sustainability": "Hidden"
    },
    "rpa_automation": {
        "Finance": "Hidden",
        "HR": "Hidden",
        "Operations": "Hidden",
        "Sales": "Hidden",
        "IT": "Full",
        "Sustainability": "Hidden"
    }
}

def seed_departments(db: Session):
    """Create ERP departments"""
    departments_data = [
        {"name": "Finance", "code": "FIN"},
        {"name": "Human Resources", "code": "HR"},
        {"name": "Operations", "code": "OPS"},
        {"name": "Sales & Marketing", "code": "SLS"},
        {"name": "IT / System", "code": "IT"},
        {"name": "Sustainability", "code": "SUS"}
    ]
    
    for dept_data in departments_data:
        existing = db.query(ERPDepartment).filter(ERPDepartment.code == dept_data["code"]).first()
        if not existing:
            dept = ERPDepartment(**dept_data)
            db.add(dept)
            print(f"Created department: {dept_data['name']}")
        else:
            print(f"Department already exists: {dept_data['name']}")
    
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error committing departments: {e}")
        # Try to commit one by one
        for dept_data in departments_data:
            existing = db.query(ERPDepartment).filter(ERPDepartment.code == dept_data["code"]).first()
            if not existing:
                try:
                    dept = ERPDepartment(**dept_data)
                    db.add(dept)
                    db.commit()
                    print(f"Created department: {dept_data['name']}")
                except Exception as e:
                    db.rollback()
                    print(f"Skipping department {dept_data['name']}: {e}")

def seed_roles_and_permissions(db: Session):
    """Create roles and module access permissions"""
    departments = db.query(ERPDepartment).all()
    dept_map = {dept.name: dept for dept in departments}
    
    # Debug: Print available departments
    print(f"Available departments: {[d.name for d in departments]}")
    
    # Role definitions per department
    roles_data = [
        {"name": "Finance Staff", "description": "Finance department staff with access to finance modules", "dept_name": "Finance"},
        {"name": "HR Staff", "description": "HR department staff with access to HR modules", "dept_name": "Human Resources"},
        {"name": "Operations Staff", "description": "Operations department staff with access to operations modules", "dept_name": "Operations"},
        {"name": "Sales & Marketing Staff", "description": "Sales & Marketing staff with access to sales modules", "dept_name": "Sales & Marketing"},
        {"name": "IT / System Staff", "description": "IT department staff with access to system modules", "dept_name": "IT / System"},
        {"name": "Sustainability Staff", "description": "Sustainability department staff with access to sustainability modules", "dept_name": "Sustainability"}
    ]
    
    for role_data in roles_data:
        dept = dept_map.get(role_data["dept_name"])
        if not dept:
            # Try to find by code as fallback
            dept = db.query(ERPDepartment).filter(ERPDepartment.code == "IT").first()
            if not dept:
                print(f"Department not found for role: {role_data['name']}")
                continue
        
        existing_role = db.query(ERPRole).filter(ERPRole.name == role_data["name"]).first()
        if not existing_role:
            role = ERPRole(
                name=role_data["name"],
                description=role_data["description"],
                departmentId=dept.id
            )
            db.add(role)
            db.flush()
            print(f"Created role: {role_data['name']}")
            
            # Create module access for this role
            dept_short_name = role_data["dept_name"].split(" ")[0]  # Get first word for matrix lookup
            if dept_short_name == "Sales":
                dept_short_name = "Sales"
            elif dept_short_name == "IT":
                dept_short_name = "IT"
            
            for module_key, access_by_dept in MODULE_ACCESS_MATRIX.items():
                access_level = access_by_dept.get(dept_short_name, "Hidden")
                
                if access_level == "Full":
                    can_read = True
                    can_write = True
                    can_export = True
                elif access_level == "Hidden":
                    can_read = False
                    can_write = False
                    can_export = False
                else:  # Read-only
                    can_read = True
                    can_write = False
                    can_export = False
                
                module_access = ModuleAccess(
                    roleId=role.id,
                    moduleKey=module_key,
                    canRead=can_read,
                    canWrite=can_write,
                    canExport=can_export
                )
                db.add(module_access)
            
            print(f"Created module access for role: {role_data['name']}")
        else:
            print(f"Role already exists: {role_data['name']}")
    
    db.commit()

def create_ceo_user(db: Session):
    """Create CEO user account"""
    # Get IT department for CEO (or create a special CEO department)
    it_dept = db.query(ERPDepartment).filter(ERPDepartment.code == "IT").first()
    
    if not it_dept:
        print("Warning: IT department not found, creating it for CEO")
        it_dept = ERPDepartment(name="IT / System", code="IT")
        db.add(it_dept)
        db.flush()
    
    # Create CEO role
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
        for module_key in MODULE_ACCESS_MATRIX.keys():
            module_access = ModuleAccess(
                roleId=ceo_role.id,
                moduleKey=module_key,
                canRead=True,
                canWrite=True,
                canExport=True
            )
            db.add(module_access)
        
        print("Created CEO role with full module access")
    
    # Create CEO user
    existing_ceo = db.query(ERPUser).filter(ERPUser.username == "ceo").first()
    if not existing_ceo:
        ceo_user = ERPUser(
            username="ceo",
            passwordHash=pwd_context.hash("admin123"),  # Default password - should be changed
            fullName="Chief Executive Officer",
            email="ceo@company.com",
            roleId=ceo_role.id,
            departmentId=it_dept.id,
            isActive=True,
            isCEO=True
        )
        db.add(ceo_user)
        print("Created CEO user (username: ceo, password: admin123)")
    else:
        print("CEO user already exists")
    
    db.commit()

def main():
    """Main seeding function"""
    print("Starting RBAC seeding...")
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    print("Database tables created/verified")
    
    db = SessionLocal()
    
    try:
        # Seed departments
        print("\n=== Seeding Departments ===")
        seed_departments(db)
        
        # Seed roles and permissions
        print("\n=== Seeding Roles and Module Access ===")
        seed_roles_and_permissions(db)
        
        # Create CEO user
        print("\n=== Creating CEO User ===")
        create_ceo_user(db)
        
        print("\n✅ RBAC seeding completed successfully!")
        print("\nCEO Login Credentials:")
        print("  Username: ceo")
        print("  Password: admin123")
        print("  IMPORTANT: Change the default password after first login!")
        
    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
