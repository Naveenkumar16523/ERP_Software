import json
import base64
import io
from datetime import datetime, timedelta
from typing import List
import qrcode
import pyotp
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.utils.db import get_db
from app.utils.redis_client import cache_set, cache_del
from app.utils.security import (
    hash_password, compare_password, generate_access_token, generate_refresh_token,
    verify_refresh_token, verify_access_token, generate_totp_secret, verify_totp_token
)
from app.utils.audit import log_audit_event
from app.middlewares.auth_middleware import get_current_user, require_permission, AuthenticatedUser
from app.models.models import User, Role, UserRole, Session as UserSession, Permission, RolePermission
from app.models.schemas import UserRegister, UserLogin, MFAVerify, LeadStageUpdate

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.get("/registration-status")
async def get_registration_status(db: Session = Depends(get_db)):
    try:
        count = db.query(func.count(User.id)).scalar()
        return {"registrationEnabled": count == 0}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Internal Server Error", "message": str(e)}
        )

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(body: UserRegister, req: Request, db: Session = Depends(get_db)):
    try:
        total_users = db.query(func.count(User.id)).scalar()
        if total_users > 0:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"error": "Forbidden", "message": "Self-registration is disabled. Please contact your system administrator."}
            )

        existing_user = db.query(User).filter(User.email == body.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "Bad Request", "message": "Email already registered"}
            )

        hashed_password = hash_password(body.password)
        user = User(
            firstName=body.firstName,
            lastName=body.lastName,
            email=body.email,
            passwordHash=hashed_password,
            isActive=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        await log_audit_event(
            user_id=user.id,
            action="USER_REGISTER",
            resource="User",
            details={"email": user.email},
            req=req
        )

        return {"message": "User registered successfully", "userId": user.id}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/login")
async def login(body: UserLogin, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.email == body.email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": "Unauthorized", "message": "Invalid credentials"}
            )

        if not compare_password(body.password, user.passwordHash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": "Unauthorized", "message": "Invalid credentials"}
            )

        if not user.isActive:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": "Unauthorized", "message": "Account is inactive"}
            )

        access_token = generate_access_token(user.id, user.email)
        refresh_token = generate_refresh_token(user.id)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "firstName": user.firstName,
                "lastName": user.lastName
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.get("/me")
async def get_current_user_info(current_user: AuthenticatedUser = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "firstName": current_user.firstName,
        "lastName": current_user.lastName
    }

@router.post("/logout")
async def logout():
    return {"message": "Logged out successfully"}
