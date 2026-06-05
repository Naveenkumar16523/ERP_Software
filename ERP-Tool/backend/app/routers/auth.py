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
                detail={"error": "Conflict", "message": "Email is already registered"}
            )

        hashed = hash_password(body.password)
        user = User(
            email=body.email,
            password=hashed,
            firstName=body.firstName,
            lastName=body.lastName
        )
        db.add(user)
        db.flush()  # populate user.id

        # Assign ADMIN role to the first user
        role = db.query(Role).filter(Role.name == "ADMIN").first()
        if not role:
            role = Role(name="ADMIN", description="Administrator")
            db.add(role)
            db.flush()

        user_role = UserRole(userId=user.id, roleId=role.id)
        db.add(user_role)
        db.commit()

        await log_audit_event(
            user_id=user.id,
            action="USER_REGISTER",
            resource="User",
            details={"email": body.email},
            req=req
        )

        return {
            "message": "User registered successfully",
            "user": {"id": user.id, "email": user.email, "firstName": user.firstName, "lastName": user.lastName}
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Internal Server Error", "message": str(e)}
        )

@router.post("/login")
async def login(body: UserLogin, req: Request, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.email == body.email).first()
        if not user or not user.isActive:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": "Unauthorized", "message": "Invalid credentials"}
            )

        if not compare_password(body.password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": "Unauthorized", "message": "Invalid credentials"}
            )

        # Check if MFA is enabled
        if user.mfaEnabled:
            mfa_token = generate_access_token({"userId": user.id, "email": user.email})
            return {
                "mfaRequired": True,
                "tempToken": mfa_token,
                "message": "Multi-Factor Authentication code is required to complete login"
            }

        # Setup sessions
        token = generate_access_token({"userId": user.id, "email": user.email})
        refresh_token = generate_refresh_token({"userId": user.id, "email": user.email})
        expires_at = datetime.utcnow() + timedelta(days=1)

        user_agent = req.headers.get("user-agent", "Unknown")
        ip = req.client.host if req.client else "Unknown"

        session = UserSession(
            userId=user.id,
            token=token,
            ipAddress=ip,
            userAgent=user_agent,
            expiresAt=expires_at
        )
        db.add(session)
        db.commit()

        # Cache session in Redis
        cache_set(f"session:{token}", json.dumps({"isValid": True, "userId": user.id}), 24 * 60 * 60)

        await log_audit_event(
            user_id=user.id,
            action="USER_LOGIN",
            resource="User",
            details={"email": user.email},
            req=req
        )

        # Load roles & permissions
        perms = db.query(Permission.name).join(
            RolePermission, RolePermission.permissionId == Permission.id
        ).join(
            UserRole, UserRole.roleId == RolePermission.roleId
        ).filter(
            UserRole.userId == user.id
        ).all()
        permissions = list(set([p[0] for p in perms if p[0]]))

        roles_query = db.query(Role.name).join(UserRole, UserRole.roleId == Role.id).filter(UserRole.userId == user.id).all()
        roles = [r[0] for r in roles_query]

        return {
            "message": "Login successful",
            "token": token,
            "refreshToken": refresh_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "firstName": user.firstName,
                "lastName": user.lastName,
                "roles": roles,
                "permissions": permissions
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Internal Server Error", "message": str(e)}
        )

@router.post("/admin/login")
async def admin_login(req: Request, db: Session = Depends(get_db)):
    """CEO / Admin login endpoint — accepts {username, password} where username is the email."""
    try:
        body = await req.json()
        email_or_username = body.get("username") or body.get("email", "")
        password_raw = body.get("password", "")

        user = db.query(User).filter(User.email == email_or_username).first()
        if not user or not user.isActive:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": "Unauthorized", "message": "Invalid credentials"}
            )

        if not compare_password(password_raw, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": "Unauthorized", "message": "Invalid credentials"}
            )

        # Check if MFA is enabled
        if user.mfaEnabled:
            mfa_token = generate_access_token({"userId": user.id, "email": user.email})
            return {
                "mfaRequired": True,
                "tempToken": mfa_token,
                "message": "Multi-Factor Authentication code is required to complete login"
            }

        token = generate_access_token({"userId": user.id, "email": user.email})
        refresh_token = generate_refresh_token({"userId": user.id, "email": user.email})
        expires_at = datetime.utcnow() + timedelta(days=1)

        user_agent = req.headers.get("user-agent", "Unknown")
        ip = req.client.host if req.client else "Unknown"

        session = UserSession(
            userId=user.id,
            token=token,
            ipAddress=ip,
            userAgent=user_agent,
            expiresAt=expires_at
        )
        db.add(session)
        db.commit()

        cache_set(f"session:{token}", json.dumps({"isValid": True, "userId": user.id}), 24 * 60 * 60)

        await log_audit_event(
            user_id=user.id,
            action="ADMIN_LOGIN",
            resource="User",
            details={"email": user.email},
            req=req
        )

        perms = db.query(Permission.name).join(
            RolePermission, RolePermission.permissionId == Permission.id
        ).join(
            UserRole, UserRole.roleId == RolePermission.roleId
        ).filter(
            UserRole.userId == user.id
        ).all()
        permissions = list(set([p[0] for p in perms if p[0]]))

        roles_query = db.query(Role.name).join(UserRole, UserRole.roleId == Role.id).filter(UserRole.userId == user.id).all()
        roles = [r[0] for r in roles_query]

        return {
            "message": "Login successful",
            "token": token,
            "refreshToken": refresh_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "firstName": user.firstName,
                "lastName": user.lastName,
                "roles": roles,
                "permissions": permissions
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Internal Server Error", "message": str(e)}
        )

