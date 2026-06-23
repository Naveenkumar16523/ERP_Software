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

@router.get("/users", response_model=List[UserResponse])
async def list_users(current_user: ERPUser = Depends(require_ceo), db: Session = Depends(get_db)):
    """List all users (CEO only)"""
    users = db.query(ERPUser).all()
    return users

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(http_req: Request, user_data: UserCreate, current_user: ERPUser = Depends(require_ceo), db: Session = Depends(get_db)):
    """Create a new user directly (CEO only)"""
    if db.query(ERPUser).filter(ERPUser.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    
    if db.query(ERPUser).filter(ERPUser.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = ERPUser(
        username=user_data.username,
        passwordHash=get_password_hash(user_data.password),
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
    
    await log_audit_event("USER_CREATE", "User", f"Created user {user_data.username}", current_user.id, http_req)
    
    return user

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
