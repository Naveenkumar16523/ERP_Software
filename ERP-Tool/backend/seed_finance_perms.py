import os
import sys

# Add the backend directory to Python path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.utils.db import SessionLocal
from app.models.models import Permission, RolePermission, Role
import uuid

def generate_uuid():
    return str(uuid.uuid4())

db = SessionLocal()

try:
    print("Seeding finance permissions...")
    # 1. Insert 'finance:read' and 'finance:write'
    for perm_name in ['finance:read', 'finance:write']:
        perm = db.query(Permission).filter(Permission.name == perm_name).first()
        if not perm:
            perm = Permission(id=generate_uuid(), name=perm_name, description=f"Permission for {perm_name}")
            db.add(perm)
            print(f"Added permission: {perm_name}")

    db.commit()

    # 2. Grant to CEO role
    ceo_role = db.query(Role).filter(Role.name == 'CEO').first()
    if ceo_role:
        print("Found CEO role, assigning permissions...")
        for perm_name in ['finance:read', 'finance:write']:
            perm = db.query(Permission).filter(Permission.name == perm_name).first()
            if perm:
                rp = db.query(RolePermission).filter(RolePermission.roleId == ceo_role.id, RolePermission.permissionId == perm.id).first()
                if not rp:
                    rp = RolePermission(id=generate_uuid(), roleId=ceo_role.id, permissionId=perm.id)
                    db.add(rp)
                    print(f"Assigned {perm_name} to CEO role")
        db.commit()
    else:
        print("CEO role not found.")

    print("Permissions seeded successfully!")
finally:
    db.close()
