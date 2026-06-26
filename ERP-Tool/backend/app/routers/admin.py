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
from app.models.sql_models import ERPUser
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
            "role_name": u.roleId,
            "department_name": u.departmentId,
            "is_active": u.isActive,
            "is_ceo": u.isCEO,
            "createdAt": u.createdAt
        })
    return result

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(http_req: Request, user_data: UserCreate, current_user: ERPUser = Depends(require_ceo), db: Session = Depends(get_db)):
    """Create a new user directly (CEO only)"""
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
    
    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.fullName,
        "email": user.email,
        "role_name": user.roleId,
        "department_name": user.departmentId,
        "is_active": user.isActive,
        "is_ceo": user.isCEO,
        "createdAt": user.createdAt,
        "password": password
    }

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

@router.get("/dashboard")
async def get_admin_dashboard(current_user: ERPUser = Depends(require_ceo), db: Session = Depends(get_db)):
    """Get system metrics for the admin dashboard"""
    users = db.query(ERPUser).all()
    
    total_users = len(users)
    active_users = sum(1 for u in users if u.isActive)
    inactive_users = total_users - active_users
    
    dept_counts = {}
    for u in users:
        dept = u.departmentId or 'Unassigned'
        dept_counts[dept] = dept_counts.get(dept, 0) + 1
        
    recent = sorted(users, key=lambda x: x.createdAt, reverse=True)[:5]
    recent_users = []
    for u in recent:
        recent_users.append({
            "id": u.id,
            "username": u.username,
            "full_name": u.fullName,
            "role_name": u.roleId,
            "is_active": u.isActive
        })
        
    return {
        "total_employees": total_users,
        "active_employees": active_users,
        "inactive_employees": inactive_users,
        "employees_by_department": dept_counts,
        "recent_users": recent_users
    }

# --- Static References for Admin Panel to Avoid 404 Errors ---

DEMO_DEPARTMENTS = [
  { "id": 'dept_finance', "name": 'Finance' }, { "id": 'dept_hr', "name": 'Human Resources' },
  { "id": 'dept_operations', "name": 'Operations' }, { "id": 'dept_sales', "name": 'Sales & Marketing' },
  { "id": 'dept_it', "name": 'IT / System' }, { "id": 'dept_sustainability', "name": 'Sustainability' },
]

DEMO_ROLES = [
  { "id": 'role_finance_staff', "name": 'finance_staff' }, { "id": 'role_hr_staff', "name": 'hr_staff' },
  { "id": 'role_operations_staff', "name": 'operations_staff' }, { "id": 'role_sales_staff', "name": 'sales_staff' },
  { "id": 'role_it_staff', "name": 'it_staff' }, { "id": 'role_sustainability_staff', "name": 'sustainability_staff' },
]

ALL_MODULES = [
  'dashboard', 'finance', 'human_resources', 'inventory', 'manufacturing',
  'procurement', 'crm_pipeline', 'payroll', 'fixed_assets', 'projects',
  'supply_chain', 'ecommerce', 'analytics_hub', 'banking', 'healthcare',
  'education', 'sustainability', 'marketing', 'security', 'migration_hub', 'rpa_automation'
]

ROLE_PERMS = {
  "finance_staff":       ['dashboard','finance','banking','analytics_hub'],
  "hr_staff":            ['dashboard','human_resources','payroll','healthcare','education'],
  "operations_staff":    ['dashboard','inventory','manufacturing','supply_chain','procurement','fixed_assets','projects'],
  "sales_staff":         ['dashboard','crm_pipeline','ecommerce','marketing','analytics_hub'],
  "it_staff":            ['dashboard','security','migration_hub','rpa_automation','analytics_hub'],
  "sustainability_staff":['dashboard','sustainability','analytics_hub'],
  "superadmin":          ALL_MODULES,
}

DEMO_PERMISSIONS = {
  "modules": ALL_MODULES,
  "roles": {
      r["name"]: {
          "role_id": r["id"],
          "department_id": "dept_finance",
          "modules": {
              m: {
                  "can_read": m in ROLE_PERMS.get(r["name"], []),
                  "can_write": m in ROLE_PERMS.get(r["name"], []),
                  "can_export": m in ROLE_PERMS.get(r["name"], []),
              } for m in ALL_MODULES
          }
      } for r in DEMO_ROLES
  }
}

@router.get("/departments")
async def get_departments(current_user: ERPUser = Depends(require_ceo)):
    return DEMO_DEPARTMENTS

@router.get("/roles")
async def get_roles(current_user: ERPUser = Depends(require_ceo)):
    return DEMO_ROLES

@router.get("/permissions")
async def get_permissions(current_user: ERPUser = Depends(require_ceo)):
    return DEMO_PERMISSIONS

@router.patch("/permissions")
async def toggle_permission(payload: dict, current_user: ERPUser = Depends(require_ceo)):
    # Dummy implementation for UI to not crash
    return DEMO_PERMISSIONS
