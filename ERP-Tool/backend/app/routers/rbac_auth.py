"""
RBAC Authentication Router - Unified login for CEO and employees with JWT tokens (MongoDB Version)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import List, Optional
import os

from app.utils.mongodb import get_mongo_db
from app.models.mongo_models import ERPUserModel, ERPRoleModel, ModuleAccessModel, ERPDepartmentModel
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

async def get_user_permissions(user_id: str, db) -> List[dict]:
    """Get module permissions for a user based on their role"""
    user = await db.erp_users.find_one({"id": user_id})
    if not user:
        return []
    
    module_access = await db.module_access.find({"roleId": user["roleId"]}).to_list(length=None)
    
    return [
        {
            "moduleKey": access["moduleKey"],
            "canRead": access.get("canRead", True),
            "canWrite": access.get("canWrite", False),
            "canExport": access.get("canExport", False)
        }
        for access in module_access
    ]

async def get_allowed_modules(user_id: str, db) -> List[str]:
    """Get list of module keys the user has access to"""
    user = await db.erp_users.find_one({"id": user_id})
    if not user:
        return []
    
    # CEO has access to all modules
    if user.get("isCEO", False):
        return ["all"]
    
    # Get modules where canRead is True
    module_access = await db.module_access.find({
        "roleId": user["roleId"],
        "canRead": True
    }).to_list(length=None)
    
    return [access["moduleKey"] for access in module_access]

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db = Depends(get_mongo_db)):
    """Dependency to get current user from JWT token"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
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
    
    user = await db.erp_users.find_one({"id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    if not user.get("isActive", True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive"
        )
    
    return user

async def require_ceo(current_user: dict = Depends(get_current_user)):
    """Dependency to require CEO role"""
    if not current_user.get("isCEO", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CEO access required"
        )
    return current_user

def require_module_access(module_key: str, permission: str = "canRead"):
    """Dependency factory to require specific module access"""
    async def check_access(
        current_user: dict = Depends(get_current_user),
        db = Depends(get_mongo_db)
    ):
        if db is None:
            raise HTTPException(status_code=500, detail="Database connection failed")
        # CEO has access to everything
        if current_user.get("isCEO", False):
            return current_user
        
        # Check module access
        module_access = await db.module_access.find_one({
            "roleId": current_user["roleId"],
            "moduleKey": module_key
        })
        
        if not module_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"No access to module: {module_key}"
            )
        
        # Check specific permission
        if permission == "canRead" and not module_access.get("canRead", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Read permission required"
            )
        elif permission == "canWrite" and not module_access.get("canWrite", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Write permission required"
            )
        elif permission == "canExport" and not module_access.get("canExport", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Export permission required"
            )
        
        return current_user
    
    return check_access

def require_read_only_or_full(module_key: str, method: str = "GET"):
    """Dependency factory to enforce read-only access for modules with read-only permissions"""
    async def check_access(
        current_user: dict = Depends(get_current_user),
        db = Depends(get_mongo_db)
    ):
        if db is None:
            raise HTTPException(status_code=500, detail="Database connection failed")
        # CEO has access to everything
        if current_user.get("isCEO", False):
            return current_user
        
        # Check module access
        module_access = await db.module_access.find_one({
            "roleId": current_user["roleId"],
            "moduleKey": module_key
        })
        
        if not module_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"No access to module: {module_key}"
            )
        
        # For read-only modules, only allow GET requests
        if not module_access.get("canWrite", False) and method not in ["GET", "HEAD", "OPTIONS"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Read-only access: write operations not permitted"
            )
        
        return current_user
    
    return check_access

# Endpoints

