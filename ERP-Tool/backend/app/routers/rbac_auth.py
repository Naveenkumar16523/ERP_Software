"""
Authentication Router - Handles Login, Token Generation, and CEO Reset (SQL Version)
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import jwt
import os

from app.utils.db import get_db
from app.utils.audit import log_audit_event
from app.models.sql_models import ERPUser, ERPRole, ERPDepartment, RefreshToken

router = APIRouter(prefix="/auth", tags=["Authentication"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-key")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    accessToken: str
    refreshToken: str
    user: dict

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    user = db.query(ERPUser).filter(ERPUser.id == user_id).first()
    if user is None or not user.isActive:
        raise credentials_exception
        
    return user

async def require_ceo(current_user: ERPUser = Depends(get_current_user)):
    if not current_user.isCEO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CEO privileges required for this action"
        )
    return current_user

@router.post("/login", response_model=LoginResponse)
async def login(req: Request, credentials: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(ERPUser).filter(ERPUser.username == credentials.username).first()
    if not user or not verify_password(credentials.password, user.passwordHash):
        await log_audit_event("LOGIN_FAILED", "Auth", f"Failed login attempt for {credentials.username}", req=req)
        raise HTTPException(status_code=401, detail="Invalid username or password")
        
    if not user.isActive:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    # Generate tokens
    access_token = create_access_token(data={"sub": user.id})
    
    import secrets
    refresh_token_str = secrets.token_urlsafe(64)
    
    new_rt = RefreshToken(
        userId=user.id,
        token=refresh_token_str,
        expiresAt=datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(new_rt)
    db.commit()

    await log_audit_event("LOGIN_SUCCESS", "Auth", "User logged in", user.id, req)

    return {
        "accessToken": access_token,
        "refreshToken": refresh_token_str,
        "user": {
            "id": user.id,
            "username": user.username,
            "fullName": user.fullName,
            "roleId": user.roleId,
            "departmentId": user.departmentId,
            "isCEO": user.isCEO
        }
    }

class ResetCEORequest(BaseModel):
    resetSecret: str
    ceoPassword: str

@router.post("/reset-ceo")
async def reset_ceo(req: Request, data: ResetCEORequest, db: Session = Depends(get_db)):
    expected_secret = os.getenv("RESET_SECRET", "emergency-reset-2024")
    if data.resetSecret != expected_secret:
        raise HTTPException(status_code=403, detail="Invalid reset secret")

    # Ensure Exec department and CEO role exist
    dept = db.query(ERPDepartment).filter(ERPDepartment.code == "EXEC").first()
    if not dept:
        dept = ERPDepartment(name="Executive Management", code="EXEC")
        db.add(dept)
        db.commit()
        db.refresh(dept)

    role = db.query(ERPRole).filter(ERPRole.name == "CEO").first()
    if not role:
        role = ERPRole(name="CEO", description="Chief Executive Officer", departmentId=dept.id)
        db.add(role)
        db.commit()
        db.refresh(role)

    # Check if CEO exists
    ceo = db.query(ERPUser).filter(ERPUser.isCEO == True).first()
    if ceo:
        ceo.passwordHash = get_password_hash(data.ceoPassword)
        ceo.isActive = True
        db.commit()
        await log_audit_event("CEO_RESET", "Auth", "CEO password was reset", ceo.id, req)
        return {"message": "Existing CEO account password has been reset"}
    else:
        new_ceo = ERPUser(
            username="ceo",
            email="ceo@company.com",
            passwordHash=get_password_hash(data.ceoPassword),
            fullName="Chief Executive Officer",
            roleId=role.id,
            departmentId=dept.id,
            isActive=True,
            isCEO=True
        )
        db.add(new_ceo)
        db.commit()
        await log_audit_event("CEO_CREATED", "Auth", "CEO account was created", new_ceo.id, req)
        return {"message": "New CEO account has been created"}
