"""
RBAC Router - Handles access requests and user management (MongoDB Version)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
import secrets
import string

from app.utils.mongodb import get_mongo_db
from app.models.mongo_models import AccessRequestModel, ERPUserModel
from app.routers.rbac_auth import get_current_user, require_ceo
from passlib.context import CryptContext

router = APIRouter(prefix="/api/v1/rbac", tags=["RBAC"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Schemas
class AccessRequestCreate(BaseModel):
    fullName: str
    email: EmailStr
    department: str
    reason: str

class AccessRequestResponse(BaseModel):
    id: str
    fullName: str
    email: str
    department: str
    reason: str
    status: str
    reviewedBy: Optional[str] = None
    reviewedAt: Optional[datetime] = None
    createdAt: datetime

class AccessRequestApprove(BaseModel):
    roleId: str
    username: str
    password: str

class AccessRequestDeny(BaseModel):
    denialReason: Optional[str] = None

class UserCreate(BaseModel):
    fullName: str
    email: EmailStr
    username: str
    password: str
    roleId: str
    departmentId: str

class UserResponse(BaseModel):
    id: str
    username: str
    fullName: str
    email: str
    roleId: str
    departmentId: str
    isActive: bool
    isCEO: bool
    createdAt: datetime

# Helper function to generate username
async def generate_unique_username(full_name: str, db) -> str:
    base_username = full_name.lower().replace(" ", ".")
    username = base_username
    counter = 1
    
    while await db.erp_users.find_one({"username": username}):
        username = f"{base_username}.{counter}"
        counter += 1
    
    return username

# Helper function to generate random password
def generate_password(length=12) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    password = ''.join(secrets.choice(alphabet) for i in range(length))
    return password

@router.post("/access-request", response_model=AccessRequestResponse, status_code=status.HTTP_201_CREATED)
async def submit_access_request(request: AccessRequestCreate, db = Depends(get_mongo_db)):
    """Submit an access request for ERP access"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    # Check if email already has a pending request
    existing = await db.access_requests.find_one({
        "email": request.email,
        "status": "pending"
    })
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a pending access request"
        )
    
    # Check if user already exists
    existing_user = await db.erp_users.find_one({"email": request.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists"
        )
    
    access_request = AccessRequestModel(
        fullName=request.fullName,
        email=request.email,
        department=request.department,
        reason=request.reason,
        status="pending"
    ).model_dump()
    
    await db.access_requests.insert_one(access_request)
    
    return access_request

@router.get("/access-requests", response_model=List[AccessRequestResponse])
async def list_access_requests(
    status_filter: Optional[str] = None,
    current_user: dict = Depends(require_ceo),
    db = Depends(get_mongo_db)
):
    """List all access requests (CEO only)"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    query = {}
    if status_filter:
        query["status"] = status_filter
    
    requests = await db.access_requests.find(query).sort("createdAt", -1).to_list(length=None)
    return requests

@router.get("/access-requests/{request_id}", response_model=AccessRequestResponse)
async def get_access_request(request_id: str, db = Depends(get_mongo_db)):
    """Get a specific access request"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    request = await db.access_requests.find_one({"id": request_id})
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Access request not found"
        )
    return request