@router.post("/mfa/setup")
async def mfa_setup(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.id == current_user.id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Not Found", "message": "User not found"})

        secret = generate_totp_secret()
        totp = pyotp.TOTP(secret)
        otpauth_url = totp.provisioning_uri(name=user.email, issuer_name="EPR-Dashboard")

        # Generate base64 QR Code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(otpauth_url)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        qr_code_base64 = base64.b64encode(buffered.getvalue()).decode()
        qr_code_data_url = f"data:image/png;base64,{qr_code_base64}"

        user.mfaSecret = secret
        db.commit()

        return {
            "secret": secret,
            "qrCode": qr_code_data_url,
            "message": "Scan this QR code with Google Authenticator and enter the verification code to enable MFA."
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/mfa/enable")
async def mfa_enable(body: MFAVerify, req: Request, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.id == current_user.id).first()
        if not user or not user.mfaSecret:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": "MFA setup has not been initialized."})

        if not verify_totp_token(user.mfaSecret, body.token):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Validation Error", "message": "Invalid authentication code"})

        user.mfaEnabled = True
        db.commit()

        await log_audit_event(
            user_id=current_user.id,
            action="MFA_ENABLE",
            resource="User",
            details={"email": user.email},
            req=req
        )

        return {"message": "Multi-Factor Authentication enabled successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/mfa/verify")
async def mfa_verify(body: MFAVerify, req: Request, tempToken: str, db: Session = Depends(get_db)):
    try:
        decoded = verify_access_token(tempToken)
        if not decoded:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": "Invalid or expired temporary login token"})

        user_id = decoded.get("userId")
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.mfaSecret or not user.mfaEnabled:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": "MFA is not configured for this user."})

        if not verify_totp_token(user.mfaSecret, body.token):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"error": "Unauthorized", "message": "Invalid authentication code"})

        # Setup standard login session
        token = generate_access_token({"userId": user.id, "email": user.email})
        refresh_token = generate_refresh_token({"userId": user.id, "email": user.email})
        expires_at = datetime.utcnow() + timedelta(days=1)

        user_agent = req.headers.get("user-agent", "Unknown")
        ip = req.client.host if req.client else "Unknown"

        session = UserSession(
            userId=user.id,
            token=token,
            ipAddress=ip,
            userAgent=user_agent,
            expiresAt=expires_at
        )
        db.add(session)
        db.commit()

        # Cache session in Redis
        cache_set(f"session:{token}", json.dumps({"isValid": True, "userId": user.id}), 24 * 60 * 60)

        await log_audit_event(
            user_id=user.id,
            action="USER_LOGIN_MFA",
            resource="User",
            details={"email": user.email},
            req=req
        )

        # Load roles & permissions
        perms = db.query(Permission.name).join(
            RolePermission, RolePermission.permissionId == Permission.id
        ).join(
            UserRole, UserRole.roleId == RolePermission.roleId
        ).filter(
            UserRole.userId == user.id
        ).all()
        permissions = list(set([p[0] for p in perms if p[0]]))

        roles_query = db.query(Role.name).join(UserRole, UserRole.roleId == Role.id).filter(UserRole.userId == user.id).all()
        roles = [r[0] for r in roles_query]

        return {
            "message": "Login successful",
            "token": token,
            "refreshToken": refresh_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "firstName": user.firstName,
                "lastName": user.lastName,
                "roles": roles,
                "permissions": permissions
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/logout")
async def logout(req: Request, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    token = current_user.token
    if token:
        try:
            cache_del(f"session:{token}")
            
            db_session = db.query(UserSession).filter(UserSession.token == token).first()
            if db_session:
                db_session.isValid = False
                db.commit()
                
            await log_audit_event(
                user_id=current_user.id,
                action="USER_LOGOUT",
                resource="User",
                details={"token": token},
                req=req
            )
        except Exception as e:
            print("Error during logout session cleanup:", e)
            
    return {"message": "Logged out successfully"}

@router.post("/refresh")
async def refresh_token(req: Request, refreshToken: str, db: Session = Depends(get_db)):
    try:
        decoded = verify_refresh_token(refreshToken)
        if not decoded:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"error": "Unauthorized", "message": "Invalid or expired refresh token"})

        user_id = decoded.get("userId")
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.isActive:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"error": "Unauthorized", "message": "User account is inactive or deleted"})

        # New Access Token
        token = generate_access_token({"userId": user.id, "email": user.email})
        expires_at = datetime.utcnow() + timedelta(days=1)

        user_agent = req.headers.get("user-agent", "Unknown")
        ip = req.client.host if req.client else "Unknown"

        session = UserSession(
            userId=user.id,
            token=token,
            ipAddress=ip,
            userAgent=user_agent,
            expiresAt=expires_at
        )
        db.add(session)
        db.commit()

        # Cache session in Redis
        cache_set(f"session:{token}", json.dumps({"isValid": True, "userId": user.id}), 24 * 60 * 60)

        return {"token": token, "refreshToken": refreshToken}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# ─── ADMIN endpoints ──────────────────────────────────────────────────────────

