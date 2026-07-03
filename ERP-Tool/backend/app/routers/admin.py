"""
Admin Router - Handles User Management (SQL Version)
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.utils.db import get_db
from app.utils.audit import log_audit_event
from app.models.sql_models import ERPUser, ERPRole, ERPDepartment, ModuleAccess
from app.routers.rbac_auth import require_ceo, get_password_hash

router = APIRouter(prefix="/admin", tags=["Admin Operations"])

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    role_id: str
    department_id: str

class UserResponse(BaseModel):
    id: str
    username: str
    full_name: str
    email: str
    role_name: str
    department_name: str
    is_active: bool
    is_ceo: bool
    createdAt: datetime
    password: str = None

@router.get("/users", response_model=List[UserResponse])
async def list_users(current_user: ERPUser = Depends(require_ceo), db: Session = Depends(get_db)):
    """List all users (CEO only)"""
    users = db.query(ERPUser).all()
    result = []
    for u in users:
        result.append({
            "id": u.id,
            "username": u.username,
            "full_name": u.fullName,
            "email": u.email,
            "role_name": u.role.name if u.role else u.roleId,
            "department_name": u.department.name if u.department else u.departmentId,
            "is_active": u.isActive,
            "is_ceo": u.isCEO,
            "createdAt": u.createdAt
        })
    return result

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(http_req: Request, user_data: UserCreate, current_user: ERPUser = Depends(require_ceo), db: Session = Depends(get_db)):
    """Create a new user directly (CEO only)"""
    try:
        username = user_data.email.split("@")[0].lower() + str(int(datetime.utcnow().timestamp()) % 10000)
        import secrets
        password = secrets.token_urlsafe(8)
        
        if db.query(ERPUser).filter(ERPUser.username == username).first():
            username = username + "x"
            
        if db.query(ERPUser).filter(ERPUser.email == user_data.email).first():
            raise HTTPException(status_code=400, detail="Email already registered")
        
        user = ERPUser(
            username=username,
            passwordHash=get_password_hash(password),
            fullName=user_data.full_name,
            email=user_data.email,
            roleId=user_data.role_id,
            departmentId=user_data.department_id,
            isActive=True,
            isCEO=False
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        await log_audit_event("USER_CREATE", "User", f"Created user {user.username}", current_user.id, http_req)
        
        # We MUST return the dictionary with "user" key wrapper so frontend's result.user.username works
        # BUT response_model=UserResponse doesn't expect a "user" key.
        # Oh, the frontend API probably DOES NOT expect UserResponse directly?
        # Wait, if we return a raw dict, Pydantic will filter it!
        return {
            "id": user.id,
            "username": user.username,
            "full_name": user.fullName,
            "email": user.email,
            "role_name": user.role.name if user.role else user.roleId,
            "department_name": user.department.name if user.department else user.departmentId,
            "is_active": user.isActive,
            "is_ceo": user.isCEO,
            "createdAt": user.createdAt,
            "password": password
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_msg = traceback.format_exc()
        raise HTTPException(status_code=500, detail=error_msg)

@router.put("/users/{user_id}/activate")
async def activate_user(http_req: Request, user_id: str, current_user: ERPUser = Depends(require_ceo), db: Session = Depends(get_db)):
    """Activate a user account"""
    user = db.query(ERPUser).filter(ERPUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.isActive = True
    db.commit()
    
    await log_audit_event("USER_UPDATE", "User", f"Activated user {user_id}", current_user.id, http_req)
    
    return {"message": "User activated"}

@router.put("/users/{user_id}/deactivate")
async def deactivate_user(http_req: Request, user_id: str, current_user: ERPUser = Depends(require_ceo), db: Session = Depends(get_db)):
    """Deactivate a user account"""
    user = db.query(ERPUser).filter(ERPUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.isCEO:
        raise HTTPException(status_code=400, detail="Cannot deactivate the CEO account")
    
    user.isActive = False
    db.commit()
    
    await log_audit_event("USER_UPDATE", "User", f"Deactivated user {user_id}", current_user.id, http_req)
    
    return {"message": "User deactivated"}
@router.post("/users/{user_id}/reset-password")
async def reset_password(http_req: Request, user_id: str, current_user: ERPUser = Depends(require_ceo), db: Session = Depends(get_db)):
    """Reset a user's password (CEO only)"""
    user = db.query(ERPUser).filter(ERPUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    import secrets
    new_password = secrets.token_urlsafe(8)
    user.passwordHash = get_password_hash(new_password)
    db.commit()
    
    await log_audit_event("USER_UPDATE", "User", f"Reset password for user {user.username}", current_user.id, http_req)
    
    return {"message": "Password reset successfully", "new_password": new_password}

@router.get("/dashboard")
async def get_admin_dashboard(current_user: ERPUser = Depends(require_ceo), db: Session = Depends(get_db)):
    """Get system metrics for the admin dashboard"""
    users = db.query(ERPUser).all()
    
    total_users = len(users)
    active_users = sum(1 for u in users if u.isActive)
    inactive_users = total_users - active_users
    
    dept_counts = {}
    for u in users:
        dept = (u.department.name if u.department else u.departmentId) or 'Unassigned'
        dept_counts[dept] = dept_counts.get(dept, 0) + 1
        
    recent = sorted(users, key=lambda x: x.createdAt, reverse=True)[:5]
    recent_users = []
    for u in recent:
        recent_users.append({
            "id": u.id,
            "username": u.username,
            "full_name": u.fullName,
            "role_name": u.role.name if u.role else u.roleId,
            "is_active": u.isActive
        })
        
    return {
        "total_employees": total_users,
        "active_employees": active_users,
        "inactive_employees": inactive_users,
        "employees_by_department": dept_counts,
        "recent_users": recent_users
    }

ALL_MODULES = [
  'dashboard', 'finance', 'human_resources', 'inventory', 'manufacturing',
  'procurement', 'crm_pipeline', 'payroll', 'fixed_assets', 'projects',
  'supply_chain', 'ecommerce', 'analytics_hub', 'banking', 'healthcare',
  'education', 'sustainability', 'marketing', 'security', 'migration_hub', 'rpa_automation',
  'ai_module', 'mobile_module'
]

@router.get("/departments")
async def get_departments(current_user: ERPUser = Depends(require_ceo), db: Session = Depends(get_db)):
    departments = db.query(ERPDepartment).all()
    return [{"id": d.id, "name": d.name, "code": d.code} for d in departments]

@router.get("/roles")
async def get_roles(current_user: ERPUser = Depends(require_ceo), db: Session = Depends(get_db)):
    roles = db.query(ERPRole).all()
    return [{"id": r.id, "name": r.name, "description": r.description} for r in roles]

@router.get("/permissions")
async def get_permissions(current_user: ERPUser = Depends(require_ceo), db: Session = Depends(get_db)):
    roles = db.query(ERPRole).all()
    roles_dict = {}
    for r in roles:
        role_modules = {}
        for m in ALL_MODULES:
            # check if there's a ModuleAccess
            access = next((a for a in r.module_access if a.moduleKey == m), None)
            if access:
                role_modules[m] = {
                    "can_read": access.canRead,
                    "can_write": access.canWrite,
                    "can_export": access.canExport
                }
            else:
                role_modules[m] = {
                    "can_read": False,
                    "can_write": False,
                    "can_export": False
                }
                
        roles_dict[r.name] = {
            "role_id": r.id,
            "department_id": r.departmentId,
            "modules": role_modules
        }
    return {
        "modules": ALL_MODULES,
        "roles": roles_dict
    }

@router.patch("/permissions")
async def toggle_permission(payload: dict, current_user: ERPUser = Depends(require_ceo), db: Session = Depends(get_db)):
    role_id = payload.get("role_id")
    module_key = payload.get("module_key")
    permission_type = payload.get("permission_type") # e.g. "can_read"
    value = payload.get("value")
    
    if not all([role_id, module_key, permission_type]):
        raise HTTPException(status_code=400, detail="Missing required fields")
        
    access = db.query(ModuleAccess).filter(ModuleAccess.roleId == role_id, ModuleAccess.moduleKey == module_key).first()
    if not access:
        access = ModuleAccess(roleId=role_id, moduleKey=module_key, canRead=False, canWrite=False, canExport=False)
        db.add(access)
        
    if permission_type == "can_read":
        access.canRead = value
    elif permission_type == "can_write":
        access.canWrite = value
    elif permission_type == "can_export":
        access.canExport = value
        
    db.commit()
    
    return {"message": "Permission updated successfully"}
