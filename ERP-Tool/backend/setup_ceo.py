import asyncio
import os
from dotenv import load_dotenv

# Load .env before any app imports!
load_dotenv()

from app.utils.db import SessionLocal, Base, engine
from app.models.sql_models import ERPDepartment, ERPRole, ERPUser
from app.routers.rbac_auth import get_password_hash

def setup_database():
    print("Connecting to Aiven MySQL...")
    
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")

    db = SessionLocal()
    try:
        # 1. Create Executive Department
        dept = db.query(ERPDepartment).filter(ERPDepartment.code == "EXEC").first()
        if not dept:
            dept = ERPDepartment(name="Executive Management", code="EXEC")
            db.add(dept)
            db.commit()
            db.refresh(dept)
            print("Created Executive Department.")

        # 2. Create CEO Role
        role = db.query(ERPRole).filter(ERPRole.name == "CEO").first()
        if not role:
            role = ERPRole(name="CEO", description="Chief Executive Officer", departmentId=dept.id)
            db.add(role)
            db.commit()
            db.refresh(role)
            print("Created CEO Role.")

        # 3. Create CEO User
        ceo = db.query(ERPUser).filter(ERPUser.isCEO == True).first()
        if not ceo:
            ceo = ERPUser(
                username="ceo",
                email="ceo@company.com",
                passwordHash=get_password_hash("admin123"), # Default password
                fullName="Chief Executive Officer",
                roleId=role.id,
                departmentId=dept.id,
                isActive=True,
                isCEO=True
            )
            db.add(ceo)
            db.commit()
            print("\n✅ SUCCESS! CEO Account Created.")
            print("Username: ceo")
            print("Password: admin123")
            print("You can use these credentials to log in to your ERP frontend.")
        else:
            print("\n✅ CEO Account already exists in the database.")
            
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    setup_database()
