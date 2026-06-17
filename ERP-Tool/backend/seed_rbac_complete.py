"""
Complete RBAC Seed Script (MongoDB Version)
Creates departments, roles, module access, and CEO user with exact permissions
"""

import asyncio
import os
import sys
from passlib.context import CryptContext
from motor.motor_asyncio import AsyncIOMotorClient

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/erp_database")
DB_NAME = os.getenv("MONGO_DB_NAME", "erp_database")

# Exact 21 modules as specified
MODULES = [
    "dashboard", "finance", "human_resources", "inventory", "manufacturing",
    "procurement", "crm_pipeline", "payroll", "fixed_assets", "projects",
    "supply_chain", "ecommerce", "analytics_hub", "banking", "healthcare",
    "education", "sustainability", "marketing", "security", "migration_hub",
    "rpa_automation"
]

ROLE_MODULE_PERMISSIONS = {
    "finance_staff": ["dashboard", "finance", "banking", "analytics_hub"],
    "hr_staff": ["dashboard", "human_resources", "payroll", "healthcare", "education"],
    "operations_staff": ["dashboard", "inventory", "manufacturing", "supply_chain", "procurement", "fixed_assets", "projects"],
    "sales_staff": ["dashboard", "crm_pipeline", "ecommerce", "marketing", "analytics_hub"],
    "it_staff": ["dashboard", "security", "migration_hub", "rpa_automation", "analytics_hub"],
    "sustainability_staff": ["dashboard", "sustainability", "analytics_hub"],
    "superadmin": MODULES  # CEO gets all 21 modules
}

DEPARTMENTS = [
    {"id": "dept_finance", "name": "Finance", "code": "FIN"},
    {"id": "dept_hr", "name": "Human Resources", "code": "HR"},
    {"id": "dept_operations", "name": "Operations", "code": "OPS"},
    {"id": "dept_sales", "name": "Sales & Marketing", "code": "SLS"},
    {"id": "dept_it", "name": "IT / System", "code": "IT"},
    {"id": "dept_sustainability", "name": "Sustainability", "code": "SUS"}
]

ROLES = [
    {"id": "role_finance_staff", "name": "finance_staff", "description": "Finance Department Staff", "departmentId": "dept_finance"},
    {"id": "role_hr_staff", "name": "hr_staff", "description": "Human Resources Department Staff", "departmentId": "dept_hr"},
    {"id": "role_operations_staff", "name": "operations_staff", "description": "Operations Department Staff", "departmentId": "dept_operations"},
    {"id": "role_sales_staff", "name": "sales_staff", "description": "Sales & Marketing Department Staff", "departmentId": "dept_sales"},
    {"id": "role_it_staff", "name": "it_staff", "description": "IT / System Department Staff", "departmentId": "dept_it"},
    {"id": "role_sustainability_staff", "name": "sustainability_staff", "description": "Sustainability Department Staff", "departmentId": "dept_sustainability"},
    {"id": "role_superadmin", "name": "superadmin", "description": "CEO / Superadmin with full access", "departmentId": "dept_finance"}
]

async def seed_departments(db):
    print("=== Seeding Departments ===")
    for dept_data in DEPARTMENTS:
        existing = await db.erp_departments.find_one({"id": dept_data["id"]})
        if not existing:
            await db.erp_departments.insert_one(dept_data)
            print(f"  Created department: {dept_data['name']}")
        else:
            print(f"  Department already exists: {dept_data['name']}")

async def seed_roles_and_permissions(db):
    print("\n=== Seeding Roles and Module Access ===")
    for role_data in ROLES:
        existing = await db.erp_roles.find_one({"id": role_data["id"]})
        if not existing:
            await db.erp_roles.insert_one(role_data)
            print(f"  Created role: {role_data['name']}")
        else:
            print(f"  Role already exists: {role_data['name']}")
            
        # Set module access
        await db.module_access.delete_many({"roleId": role_data["id"]})
        allowed_modules = ROLE_MODULE_PERMISSIONS.get(role_data["name"], [])
        
        access_docs = []
        for module_key in MODULES:
            can_access = module_key in allowed_modules
            access_docs.append({
                "roleId": role_data["id"],
                "moduleKey": module_key,
                "canRead": can_access,
                "canWrite": can_access,
                "canExport": can_access
            })
            
        if access_docs:
            await db.module_access.insert_many(access_docs)
        print(f"    Set {len(allowed_modules)} module permissions for role: {role_data['name']}")

async def create_ceo_user(db):
    print("\n=== Creating CEO User ===")
    existing_ceo = await db.erp_users.find_one({"username": "ceo"})
    
    ceo_data = {
        "id": "user_ceo",
        "username": "ceo",
        "passwordHash": pwd_context.hash("admin123"),
        "fullName": "CEO",
        "email": "ceo@company.com",
        "roleId": "role_superadmin",
        "departmentId": "dept_finance",
        "isActive": True,
        "isCEO": True
    }
    
    if not existing_ceo:
        await db.erp_users.insert_one(ceo_data)
        print("  Created CEO user (ceo / admin123)")
    else:
        await db.erp_users.update_one({"username": "ceo"}, {"$set": ceo_data})
        print("  Updated CEO user (ceo / admin123)")

async def main():
    print("Starting MongoDB RBAC Seeding...")
    print("=" * 60)
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    try:
        await seed_departments(db)
        await seed_roles_and_permissions(db)
        await create_ceo_user(db)
        
        print("\n" + "=" * 60)
        print("✅ Complete RBAC seeding finished successfully!")
    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())
