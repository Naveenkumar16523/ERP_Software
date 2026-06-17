import asyncio
import os
import certifi
from pymongo import MongoClient
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def setup_ceo():
    uri = "mongodb+srv://erp_db:Naveen16523%40%23%24@cluster0.wu2gznn.mongodb.net/?appName=Cluster0"
    client = MongoClient(uri, tlsCAFile=certifi.where(), tlsAllowInvalidCertificates=True)
    db = client["erp_database"]

    finance_dept = db.erp_departments.find_one({"code": "FIN"})
    if not finance_dept:
        import uuid
        finance_dept = {
            "id": str(uuid.uuid4()),
            "name": "Finance",
            "code": "FIN"
        }
        db.erp_departments.insert_one(finance_dept)

    ceo_role = db.erp_roles.find_one({"name": {"$in": ["superadmin", "ceo"]}})
    if not ceo_role:
        import uuid
        ceo_role = {
            "id": str(uuid.uuid4()),
            "name": "superadmin",
            "description": "CEO / Superadmin with full access",
            "departmentId": finance_dept["id"]
        }
        db.erp_roles.insert_one(ceo_role)

        all_modules = [
            "dashboard", "finance", "human_resources", "inventory", "manufacturing",
            "procurement", "crm_pipeline", "payroll", "fixed_assets", "projects",
            "supply_chain", "ecommerce", "analytics_hub", "banking", "healthcare",
            "education", "sustainability", "marketing", "security", "migration_hub", "rpa_automation"
        ]
        
        module_access_docs = []
        for m in all_modules:
            module_access_docs.append({
                "id": str(uuid.uuid4()),
                "roleId": ceo_role["id"], 
                "moduleKey": m, 
                "canRead": True, 
                "canWrite": True, 
                "canExport": True
            })
        db.module_access.insert_many(module_access_docs)

    ceo_user = db.erp_users.find_one({"username": "ceo"})
    new_hash = pwd_context.hash("admin123")

    if ceo_user:
        db.erp_users.update_one(
            {"id": ceo_user["id"]},
            {"$set": {
                "passwordHash": new_hash,
                "isActive": True,
                "isCEO": True,
                "roleId": ceo_role["id"]
            }}
        )
        print("CEO user reset successfully")
    else:
        import uuid
        ceo_user = {
            "id": str(uuid.uuid4()),
            "username": "ceo",
            "passwordHash": new_hash,
            "fullName": "CEO",
            "email": "ceo@company.com",
            "roleId": ceo_role["id"],
            "departmentId": finance_dept["id"],
            "isActive": True,
            "isCEO": True
        }
        db.erp_users.insert_one(ceo_user)
        print("CEO user created successfully")

if __name__ == "__main__":
    setup_ceo()