@router.post("/access-requests/{request_id}/approve")
async def approve_access_request(
    request_id: str,
    approval_data: AccessRequestApprove,
    current_user: dict = Depends(require_ceo),
    db = Depends(get_mongo_db)
):
    """Approve an access request and create user account"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    access_request = await db.access_requests.find_one({"id": request_id})
    if not access_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Access request not found"
        )

    if access_request["status"] != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This request has already been processed"
        )

    # Verify role exists
    role = await db.erp_roles.find_one({"id": approval_data.roleId})
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )

    # Check if username is taken
    if await db.erp_users.find_one({"username": approval_data.username}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    # Check if email already belongs to an ERPUser
    if await db.erp_users.find_one({"email": access_request["email"]}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists"
        )

    # Create user account
    user = ERPUserModel(
        username=approval_data.username,
        passwordHash=pwd_context.hash(approval_data.password),
        fullName=access_request["fullName"],
        email=access_request["email"],
        roleId=approval_data.roleId,
        departmentId=role["departmentId"],
        isActive=True,
        isCEO=False
    ).model_dump()

    await db.erp_users.insert_one(user)

    # Update access request
    await db.access_requests.update_one(
        {"id": request_id},
        {"$set": {
            "status": "approved",
            "reviewedBy": current_user["id"],
            "reviewedAt": datetime.utcnow()
        }}
    )

    return {
        "message": "Access request approved and user account created",
        "userId": user["id"],
        "username": user["username"]
    }

@router.post("/access-requests/{request_id}/deny")
async def deny_access_request(
    request_id: str,
    deny_data: AccessRequestDeny,
    current_user: dict = Depends(require_ceo),
    db = Depends(get_mongo_db)
):
    """Deny an access request"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    access_request = await db.access_requests.find_one({"id": request_id})
    if not access_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Access request not found"
        )

    if access_request["status"] != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This request has already been processed"
        )

    await db.access_requests.update_one(
        {"id": request_id},
        {"$set": {
            "status": "denied",
            "denialReason": deny_data.denialReason,
            "reviewedBy": current_user["id"],
            "reviewedAt": datetime.utcnow()
        }}
    )

    return {"message": "Access request denied"}

@router.get("/departments", response_model=List[dict])
async def list_departments(db = Depends(get_mongo_db)):
    """List all departments"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    departments = await db.erp_departments.find().to_list(length=None)
    return [
        {
            "id": dept["id"],
            "name": dept["name"],
            "code": dept["code"]
        }
        for dept in departments
    ]

@router.get("/roles", response_model=List[dict])
async def list_roles(department_id: Optional[str] = None, db = Depends(get_mongo_db)):
    """List all roles, optionally filtered by department"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    query = {}
    if department_id:
        query["departmentId"] = department_id
    
    roles = await db.erp_roles.find(query).to_list(length=None)
    return [
        {
            "id": role["id"],
            "name": role["name"],
            "description": role.get("description"),
            "departmentId": role["departmentId"]
        }
        for role in roles
    ]

@router.get("/roles/{role_id}/modules", response_model=List[dict])
async def get_role_modules(role_id: str, db = Depends(get_mongo_db)):
    """Get module access for a specific role"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    module_access = await db.module_access.find({"roleId": role_id}).to_list(length=None)
    return [
        {
            "moduleKey": access["moduleKey"],
            "canRead": access.get("canRead", True),
            "canWrite": access.get("canWrite", False),
            "canExport": access.get("canExport", False)
        }
        for access in module_access
    ]

@router.get("/users", response_model=List[UserResponse])
async def list_users(db = Depends(get_mongo_db)):
    """List all users (CEO only)"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    users = await db.erp_users.find().to_list(length=None)
    return users

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user_data: UserCreate, db = Depends(get_mongo_db)):
    """Create a new user (CEO only)"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    # Check if username exists
    if await db.erp_users.find_one({"username": user_data.username}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Check if email exists
    if await db.erp_users.find_one({"email": user_data.email}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    user = ERPUserModel(
        username=user_data.username,
        passwordHash=pwd_context.hash(user_data.password),
        fullName=user_data.fullName,
        email=user_data.email,
        roleId=user_data.roleId,
        departmentId=user_data.departmentId,
        isActive=True,
        isCEO=False
    ).model_dump()
    
    await db.erp_users.insert_one(user)
    
    return user

@router.put("/users/{user_id}/activate")
async def activate_user(user_id: str, db = Depends(get_mongo_db)):
    """Activate a user account"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    result = await db.erp_users.update_one(
        {"id": user_id},
        {"$set": {"isActive": True}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {"message": "User activated"}

@router.put("/users/{user_id}/deactivate")
async def deactivate_user(user_id: str, db = Depends(get_mongo_db)):
    """Deactivate a user account"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    result = await db.erp_users.update_one(
        {"id": user_id},
        {"$set": {"isActive": False}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {"message": "User deactivated"}