@router.get("/users")
async def list_users(current_user: AuthenticatedUser = Depends(require_permission("admin:all")), db: Session = Depends(get_db)):
    try:
        users = db.query(User).order_by(User.createdAt.desc()).all()
        result = []
        for u in users:
            roles_query = db.query(Role).join(UserRole, UserRole.roleId == Role.id).filter(UserRole.userId == u.id).all()
            roles = [{"id": r.id, "name": r.name, "description": r.description} for r in roles_query]
            result.append({
                "id": u.id,
                "email": u.email,
                "firstName": u.firstName,
                "lastName": u.lastName,
                "isActive": u.isActive,
                "mfaEnabled": u.mfaEnabled,
                "createdAt": u.createdAt,
                "roles": roles
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(body: UserRegister, req: Request, roleName: Optional[str] = None, current_user: AuthenticatedUser = Depends(require_permission("admin:all")), db: Session = Depends(get_db)):
    try:
        existing_user = db.query(User).filter(User.email == body.email).first()
        if existing_user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Conflict", "message": "Email is already registered"})

        hashed = hash_password(body.password)
        user = User(
            email=body.email,
            password=hashed,
            firstName=body.firstName,
            lastName=body.lastName
        )
        db.add(user)
        db.flush()

        target_role_name = roleName or "USER"
        role = db.query(Role).filter(Role.name == target_role_name).first()
        if not role:
            role = Role(name=target_role_name, description=f"{target_role_name} role")
            db.add(role)
            db.flush()

        user_role = UserRole(userId=user.id, roleId=role.id)
        db.add(user_role)
        db.commit()

        await log_audit_event(
            user_id=current_user.id,
            action="ADMIN_CREATE_USER",
            resource="User",
            details={"createdEmail": body.email, "assignedRole": target_role_name},
            req=req
        )

        return {
            "message": f"User created successfully with role {target_role_name}",
            "user": {"id": user.id, "email": user.email, "firstName": user.firstName, "lastName": user.lastName, "role": target_role_name}
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.patch("/users/{id}/status")
async def update_user_status(id: str, body: LeadStageUpdate, req: Request, current_user: AuthenticatedUser = Depends(require_permission("admin:all")), db: Session = Depends(get_db)):
    # Note: Using LeadStageUpdate schema model just for status boolean validation or simple validation mapping
    isActive = body.status == "true" or body.status == "True" or body.status is True or str(body.status).lower() == "true"
    
    if id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": "You cannot change your own account status"})

    try:
        user = db.query(User).filter(User.id == id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Not Found", "message": "User not found"})

        user.isActive = isActive
        
        if not isActive:
            db.query(UserSession).filter(UserSession.userId == id).update({"isValid": False})

        db.commit()

        await log_audit_event(
            user_id=current_user.id,
            action="ADMIN_ACTIVATE_USER" if isActive else "ADMIN_DEACTIVATE_USER",
            resource="User",
            details={"targetUserId": id, "email": user.email},
            req=req
        )

        return {"message": f"User {'activated' if isActive else 'deactivated'} successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.get("/roles")
async def list_roles(current_user: AuthenticatedUser = Depends(require_permission("admin:all")), db: Session = Depends(get_db)):
    try:
        roles = db.query(Role).order_by(Role.name.asc()).all()
        return [{"id": r.id, "name": r.name, "description": r.description} for r in roles]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.get("/me")
async def get_profile(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.id == current_user.id, User.isActive == True).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"error": "Unauthorized", "message": "User profile not found or inactive"})

        # Load roles and permissions
        perms = db.query(Permission.name).join(
            RolePermission, RolePermission.permissionId == Permission.id
        ).join(
            UserRole, UserRole.roleId == RolePermission.roleId
        ).filter(
            UserRole.userId == user.id
        ).all()
        permissions = list(set([p[0] for p in perms if p[0]]))

        roles_query = db.query(Role.name).join(UserRole, UserRole.roleId == Role.id).filter(UserRole.userId == user.id).all()
        roles = [r[0] for r in roles_query]

        return {
            "user": {
                "id": user.id,
                "email": user.email,
                "firstName": user.firstName,
                "lastName": user.lastName,
                "isActive": user.isActive,
                "mfaEnabled": user.mfaEnabled,
                "createdAt": user.createdAt,
                "roles": roles,
                "permissions": permissions
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})
