"""
Admin Panel Router for CEO (MongoDB Version)
Routes: /admin/dashboard, /admin/users, /admin/users/create, /admin/permissions
Only accessible by CEO (isCEO = true)
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import secrets
import string

from app.utils.db import get_db
from app.utils.mongodb import get_mongo_db
from app.utils.audit import log_audit_event
from app.models.mongo_models import ERPUserModel, ERPRoleModel, ModuleAccessModel, ERPDepartmentModel
from app.routers.rbac_auth import require_ceo
from passlib.context import CryptContext

router = APIRouter(prefix="/admin", tags=["Admin Panel"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Schemas
class UserCreateRequest(BaseModel):
    full_name: str
    email: str
    department_id: str
    role_id: str

class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    department_id: Optional[str] = None
    role_id: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(BaseModel):
    id: str
    username: str
    full_name: str
    email: str
    role_id: str
    role_name: str
    department_id: str
    department_name: str
    is_active: bool
    is_ceo: bool
    created_at: datetime

class AdminDashboardStats(BaseModel):
    total_employees: int
    active_employees: int
    inactive_employees: int
    employees_by_department: dict
    recent_users: List[UserResponse]

# Helper functions
def generate_username(full_name: str) -> str:
    """Generate username from full name with random 3 digits"""
    name_parts = full_name.lower().split()
    if len(name_parts) >= 2:
        username = f"{name_parts[0]}.{name_parts[1]}"
    else:
        username = name_parts[0]
    username += f"{secrets.randbelow(1000):03d}"
    return username

def generate_password(length: int = 12) -> str:
    """Generate secure random password"""
    alphabet = string.ascii_letters + string.digits + string.punctuation
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def get_default_password() -> str:
    """Get default password for new users"""
    return "Welcome123"

# Routes

@router.get("/dashboard", response_model=AdminDashboardStats)
async def get_admin_dashboard(current_user: dict = Depends(require_ceo), mongo_db = Depends(get_mongo_db)):
    """Admin dashboard with statistics"""
    if mongo_db is None:
        raise HTTPException(status_code=500, detail="MongoDB not connected")
        
    total_employees = await mongo_db.erp_users.count_documents({"isCEO": False})
    active_employees = await mongo_db.erp_users.count_documents({"isCEO": False, "isActive": True})
    inactive_employees = total_employees - active_employees
    
    employees_by_department = {}
    departments = await mongo_db.erp_departments.find().to_list(length=None)
    for dept in departments:
        count = await mongo_db.erp_users.count_documents({"departmentId": dept["id"], "isCEO": False})
        if count > 0:
            employees_by_department[dept["name"]] = count
            
    recent_users_cursor = mongo_db.erp_users.find({"isCEO": False}).sort("createdAt", -1).limit(5)
    recent_users = await recent_users_cursor.to_list(length=5)
    
    recent_users_response = []
    for user in recent_users:
        role = await mongo_db.erp_roles.find_one({"id": user.get("roleId")})
        dept = await mongo_db.erp_departments.find_one({"id": user.get("departmentId")})
        recent_users_response.append(UserResponse(
            id=user["id"],
            username=user.get("username", ""),
            full_name=user.get("fullName", ""),
            email=user.get("email", ""),
            role_id=user.get("roleId", ""),
            role_name=role["name"] if role else "",
            department_id=user.get("departmentId", ""),
            department_name=dept["name"] if dept else "",
            is_active=user.get("isActive", True),
            is_ceo=user.get("isCEO", False),
            created_at=user.get("createdAt", datetime.utcnow())
        ))
        
    return AdminDashboardStats(
        total_employees=total_employees,
        active_employees=active_employees,
        inactive_employees=inactive_employees,
        employees_by_department=employees_by_department,
        recent_users=recent_users_response
    )

@router.get("/users", response_model=List[UserResponse])
async def get_all_users(current_user: dict = Depends(require_ceo), mongo_db = Depends(get_mongo_db)):
    """Get all users (excluding CEO)"""
    if mongo_db is None: raise HTTPException(status_code=500, detail="Database connection failed")
    users = await mongo_db.erp_users.find({"isCEO": False}).to_list(length=None)
    
    user_responses = []
    for user in users:
        role = await mongo_db.erp_roles.find_one({"id": user.get("roleId")})
        dept = await mongo_db.erp_departments.find_one({"id": user.get("departmentId")})
        user_responses.append(UserResponse(
            id=user["id"],
            username=user.get("username", ""),
            full_name=user.get("fullName", ""),
            email=user.get("email", ""),
            role_id=user.get("roleId", ""),
            role_name=role["name"] if role else "",
            department_id=user.get("departmentId", ""),
            department_name=dept["name"] if dept else "",
            is_active=user.get("isActive", True),
            is_ceo=user.get("isCEO", False),
            created_at=user.get("createdAt", datetime.utcnow())
        ))
    return user_responses

@router.post("/users/create")
async def create_user(http_req: Request, user_data: UserCreateRequest, current_user: dict = Depends(require_ceo), mongo_db = Depends(get_mongo_db)):
    """Create a new employee account with default password"""
    if mongo_db is None: raise HTTPException(status_code=500, detail="Database connection failed")
    
    department = await mongo_db.erp_departments.find_one({"id": user_data.department_id})
    if not department: raise HTTPException(status_code=404, detail="Department not found")
    
    role = await mongo_db.erp_roles.find_one({"id": user_data.role_id})
    if not role: raise HTTPException(status_code=404, detail="Role not found")
    
    username = generate_username(user_data.full_name)
    password = get_default_password()
    password_hash = pwd_context.hash(password)
    
    while await mongo_db.erp_users.find_one({"username": username}):
        username = generate_username(user_data.full_name)
        
    new_user = ERPUserModel(
        username=username,
        passwordHash=password_hash,
        fullName=user_data.full_name,
        email=user_data.email,
        roleId=user_data.role_id,
        departmentId=user_data.department_id,
        isActive=True,
        isCEO=False
    ).model_dump()
    
    await mongo_db.erp_users.insert_one(new_user)
    
    await log_audit_event("USER_CREATE", "User", f"Created user {username}", current_user.get("id"), http_req)
    
    return {
        "message": "User created successfully",
        "user": {
            "id": new_user["id"],
            "username": username,
            "full_name": new_user["fullName"],
            "email": new_user["email"],
            "password": password
        }
    }

@router.put("/users/{user_id}")
async def update_user(http_req: Request, user_id: str, user_data: UserUpdateRequest, current_user: dict = Depends(require_ceo), mongo_db = Depends(get_mongo_db)):
    """Update user details"""
    if mongo_db is None: raise HTTPException(status_code=500, detail="Database connection failed")
    user = await mongo_db.erp_users.find_one({"id": user_id})
    if not user: raise HTTPException(status_code=404, detail="User not found")
    if user.get("isCEO"): raise HTTPException(status_code=403, detail="Cannot modify CEO account")
    
    updates = {"updatedAt": datetime.utcnow()}
    if user_data.full_name is not None: updates["fullName"] = user_data.full_name
    if user_data.email is not None: updates["email"] = user_data.email
    if user_data.department_id is not None:
        if not await mongo_db.erp_departments.find_one({"id": user_data.department_id}):
            raise HTTPException(status_code=404, detail="Department not found")
        updates["departmentId"] = user_data.department_id
    if user_data.role_id is not None:
        if not await mongo_db.erp_roles.find_one({"id": user_data.role_id}):
            raise HTTPException(status_code=404, detail="Role not found")
        updates["roleId"] = user_data.role_id
    if user_data.is_active is not None: updates["isActive"] = user_data.is_active
        
    await mongo_db.erp_users.update_one({"id": user_id}, {"$set": updates})
    
    await log_audit_event("USER_UPDATE", "User", f"Updated user {user_id}", current_user.get("id"), http_req)
    if user_data.role_id is not None:
        await log_audit_event("ROLE_ASSIGN", "Role", f"Assigned role {user_data.role_id} to user {user_id}", current_user.get("id"), http_req)
        
    return {"message": "User updated successfully"}

@router.delete("/users/{user_id}")
async def delete_user(http_req: Request, user_id: str, current_user: dict = Depends(require_ceo), mongo_db = Depends(get_mongo_db)):
    """Delete user permanently"""
    if mongo_db is None: raise HTTPException(status_code=500, detail="Database connection failed")
    user = await mongo_db.erp_users.find_one({"id": user_id})
    if not user: raise HTTPException(status_code=404, detail="User not found")
    if user.get("isCEO"): raise HTTPException(status_code=403, detail="Cannot delete CEO account")
    
    await mongo_db.erp_users.delete_one({"id": user_id})
    await log_audit_event("USER_DELETE", "User", f"Deleted user {user_id}", current_user.get("id"), http_req)
    return {"message": "User deleted successfully"}

@router.post("/users/{user_id}/reset-password")
async def reset_user_password(user_id: str, current_user: dict = Depends(require_ceo), mongo_db = Depends(get_mongo_db)):
    """Reset user password and generate new one"""
    if mongo_db is None: raise HTTPException(status_code=500, detail="Database connection failed")
    user = await mongo_db.erp_users.find_one({"id": user_id})
    if not user: raise HTTPException(status_code=404, detail="User not found")
    if user.get("isCEO"): raise HTTPException(status_code=403, detail="Cannot reset CEO password")
    
    new_password = generate_password()
    await mongo_db.erp_users.update_one(
        {"id": user_id}, 
        {"$set": {"passwordHash": pwd_context.hash(new_password), "updatedAt": datetime.utcnow()}}
    )
    
    return {
        "message": "Password reset successfully",
        "username": user.get("username"),
        "new_password": new_password
    }

@router.get("/permissions")
async def get_permission_matrix(current_user: dict = Depends(require_ceo), mongo_db = Depends(get_mongo_db)):
    """Get full permission matrix (read-only)"""
    if mongo_db is None: raise HTTPException(status_code=500, detail="Database connection failed")
    roles = await mongo_db.erp_roles.find().to_list(length=None)
    
    modules = [
        "dashboard", "finance", "human_resources", "inventory", "manufacturing",
        "procurement", "crm_pipeline", "payroll", "fixed_assets", "projects",
        "supply_chain", "ecommerce", "analytics_hub", "banking", "healthcare",
        "education", "sustainability", "marketing", "security", "migration_hub",
        "rpa_automation"
    ]
    
    permission_matrix = {}
    for role in roles:
        module_access = await mongo_db.module_access.find({"roleId": role["id"]}).to_list(length=None)
        role_permissions = {}
        for access in module_access:
            role_permissions[access["moduleKey"]] = {
                "can_read": access.get("canRead", True),
                "can_write": access.get("canWrite", False),
                "can_export": access.get("canExport", False)
            }
        permission_matrix[role["name"]] = {
            "role_id": role["id"],
            "department_id": role.get("departmentId"),
            "modules": role_permissions
        }
        
    return {"modules": modules, "roles": permission_matrix}

class PermissionToggleRequest(BaseModel):
    role_id: str
    module_key: str
    can_access: bool

@router.patch("/permissions")
async def toggle_permission(http_req: Request, request: PermissionToggleRequest, current_user: dict = Depends(require_ceo), mongo_db = Depends(get_mongo_db)):
    """Toggle module access for a role (CEO only)."""
    if mongo_db is None: raise HTTPException(status_code=500, detail="Database connection failed")
    
    if request.role_id == "role_superadmin":
        raise HTTPException(status_code=403, detail="Cannot modify CEO permissions")
    if request.module_key == "dashboard":
        raise HTTPException(status_code=403, detail="Dashboard is always ON for all roles")
        
    role = await mongo_db.erp_roles.find_one({"id": request.role_id})
    if not role: raise HTTPException(status_code=404, detail="Role not found")
    
    module_access = await mongo_db.module_access.find_one({
        "roleId": request.role_id,
        "moduleKey": request.module_key
    })
    
    if module_access:
        await mongo_db.module_access.update_one(
            {"id": module_access["id"]},
            {"$set": {
                "canRead": request.can_access,
                "canWrite": request.can_access,
                "canExport": request.can_access
            }}
        )
    else:
        new_access = ModuleAccessModel(
            roleId=request.role_id,
            moduleKey=request.module_key,
            canRead=request.can_access,
            canWrite=request.can_access,
            canExport=request.can_access
        ).model_dump()
        await mongo_db.module_access.insert_one(new_access)
        
    await log_audit_event("MODULE_ACCESS_UPDATE", "ModuleAccess", f"Updated module {request.module_key} access for role {request.role_id}", current_user.get("id"), http_req)
        
    return await get_permission_matrix(current_user, mongo_db)

@router.get("/departments")
async def get_departments(current_user: dict = Depends(require_ceo), mongo_db = Depends(get_mongo_db)):
    """Get all departments for user creation form"""
    if mongo_db is None: raise HTTPException(status_code=500, detail="Database connection failed")
    departments = await mongo_db.erp_departments.find().to_list(length=None)
    return [{"id": d["id"], "name": d["name"], "code": d["code"]} for d in departments]

@router.get("/roles")
async def get_roles(current_user: dict = Depends(require_ceo), mongo_db = Depends(get_mongo_db)):
    """Get all roles for user creation form"""
    if mongo_db is None: raise HTTPException(status_code=500, detail="Database connection failed")
    roles = await mongo_db.erp_roles.find().to_list(length=None)
    return [{"id": r["id"], "name": r["name"], "description": r.get("description"), "department_id": r.get("departmentId")} for r in roles]