@router.post("/reset-ceo")
async def reset_ceo_password(secret: str, db = Depends(get_mongo_db)):
    """
    Emergency CEO password reset endpoint.
    Protected by RESET_SECRET environment variable.
    Call: POST /api/v1/auth/reset-ceo?secret=<RESET_SECRET>
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    RESET_SECRET = os.getenv("RESET_SECRET", "clarix-reset-2024")
    if secret != RESET_SECRET:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid reset secret")

    try:
        # Ensure departments exist
        finance_dept = await db.erp_departments.find_one({"code": "FIN"})
        if not finance_dept:
            finance_dept = ERPDepartmentModel(name="Finance", code="FIN").model_dump()
            await db.erp_departments.insert_one(finance_dept)

        # Ensure CEO/superadmin role exists
        ceo_role = await db.erp_roles.find_one({"name": {"$in": ["superadmin", "ceo"]}})
        if not ceo_role:
            ceo_role = ERPRoleModel(
                name="superadmin",
                description="CEO / Superadmin with full access",
                departmentId=finance_dept["id"]
            ).model_dump()
            await db.erp_roles.insert_one(ceo_role)

            # Add all module access
            all_modules = [
                "dashboard", "finance", "human_resources", "inventory", "manufacturing",
                "procurement", "crm_pipeline", "payroll", "fixed_assets", "projects",
                "supply_chain", "ecommerce", "analytics_hub", "banking", "healthcare",
                "education", "sustainability", "marketing", "security", "migration_hub", "rpa_automation"
            ]
            
            module_access_docs = [
                ModuleAccessModel(
                    roleId=ceo_role["id"], 
                    moduleKey=m, 
                    canRead=True, 
                    canWrite=True, 
                    canExport=True
                ).model_dump()
                for m in all_modules
            ]
            await db.module_access.insert_many(module_access_docs)

        # Create or reset CEO user
        ceo_user = await db.erp_users.find_one({"username": "ceo"})
        new_hash = pwd_context.hash("admin123")

        if ceo_user:
            await db.erp_users.update_one(
                {"id": ceo_user["id"]},
                {"$set": {
                    "passwordHash": new_hash,
                    "isActive": True,
                    "isCEO": True,
                    "roleId": ceo_role["id"]
                }}
            )
            action = "reset"
        else:
            ceo_user = ERPUserModel(
                username="ceo",
                passwordHash=new_hash,
                fullName="CEO",
                email="ceo@company.com",
                roleId=ceo_role["id"],
                departmentId=finance_dept["id"],
                isActive=True,
                isCEO=True
            ).model_dump()
            await db.erp_users.insert_one(ceo_user)
            action = "created"

        return {
            "status": "success",
            "action": action,
            "username": "ceo",
            "password": "admin123",
            "message": f"CEO user {action} successfully. Login with username: ceo, password: admin123"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reset failed: {str(e)}")

@router.get("/registration-status")
async def get_registration_status(db = Depends(get_mongo_db)):
    """Check if registration is enabled (no users exist)"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        count = await db.erp_users.count_documents({})
        return {"registrationEnabled": count == 0}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Internal Server Error", "message": str(e)}
        )

@router.post("/login", response_model=TokenResponse)
async def login(credentials: Login, db = Depends(get_mongo_db)):
    """Unified login - accepts both CEO and regular employees (by username OR email)"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    # Try matching by username first, then fall back to email lookup
    user = await db.erp_users.find_one({"username": credentials.username})
    if not user:
        user = await db.erp_users.find_one({"email": credentials.username})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    if not verify_password(credentials.password, user["passwordHash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    if not user.get("isActive", True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is inactive"
        )
    
    # Get user details
    role = await db.erp_roles.find_one({"id": user["roleId"]})
    department = await db.erp_departments.find_one({"id": user["departmentId"]})
    
    # Get permissions
    permissions = await get_user_permissions(user["id"], db)
    
    # Get allowed modules list
    allowed_modules = await get_allowed_modules(user["id"], db)
    
    # Create JWT token with actual isCEO status and allowed_modules
    access_token = create_access_token(
        data={
            "sub": user["id"],
            "username": user["username"],
            "isCEO": user.get("isCEO", False),
            "roleId": user["roleId"],
            "departmentId": user["departmentId"],
            "allowed_modules": allowed_modules
        }
    )
    
    return TokenResponse(
        access_token=access_token,
        user={
            "id": user["id"],
            "username": user["username"],
            "fullName": user["fullName"],
            "email": user["email"],
            "roleId": user["roleId"],
            "roleName": role["name"] if role else "",
            "departmentId": user["departmentId"],
            "departmentName": department["name"] if department else "",
            "isActive": user.get("isActive", True),
            "isCEO": user.get("isCEO", False),
            "allowed_modules": allowed_modules
        },
        permissions=permissions
    )

@router.get("/me", response_model=dict)
async def get_current_user_info(current_user: dict = Depends(get_current_user), db = Depends(get_mongo_db)):
    """Get current user information"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    role = await db.erp_roles.find_one({"id": current_user["roleId"]})
    department = await db.erp_departments.find_one({"id": current_user["departmentId"]})
    permissions = await get_user_permissions(current_user["id"], db)
    allowed_modules = await get_allowed_modules(current_user["id"], db)
    
    return {
        "id": current_user["id"],
        "username": current_user["username"],
        "fullName": current_user["fullName"],
        "email": current_user["email"],
        "roleId": current_user["roleId"],
        "roleName": role["name"] if role else "",
        "departmentId": current_user["departmentId"],
        "departmentName": department["name"] if department else "",
        "isActive": current_user.get("isActive", True),
        "isCEO": current_user.get("isCEO", False),
        "allowed_modules": allowed_modules,
        "permissions": permissions
    }

@router.post("/logout")
async def logout():
    """Logout endpoint (client-side token deletion)"""
    return {"message": "Logged out successfully"}

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@router.post("/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db = Depends(get_mongo_db)
):
    """Allow users to change their own password - accessible to all authenticated users"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
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
    user = await db.erp_users.find_one({"id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    if not user.get("isActive", True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive"
        )
    
    # Verify current password
    if not verify_password(password_data.current_password, user["passwordHash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect"
        )
    
    # Hash new password
    new_password_hash = pwd_context.hash(password_data.new_password)
    
    # Update password
    await db.erp_users.update_one(
        {"id": user["id"]},
        {"$set": {
            "passwordHash": new_password_hash,
            "updatedAt": datetime.utcnow()
        }}
    )
    
    return {"message": "Password changed successfully"}
