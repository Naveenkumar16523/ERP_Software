"""
RBAC Authentication Router - Unified login for CEO and employees with JWT tokens
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import List, Optional
import os

from app.utils.db import get_db
from app.models.models import ERPUser, ERPRole, ModuleAccess, ERPDepartment
from passlib.context import CryptContext
from jose import JWTError, jwt

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_MINUTES = 60 * 24  # 24 hours

# Schemas
class Login(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict
    permissions: List[dict]

class UserResponse(BaseModel):
    id: str
    username: str
    fullName: str
    email: str
    roleId: str
    roleName: str
    departmentId: str
    departmentName: str
    isActive: bool
    isCEO: bool

# Helper functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=JWT_EXPIRATION_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_user_permissions(user_id: str, db: Session) -> List[dict]:
    """Get module permissions for a user based on their role"""
    user = db.query(ERPUser).filter(ERPUser.id == user_id).first()
    if not user:
        return []
    
    module_access = db.query(ModuleAccess).filter(ModuleAccess.roleId == user.roleId).all()
    
    return [
        {
            "moduleKey": access.moduleKey,
            "canRead": access.canRead,
            "canWrite": access.canWrite,
            "canExport": access.canExport
        }
        for access in module_access
    ]

def get_allowed_modules(user_id: str, db: Session) -> List[str]:
    """Get list of module keys the user has access to"""
    user = db.query(ERPUser).filter(ERPUser.id == user_id).first()
    if not user:
        return []
    
    # CEO has access to all modules
    if user.isCEO:
        return ["all"]
    
    # Get modules where canRead is True
    module_access = db.query(ModuleAccess).filter(
        ModuleAccess.roleId == user.roleId,
        ModuleAccess.canRead == True
    ).all()
    
    return [access.moduleKey for access in module_access]

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    """Dependency to get current user from JWT token"""
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
    
    return user

def require_ceo(current_user: ERPUser = Depends(get_current_user)):
    """Dependency to require CEO role"""
    if not current_user.isCEO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CEO access required"
        )
    return current_user

def require_module_access(module_key: str, permission: str = "canRead"):
    """Dependency factory to require specific module access"""
    def check_access(
        current_user: ERPUser = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        # CEO has access to everything
        if current_user.isCEO:
            return current_user
        
        # Check module access
        module_access = db.query(ModuleAccess).filter(
            ModuleAccess.roleId == current_user.roleId,
            ModuleAccess.moduleKey == module_key
        ).first()
        
        if not module_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"No access to module: {module_key}"
            )
        
        # Check specific permission
        if permission == "canRead" and not module_access.canRead:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Read permission required"
            )
        elif permission == "canWrite" and not module_access.canWrite:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Write permission required"
            )
        elif permission == "canExport" and not module_access.canExport:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Export permission required"
            )
        
        return current_user
    
    return check_access

def require_read_only_or_full(module_key: str, method: str = "GET"):
    """Dependency factory to enforce read-only access for modules with read-only permissions"""
    def check_access(
        current_user: ERPUser = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        # CEO has access to everything
        if current_user.isCEO:
            return current_user
        
        # Check module access
        module_access = db.query(ModuleAccess).filter(
            ModuleAccess.roleId == current_user.roleId,
            ModuleAccess.moduleKey == module_key
        ).first()
        
        if not module_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"No access to module: {module_key}"
            )
        
        # For read-only modules, only allow GET requests
        if not module_access.canWrite and method not in ["GET", "HEAD", "OPTIONS"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Read-only access: write operations not permitted"
            )
        
        return current_user
    
    return check_access

# Endpoints

@router.post("/reset-ceo")
def reset_ceo_password(secret: str, db: Session = Depends(get_db)):
    """
    Emergency CEO password reset endpoint.
    Protected by RESET_SECRET environment variable.
    Call: POST /api/v1/auth/reset-ceo?secret=<RESET_SECRET>
    """
    RESET_SECRET = os.getenv("RESET_SECRET", "clarix-reset-2024")
    if secret != RESET_SECRET:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid reset secret")

    try:
        from app.models.models import Base
        from app.utils.db import engine
        Base.metadata.create_all(bind=engine)

        # Ensure departments exist
        finance_dept = db.query(ERPDepartment).filter(ERPDepartment.code == "FIN").first()
        if not finance_dept:
            finance_dept = ERPDepartment(name="Finance", code="FIN")
            db.add(finance_dept)
            db.flush()

        # Ensure CEO/superadmin role exists
        ceo_role = db.query(ERPRole).filter(ERPRole.name.in_(["superadmin", "ceo"])).first()
        if not ceo_role:
            ceo_role = ERPRole(
                name="superadmin",
                description="CEO / Superadmin with full access",
                departmentId=finance_dept.id
            )
            db.add(ceo_role)
            db.flush()

            # Add all module access
            all_modules = [
                "dashboard", "finance", "human_resources", "inventory", "manufacturing",
                "procurement", "crm_pipeline", "payroll", "fixed_assets", "projects",
                "supply_chain", "ecommerce", "analytics_hub", "banking", "healthcare",
                "education", "sustainability", "marketing", "security", "migration_hub", "rpa_automation"
            ]
            for m in all_modules:
                db.add(ModuleAccess(roleId=ceo_role.id, moduleKey=m, canRead=True, canWrite=True, canExport=True))

        # Create or reset CEO user
        ceo_user = db.query(ERPUser).filter(ERPUser.username == "ceo").first()
        new_hash = pwd_context.hash("admin123")

        if ceo_user:
            ceo_user.passwordHash = new_hash
            ceo_user.isActive = True
            ceo_user.isCEO = True
            ceo_user.roleId = ceo_role.id
            action = "reset"
        else:
            ceo_user = ERPUser(
                username="ceo",
                passwordHash=new_hash,
                fullName="CEO",
                email="ceo@company.com",
                roleId=ceo_role.id,
                departmentId=finance_dept.id,
                isActive=True,
                isCEO=True
            )
            db.add(ceo_user)
            action = "created"

        db.commit()
        return {
            "status": "success",
            "action": action,
            "username": "ceo",
            "password": "admin123",
            "message": f"CEO user {action} successfully. Login with username: ceo, password: admin123"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Reset failed: {str(e)}")

@router.get("/registration-status")
def get_registration_status(db: Session = Depends(get_db)):
    """Check if registration is enabled (no users exist)"""
    from sqlalchemy import func
    try:
        count = db.query(func.count(ERPUser.id)).scalar()
        return {"registrationEnabled": count == 0}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Internal Server Error", "message": str(e)}
        )

@router.post("/login", response_model=TokenResponse)
def login(credentials: Login, db: Session = Depends(get_db)):
    """Unified login - accepts both CEO and regular employees (by username OR email)"""
    # Try matching by username first, then fall back to email lookup
    user = db.query(ERPUser).filter(ERPUser.username == credentials.username).first()
    if not user:
        user = db.query(ERPUser).filter(ERPUser.email == credentials.username).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    if not verify_password(credentials.password, user.passwordHash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    if not user.isActive:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is inactive"
        )
    
    # Get user details
    role = db.query(ERPRole).filter(ERPRole.id == user.roleId).first()
    department = db.query(ERPDepartment).filter(ERPDepartment.id == user.departmentId).first()
    
    # Get permissions
    permissions = get_user_permissions(user.id, db)
    
    # Get allowed modules list
    allowed_modules = get_allowed_modules(user.id, db)
    
    # Create JWT token with actual isCEO status and allowed_modules
    access_token = create_access_token(
        data={
            "sub": user.id,
            "username": user.username,
            "isCEO": user.isCEO,
            "roleId": user.roleId,
            "departmentId": user.departmentId,
            "allowed_modules": allowed_modules
        }
    )
    
    return TokenResponse(
        access_token=access_token,
        user={
            "id": user.id,
            "username": user.username,
            "fullName": user.fullName,
            "email": user.email,
            "roleId": user.roleId,
            "roleName": role.name if role else "",
            "departmentId": user.departmentId,
            "departmentName": department.name if department else "",
            "isActive": user.isActive,
            "isCEO": user.isCEO,
            "allowed_modules": allowed_modules
        },
        permissions=permissions
    )

@router.get("/me", response_model=dict)
def get_current_user_info(current_user: ERPUser = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current user information"""
    role = db.query(ERPRole).filter(ERPRole.id == current_user.roleId).first()
    department = db.query(ERPDepartment).filter(ERPDepartment.id == current_user.departmentId).first()
    permissions = get_user_permissions(current_user.id, db)
    allowed_modules = get_allowed_modules(current_user.id, db)
    
    return {
        "id": current_user.id,
        "username": current_user.username,
        "fullName": current_user.fullName,
        "email": current_user.email,
        "roleId": current_user.roleId,
        "roleName": role.name if role else "",
        "departmentId": current_user.departmentId,
        "departmentName": department.name if department else "",
        "isActive": current_user.isActive,
        "isCEO": current_user.isCEO,
        "allowed_modules": allowed_modules,
        "permissions": permissions
    }

@router.post("/logout")
def logout():
    """Logout endpoint (client-side token deletion)"""
    return {"message": "Logged out successfully"}

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@router.post("/change-password")
def change_password(
    password_data: ChangePasswordRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Allow users to change their own password - accessible to all authenticated users"""
    try:
        # Decode JWT to get user ID
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
    
    # Get user from database
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
    
    # Verify current password
    if not verify_password(password_data.current_password, user.passwordHash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect"
        )
    
    # Hash new password
    new_password_hash = pwd_context.hash(password_data.new_password)
    
    # Update password
    user.passwordHash = new_password_hash
    user.updatedAt = datetime.utcnow()
    db.commit()
    
    return {"message": "Password changed successfully"}
