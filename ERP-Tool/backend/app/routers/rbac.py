"""
RBAC Router - Handles access requests and user management (SQL Version)
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.utils.db import get_db
from app.utils.audit import log_audit_event
from app.models.sql_models import AccessRequest, ERPUser, ERPRole, ERPDepartment
from app.routers.rbac_auth import get_current_user, require_ceo, get_password_hash

router = APIRouter(prefix="/rbac", tags=["RBAC Configuration"])

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

@router.post("/access-request", response_model=AccessRequestResponse, status_code=status.HTTP_201_CREATED)
async def submit_access_request(request: AccessRequestCreate, db: Session = Depends(get_db)):
    """Submit an access request for ERP access"""
    # Check if email already has a pending request
    existing_req = db.query(AccessRequest).filter(
        AccessRequest.email == request.email,
        AccessRequest.status == "pending"
    ).first()
    
    if existing_req:
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
    
    new_request = AccessRequest(
        fullName=request.fullName,
        email=request.email,
        department=request.department,
        reason=request.reason,
        status="pending"
    )
    
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    
    return new_request

@router.get("/access-requests", response_model=List[AccessRequestResponse])
async def list_access_requests(
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

@router.post("/access-requests/{request_id}/approve")
async def approve_access_request(
    http_req: Request,
    request_id: str,
    approval_data: AccessRequestApprove,
    current_user: ERPUser = Depends(require_ceo),
    db: Session = Depends(get_db)
):
    """Approve an access request and create user account"""
    access_request = db.query(AccessRequest).filter(AccessRequest.id == request_id).first()
    if not access_request:
        raise HTTPException(status_code=404, detail="Access request not found")

    if access_request.status != "pending":
        raise HTTPException(status_code=400, detail="This request has already been processed")

    # Verify role exists
    role = db.query(ERPRole).filter(ERPRole.id == approval_data.roleId).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    # Check if username is taken
    if db.query(ERPUser).filter(ERPUser.username == approval_data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    # Check if email already belongs to a user
    if db.query(ERPUser).filter(ERPUser.email == access_request.email).first():
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    # Create user account
    user = ERPUser(
        username=approval_data.username,
        passwordHash=get_password_hash(approval_data.password),
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

    await log_audit_event("USER_CREATE", "User", f"Created user {user.username} from access request {request_id}", current_user.id, http_req)

    return {
        "message": "Access request approved and user account created",
        "userId": user.id,
        "username": user.username
    }

@router.post("/access-requests/{request_id}/deny")
async def deny_access_request(
    request_id: str,
    deny_data: AccessRequestDeny,
    current_user: ERPUser = Depends(require_ceo),
    db: Session = Depends(get_db)
):
    """Deny an access request"""
    access_request = db.query(AccessRequest).filter(AccessRequest.id == request_id).first()
    if not access_request:
        raise HTTPException(status_code=404, detail="Access request not found")

    if access_request.status != "pending":
        raise HTTPException(status_code=400, detail="This request has already been processed")

    access_request.status = "denied"
    access_request.denialReason = deny_data.denialReason
    access_request.reviewedBy = current_user.id
    access_request.reviewedAt = datetime.utcnow()
    
    db.commit()

    return {"message": "Access request denied"}

@router.get("/departments", response_model=List[dict])
async def list_departments(db: Session = Depends(get_db)):
    """List all departments"""
    departments = db.query(ERPDepartment).all()
    return [{"id": d.id, "name": d.name, "code": d.code} for d in departments]

@router.get("/roles", response_model=List[dict])
async def list_roles(department_id: Optional[str] = None, db: Session = Depends(get_db)):
    """List all roles, optionally filtered by department"""
    query = db.query(ERPRole)
    if department_id:
        query = query.filter(ERPRole.departmentId == department_id)
    
    roles = query.all()
    return [{"id": r.id, "name": r.name, "description": r.description, "departmentId": r.departmentId} for r in roles]
