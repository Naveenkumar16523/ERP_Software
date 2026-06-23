"""
RBAC Middleware for Logistics ERP
Enforces module-level access and blocks /admin/* routes for non-CEO users
"""
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError, jwt
import os

from app.utils.db import get_db
from app.models.sql_models import ERPUser, ERPRole, ModuleAccess, ERPDepartment

security = HTTPBearer()

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"

class RBACUser:
    def __init__(self, id: str, username: str, is_ceo: bool, allowed_modules: list, 
                 role_id: str, department_id: str):
        self.id = id
        self.username = username
        self.is_ceo = is_ceo
        self.allowed_modules = allowed_modules
        self.role_id = role_id
        self.department_id = department_id

def get_current_rbac_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> RBACUser:
    """Get current user from JWT token for RBAC system"""
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    user = db.query(ERPUser).filter(ERPUser.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    if not user.isActive:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive"
        )
    
    # Extract allowed_modules from token payload
    allowed_modules = payload.get("allowed_modules", [])
    
    return RBACUser(
        id=user.id,
        username=user.username,
        is_ceo=user.isCEO,
        allowed_modules=allowed_modules,
        role_id=user.roleId,
        department_id=user.departmentId
    )

def require_ceo(current_user: RBACUser = Depends(get_current_rbac_user)):
    """Require CEO role - blocks all non-CEO users"""
    if not current_user.is_ceo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CEO access required"
        )
    return current_user

def require_module_access(module_key: str):
    """Require access to a specific module"""
    def check_access(current_user: RBACUser = Depends(get_current_rbac_user)):
        # CEO has access to all modules
        if current_user.is_ceo:
            return current_user
        
        # Check if module is in allowed_modules
        if "all" not in current_user.allowed_modules and module_key not in current_user.allowed_modules:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access to module '{module_key}' is not permitted"
            )
        
        return current_user
    
    return check_access

def require_admin_route():
    """Block /admin/* routes for non-CEO users"""
    def check_admin(current_user: RBACUser = Depends(get_current_rbac_user)):
        if not current_user.is_ceo:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin panel access is restricted to CEO only"
            )
        return current_user
    
    return check_admin

def require_department_scoped_data():
    """For Analytics Hub - ensure data is scoped to user's department"""
    def check_scope(current_user: RBACUser = Depends(get_current_rbac_user)):
        # CEO sees all departments
        if current_user.is_ceo:
            return {"scope": "all", "department_id": None}
        
        # Employees see only their department
        return {"scope": "department", "department_id": current_user.department_id}
    
    return check_scope
