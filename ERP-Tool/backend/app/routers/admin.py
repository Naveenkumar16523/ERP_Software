"""
Admin Panel Router for CEO
Routes: /admin/dashboard, /admin/users, /admin/users/create, /admin/permissions
Only accessible by CEO (isCEO = true)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import secrets
import string

from app.utils.db import get_db
from app.models.models import ERPUser, ERPRole, ModuleAccess, ERPDepartment, Employee, Department
from app.middlewares.rbac_middleware import require_ceo, RBACUser
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
    # Remove special characters and spaces, convert to lowercase
    name_parts = full_name.lower().split()
    if len(name_parts) >= 2:
        username = f"{name_parts[0]}.{name_parts[1]}"
    else:
        username = name_parts[0]
    
    # Add random 3 digits
    username += f"{secrets.randbelow(1000):03d}"
    return username

def generate_password(length: int = 12) -> str:
    """Generate secure random password"""
    alphabet = string.ascii_letters + string.digits + string.punctuation
    password = ''.join(secrets.choice(alphabet) for _ in range(length))
    return password

def get_default_password() -> str:
    """Get default password for new users"""
    return "Welcome123"  # Default password that users can change later

# Routes

@router.get("/dashboard", response_model=AdminDashboardStats)
def get_admin_dashboard(current_user: RBACUser = Depends(require_ceo), db: Session = Depends(get_db)):
    """Admin dashboard with statistics"""
    # Get all users except CEO
    users = db.query(ERPUser).filter(ERPUser.isCEO == False).all()
    
    # Count employees using Employee database table
    total_employees = db.query(Employee).count()
    active_employees = db.query(Employee).filter(Employee.isActive == True).count()
    inactive_employees = total_employees - active_employees
    
    # Count by department using Employee and Department database tables
    employees_by_department = {}
    departments = db.query(Department).all()
    for dept in departments:
        count = db.query(Employee).filter(Employee.departmentId == dept.id).count()
        if count > 0:
            employees_by_department[dept.name] = count
    
    # Get recent users (last 5 created)
    recent_users = db.query(ERPUser).order_by(ERPUser.createdAt.desc()).limit(5).all()
    recent_users_response = []
    for user in recent_users:
        role = db.query(ERPRole).filter(ERPRole.id == user.roleId).first()
        dept = db.query(ERPDepartment).filter(ERPDepartment.id == user.departmentId).first()
        recent_users_response.append(UserResponse(
            id=user.id,
            username=user.username,
            full_name=user.fullName,
            email=user.email,
            role_id=user.roleId,
            role_name=role.name if role else "",
            department_id=user.departmentId,
            department_name=dept.name if dept else "",
            is_active=user.isActive,
            is_ceo=user.isCEO,
            created_at=user.createdAt
        ))
    
    return AdminDashboardStats(
        total_employees=total_employees,
        active_employees=active_employees,
        inactive_employees=inactive_employees,
        employees_by_department=employees_by_department,
        recent_users=recent_users_response
    )

@router.get("/users", response_model=List[UserResponse])
def get_all_users(current_user: RBACUser = Depends(require_ceo), db: Session = Depends(get_db)):
    """Get all users (excluding CEO)"""
    users = db.query(ERPUser).filter(ERPUser.isCEO == False).all()
    
    user_responses = []
    for user in users:
        role = db.query(ERPRole).filter(ERPRole.id == user.roleId).first()
        dept = db.query(ERPDepartment).filter(ERPDepartment.id == user.departmentId).first()
        user_responses.append(UserResponse(
            id=user.id,
            username=user.username,
            full_name=user.fullName,
            email=user.email,
            role_id=user.roleId,
            role_name=role.name if role else "",
            department_id=user.departmentId,
            department_name=dept.name if dept else "",
            is_active=user.isActive,
            is_ceo=user.isCEO,
            created_at=user.createdAt
        ))
    
    return user_responses

@router.post("/users/create")
def create_user(user_data: UserCreateRequest, current_user: RBACUser = Depends(require_ceo), db: Session = Depends(get_db)):
    """Create a new employee account with default password"""
    # Verify department exists
    department = db.query(ERPDepartment).filter(ERPDepartment.id == user_data.department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Verify role exists
    role = db.query(ERPRole).filter(ERPRole.id == user_data.role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Generate username and use default password
    username = generate_username(user_data.full_name)
    password = get_default_password()
    password_hash = pwd_context.hash(password)
    
    # Check if username already exists (regenerate if needed)
    while db.query(ERPUser).filter(ERPUser.username == username).first():
        username = generate_username(user_data.full_name)
    
    # Create user
    new_user = ERPUser(
        username=username,
        passwordHash=password_hash,
        fullName=user_data.full_name,
        email=user_data.email,
        roleId=user_data.role_id,
        departmentId=user_data.department_id,
        isActive=True,
        isCEO=False
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "message": "User created successfully",
        "user": {
            "id": new_user.id,
            "username": username,
            "full_name": new_user.fullName,
            "email": new_user.email,
            "password": password  # Return default password for user
        }
    }

@router.put("/users/{user_id}")
def update_user(user_id: str, user_data: UserUpdateRequest, current_user: RBACUser = Depends(require_ceo), db: Session = Depends(get_db)):
    """Update user details"""
    user = db.query(ERPUser).filter(ERPUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent modifying CEO
    if user.isCEO:
        raise HTTPException(status_code=403, detail="Cannot modify CEO account")
    
    # Update fields if provided
    if user_data.full_name is not None:
        user.fullName = user_data.full_name
    if user_data.email is not None:
        user.email = user_data.email
    if user_data.department_id is not None:
        department = db.query(ERPDepartment).filter(ERPDepartment.id == user_data.department_id).first()
        if not department:
            raise HTTPException(status_code=404, detail="Department not found")
        user.departmentId = user_data.department_id
    if user_data.role_id is not None:
        role = db.query(ERPRole).filter(ERPRole.id == user_data.role_id).first()
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        user.roleId = user_data.role_id
    if user_data.is_active is not None:
        user.isActive = user_data.is_active
    
    user.updatedAt = datetime.utcnow()
    db.commit()
    
    return {"message": "User updated successfully"}

@router.delete("/users/{user_id}")
def delete_user(user_id: str, current_user: RBACUser = Depends(require_ceo), db: Session = Depends(get_db)):
    """Delete user permanently"""
    user = db.query(ERPUser).filter(ERPUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent deleting CEO
    if user.isCEO:
        raise HTTPException(status_code=403, detail="Cannot delete CEO account")
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}

@router.post("/users/{user_id}/reset-password")
def reset_user_password(user_id: str, current_user: RBACUser = Depends(require_ceo), db: Session = Depends(get_db)):
    """Reset user password and generate new one"""
    user = db.query(ERPUser).filter(ERPUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent resetting CEO password
    if user.isCEO:
        raise HTTPException(status_code=403, detail="Cannot reset CEO password")
    
    # Generate new password
    new_password = generate_password()
    user.passwordHash = pwd_context.hash(new_password)
    user.updatedAt = datetime.utcnow()
    db.commit()
    
    return {
        "message": "Password reset successfully",
        "username": user.username,
        "new_password": new_password  # Return for email sending
    }

@router.get("/permissions")
def get_permission_matrix(current_user: RBACUser = Depends(require_ceo), db: Session = Depends(get_db)):
    """Get full permission matrix (read-only)"""
    # Get all roles
    roles = db.query(ERPRole).all()
    
    # Get all modules
    modules = [
        "dashboard", "finance", "human_resources", "inventory", "manufacturing",
        "procurement", "crm_pipeline", "payroll", "fixed_assets", "projects",
        "supply_chain", "ecommerce", "analytics_hub", "banking", "healthcare",
        "education", "sustainability", "marketing", "security", "migration_hub",
        "rpa_automation"
    ]
    
    # Build permission matrix
    permission_matrix = {}
    for role in roles:
        module_access = db.query(ModuleAccess).filter(ModuleAccess.roleId == role.id).all()
        role_permissions = {}
        for access in module_access:
            role_permissions[access.moduleKey] = {
                "can_read": access.canRead,
                "can_write": access.canWrite,
                "can_export": access.canExport
            }
        permission_matrix[role.name] = {
            "role_id": role.id,
            "department_id": role.departmentId,
            "modules": role_permissions
        }
    
    return {
        "modules": modules,
        "roles": permission_matrix
    }

class PermissionToggleRequest(BaseModel):
    role_id: str
    module_key: str
    can_access: bool

@router.patch("/permissions")
def toggle_permission(
    request: PermissionToggleRequest,
    current_user: RBACUser = Depends(require_ceo),
    db: Session = Depends(get_db)
):
    """
    Toggle module access for a role (CEO only).
    Body: { role_id: "finance_staff", module_key: "inventory", can_access: true }
    """
    # Prevent modifying superadmin (CEO) permissions
    if request.role_id == "role_superadmin":
        raise HTTPException(status_code=403, detail="Cannot modify CEO permissions")
    
    # Dashboard is always ON for all roles
    if request.module_key == "dashboard":
        raise HTTPException(status_code=403, detail="Dashboard is always ON for all roles")
    
    # Check if role exists
    role = db.query(ERPRole).filter(ERPRole.id == request.role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Update or create module access
    module_access = db.query(ModuleAccess).filter(
        ModuleAccess.roleId == request.role_id,
        ModuleAccess.moduleKey == request.module_key
    ).first()
    
    if module_access:
        module_access.canRead = request.can_access
        module_access.canWrite = request.can_access
        module_access.canExport = request.can_access
    else:
        module_access = ModuleAccess(
            roleId=request.role_id,
            moduleKey=request.module_key,
            canRead=request.can_access,
            canWrite=request.can_access,
            canExport=request.can_access
        )
        db.add(module_access)
    
    db.commit()
    
    # Return updated permission matrix
    return get_permission_matrix(current_user, db)

@router.get("/departments")
def get_departments(current_user: RBACUser = Depends(require_ceo), db: Session = Depends(get_db)):
    """Get all departments for user creation form"""
    departments = db.query(ERPDepartment).all()
    return [
        {
            "id": dept.id,
            "name": dept.name,
            "code": dept.code
        }
        for dept in departments
    ]

@router.get("/roles")
def get_roles(current_user: RBACUser = Depends(require_ceo), db: Session = Depends(get_db)):
    """Get all roles for user creation form"""
    roles = db.query(ERPRole).all()
    return [
        {
            "id": role.id,
            "name": role.name,
            "description": role.description,
            "department_id": role.departmentId
        }
        for role in roles
    ]
