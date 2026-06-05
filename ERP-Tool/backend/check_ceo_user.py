"""
Debug script to check CEO user in database
"""
from sqlalchemy.orm import Session
from app.utils.db import SessionLocal
from app.models.models import ERPUser, ERPRole
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def check_ceo_user():
    db = SessionLocal()
    
    try:
        # Check for CEO user
        ceo_user = db.query(ERPUser).filter(ERPUser.username == "ceo").first()
        
        if ceo_user:
            print("✅ CEO user found!")
            print(f"  ID: {ceo_user.id}")
            print(f"  Username: {ceo_user.username}")
            print(f"  Full Name: {ceo_user.fullName}")
            print(f"  Email: {ceo_user.email}")
            print(f"  isCEO: {ceo_user.isCEO}")
            print(f"  isActive: {ceo_user.isActive}")
            print(f"  Role ID: {ceo_user.roleId}")
            print(f"  Department ID: {ceo_user.departmentId}")
            
            # Check role
            role = db.query(ERPRole).filter(ERPRole.id == ceo_user.roleId).first()
            if role:
                print(f"  Role Name: {role.name}")
                print(f"  Role Description: {role.description}")
            
            # Test password verification
            test_password = "admin123"
            is_valid = pwd_context.verify(test_password, ceo_user.passwordHash)
            print(f"\n  Password verification (admin123): {is_valid}")
            
            # Show hash
            print(f"  Password Hash: {ceo_user.passwordHash}")
        else:
            print("❌ CEO user NOT found in database!")
            
            # List all users
            all_users = db.query(ERPUser).all()
            print(f"\nTotal users in database: {len(all_users)}")
            for user in all_users:
                print(f"  - {user.username} (isCEO: {user.isCEO}, isActive: {user.isActive})")
            
            # List all roles
            all_roles = db.query(ERPRole).all()
            print(f"\nTotal roles in database: {len(all_roles)}")
            for role in all_roles:
                print(f"  - {role.name}")
    
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_ceo_user()
