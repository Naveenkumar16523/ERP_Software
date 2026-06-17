import json
from datetime import datetime
from fastapi import Request, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.utils.db import get_db
from app.utils.redis_client import cache_get, cache_set
from app.utils.security import verify_access_token
from app.models.models import User, Session as UserSession, UserRole, RolePermission, Permission

security_scheme = HTTPBearer(auto_error=False)

class AuthenticatedUser:
    def __init__(self, id: str, email: str, permissions: list, token: str):
        self.id = id
        self.email = email
        self.permissions = permissions
        self.token = token

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> AuthenticatedUser:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token is required"
        )
    
    token = credentials.credentials
    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or expired token"
        )
        
    user_id = payload.get("userId")
    email = payload.get("email")
    if not user_id or not email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or expired token"
        )

    # 1. Session check: check Redis or DB fallback
    session_cache_key = f"session:{token}"
    cached_session = cache_get(session_cache_key)
    
    is_session_valid = False
    if cached_session:
        try:
            session_data = json.loads(cached_session)
            is_session_valid = session_data.get("isValid", False)
        except Exception:
            is_session_valid = False
    else:
        # Fallback to Database
        db_session = db.query(UserSession).filter(UserSession.token == token).first()
        if db_session:
            is_session_valid = db_session.isValid and db_session.expiresAt > datetime.utcnow()
    
    if not is_session_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid"
        )

    # 2. Get user permissions
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not found"
        )

    permissions = []
    user_roles = db.query(UserRole).filter(UserRole.userId == user_id).all()
    for user_role in user_roles:
        role_perms = db.query(RolePermission).filter(RolePermission.roleId == user_role.roleId).all()
        for rp in role_perms:
            perm = db.query(Permission).filter(Permission.id == rp.permissionId).first()
            if perm:
                permissions.append(perm.name)

    return AuthenticatedUser(
        id=user_id,
        email=email,
        permissions=permissions,
        token=token
    )

def require_permission(permission: str):
    def dependency(current_user: AuthenticatedUser = Depends(get_current_user)):
        if permission not in current_user.permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission '{permission}' required"
            )
        return current_user
    return dependency
