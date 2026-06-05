"""
RBAC Router - Handles access requests and user management
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
import secrets
import string

from app.utils.db import get_db
from app.models.models import AccessRequest, ERPUser, ERPRole, ERPDepartment, ModuleAccess
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
def generate_unique_username(full_name: str, db: Session) -> str:
    base_username = full_name.lower().replace(" ", ".")
    username = base_username
    counter = 1
    
    while db.query(ERPUser).filter(ERPUser.username == username).first():
        username = f"{base_username}.{counter}"
        counter += 1
    
    return username

# Helper function to generate random password
def generate_password(length=12) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    password = ''.join(secrets.choice(alphabet) for i in range(length))
    return password

@router.post("/access-request", response_model=AccessRequestResponse, status_code=status.HTTP_201_CREATED)
def submit_access_request(request: AccessRequestCreate, db: Session = Depends(get_db)):
    """Submit an access request for ERP access"""
    # Check if email already has a pending request
    existing = db.query(AccessRequest).filter(
        AccessRequest.email == request.email,
        AccessRequest.status == "pending"
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a pending access request"
    )
    
    # Check if user already exists
    existing_user = db.query(ERPUser).filter(ERPUser.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists"
    )
    
    access_request = AccessRequest(
        fullName=request.fullName,
        email=request.email,
        department=request.department,
        reason=request.reason,
        status="pending"
    )
    
    db.add(access_request)
    db.commit()
    db.refresh(access_request)
    
    return access_request

@router.get("/access-requests", response_model=List[AccessRequestResponse])
def list_access_requests(
    status_filter: Optional[str] = None,
    current_user: ERPUser = Depends(require_ceo),
    db: Session = Depends(get_db)
):
    """List all access requests (CEO only)"""
    query = db.query(AccessRequest)
    
    if status_filter:
        query = query.filter(AccessRequest.status == status_filter)
    
    requests = query.order_by(AccessRequest.createdAt.desc()).all()
    return requests

@router.get("/access-requests/{request_id}", response_model=AccessRequestResponse)
def get_access_request(request_id: str, db: Session = Depends(get_db)):
    """Get a specific access request"""
    request = db.query(AccessRequest).filter(AccessRequest.id == request_id).first()
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Access request not found"
        )
    return request

@router.post("/access-requests/{request_id}/approve")
def approve_access_request(
    request_id: str,
    approval_data: AccessRequestApprove,
    current_user: ERPUser = Depends(require_ceo),
    db: Session = Depends(get_db)
):
    """Approve an access request and create user account"""
    access_request = db.query(AccessRequest).filter(AccessRequest.id == request_id).first()
    if not access_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Access request not found"
        )

    if access_request.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This request has already been processed"
        )

    # Verify role exists
    role = db.query(ERPRole).filter(ERPRole.id == approval_data.roleId).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )

    # Check if username is taken
    if db.query(ERPUser).filter(ERPUser.username == approval_data.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    # Check if email already belongs to an ERPUser
    if db.query(ERPUser).filter(ERPUser.email == access_request.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists"
        )

    # Create user account
    user = ERPUser(
        username=approval_data.username,
        passwordHash=pwd_context.hash(approval_data.password),
        fullName=access_request.fullName,
        email=access_request.email,
        roleId=approval_data.roleId,
        departmentId=role.departmentId,
        isActive=True,
        isCEO=False
    )

    db.add(user)

    # Update access request
    access_request.status = "approved"
    access_request.reviewedBy = current_user.id
    access_request.reviewedAt = datetime.utcnow()

    db.commit()

    return {
        "message": "Access request approved and user account created",
        "userId": user.id,
        "username": user.username
    }

@router.post("/access-requests/{request_id}/deny")
def deny_access_request(
    request_id: str,
    deny_data: AccessRequestDeny,
    current_user: ERPUser = Depends(require_ceo),
    db: Session = Depends(get_db)
):
    """Deny an access request"""
    access_request = db.query(AccessRequest).filter(AccessRequest.id == request_id).first()
    if not access_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Access request not found"
        )

    if access_request.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This request has already been processed"
        )

    access_request.status = "denied"
    access_request.denialReason = deny_data.denialReason
    access_request.reviewedBy = current_user.id
    access_request.reviewedAt = datetime.utcnow()

    db.commit()

    return {"message": "Access request denied"}

@router.get("/departments", response_model=List[dict])
def list_departments(db: Session = Depends(get_db)):
    """List all departments"""
    departments = db.query(ERPDepartment).all()
    return [
        {
            "id": dept.id,
            "name": dept.name,
            "code": dept.code
        }
        for dept in departments
    ]

@router.get("/roles", response_model=List[dict])
def list_roles(department_id: Optional[str] = None, db: Session = Depends(get_db)):
    """List all roles, optionally filtered by department"""
    query = db.query(ERPRole)
    
    if department_id:
        query = query.filter(ERPRole.departmentId == department_id)
    
    roles = query.all()
    return [
        {
            "id": role.id,
            "name": role.name,
            "description": role.description,
            "departmentId": role.departmentId
        }
        for role in roles
    ]

@router.get("/roles/{role_id}/modules", response_model=List[dict])
def get_role_modules(role_id: str, db: Session = Depends(get_db)):
    """Get module access for a specific role"""
    module_access = db.query(ModuleAccess).filter(ModuleAccess.roleId == role_id).all()
    return [
        {
            "moduleKey": access.moduleKey,
            "canRead": access.canRead,
            "canWrite": access.canWrite,
            "canExport": access.canExport
        }
        for access in module_access
    ]

@router.get("/users", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db)):
    """List all users (CEO only)"""
    users = db.query(ERPUser).all()
    return users

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Create a new user (CEO only)"""
    # Check if username exists
    if db.query(ERPUser).filter(ERPUser.username == user_data.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Check if email exists
    if db.query(ERPUser).filter(ERPUser.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
    )
    
    user = ERPUser(
        username=user_data.username,
        passwordHash=pwd_context.hash(user_data.password),
        fullName=user_data.fullName,
        email=user_data.email,
        roleId=user_data.roleId,
        departmentId=user_data.departmentId,
        isActive=True,
        isCEO=False
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user

@router.put("/users/{user_id}/activate")
def activate_user(user_id: str, db: Session = Depends(get_db)):
    """Activate a user account"""
    user = db.query(ERPUser).filter(ERPUser.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.isActive = True
    db.commit()
    
    return {"message": "User activated"}

@router.put("/users/{user_id}/deactivate")
def deactivate_user(user_id: str, db: Session = Depends(get_db)):
    """Deactivate a user account"""
    user = db.query(ERPUser).filter(ERPUser.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.isActive = False
    db.commit()
    
    return {"message": "User deactivated"}
