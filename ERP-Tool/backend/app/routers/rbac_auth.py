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

@router.get("/registration-status")
def registration_status():
    """
    Mock registration status. RBAC handles registration exclusively via CEO/HR creation.
    """
    return {"registrationEnabled": False}

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-key")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440 # 24 hours for easier testing
REFRESH_TOKEN_EXPIRE_DAYS = 7

class LoginRequest(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
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
    """
    Unified Login.
    Looks up the user by email or username. Verifies password.
    Returns standard access and refresh tokens.
    """
    login_id = credentials.username or credentials.email
    if not login_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username or email is required",
        )                                                                                                                           

    # First check if the user exists
    user = db.query(ERPUser).filter((ERPUser.username == login_id) | (ERPUser.email == login_id)).first()
    if not user or not verify_password(credentials.password, user.passwordHash):
        await log_audit_event("LOGIN_FAILED", "Auth", f"Failed login attempt for {login_id}", req=req)
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    if not user.isActive:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    # Fetch role and permissions
    role_name = "user"
    permissions = []
    if user.roleId:
        from app.models.sql_models import ERPRole, ModuleAccess
        role = db.query(ERPRole).filter(ERPRole.id == user.roleId).first()
        if role:
            role_name = role.name
            access_records = db.query(ModuleAccess).filter(ModuleAccess.roleId == role.id).all()
            permissions = [acc.moduleKey for acc in access_records if acc.canRead]

    # Generate token with permissions included in payload
    access_token = create_access_token(data={"sub": user.id, "allowed_modules": permissions})

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
            "email": user.email,
            "fullName": user.fullName,
            "roleId": user.roleId,
            "role": role_name,
            "permissions": permissions,
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

@router.post("/refresh")
async def refresh_token_route(
    req: Request,
    refreshToken: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Refresh access token using refresh token.
    Accepts refreshToken as a query param or refresh_token / refreshToken in JSON body.
    """
    token_to_use = refreshToken
    
    if not token_to_use:
        try:
            body = await req.json()
            token_to_use = body.get("refresh_token") or body.get("refreshToken")
        except:
            pass
            
    if not token_to_use:
        raise HTTPException(status_code=400, detail="Refresh token required")
        
    rt = db.query(RefreshToken).filter(RefreshToken.token == token_to_use).first()
    if not rt or rt.expiresAt < datetime.utcnow() or rt.isRevoked:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
        
    user = db.query(ERPUser).filter(ERPUser.id == rt.userId).first()
    if not user or not user.isActive:
        raise HTTPException(status_code=401, detail="User inactive or deleted")
        
    new_access = create_access_token(data={"sub": user.id})
    return {
        "accessToken": new_access,
        "token": new_access
    }
