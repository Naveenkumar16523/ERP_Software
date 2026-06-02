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
        db_session = db.query(UserSession).filter(
            UserSession.token == token,
            UserSession.isValid == True
        ).first()
        if db_session and db_session.expiresAt > datetime.utcnow():
            is_session_valid = True
            
    if not is_session_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired or been revoked"
        )

    # 2. Check cached permissions
    permissions_cache_key = f"user:perms:{user_id}"
    cached_perms = cache_get(permissions_cache_key)
    
    permissions_list = []
    if cached_perms:
        try:
            permissions_list = json.loads(cached_perms)
        except Exception:
            permissions_list = []
    else:
        # Retrieve user permissions
        user = db.query(User).filter(User.id == user_id, User.isActive == True).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is inactive or deleted"
            )
            
        # Flatten permissions
        perms = db.query(Permission.name).join(
            RolePermission, RolePermission.permissionId == Permission.id
        ).join(
            UserRole, UserRole.roleId == RolePermission.roleId
        ).filter(
            UserRole.userId == user_id
        ).all()
        
        permissions_list = list(set([p[0] for p in perms if p[0]]))
        
        # Cache for 5 minutes (300 seconds)
        cache_set(permissions_cache_key, json.dumps(permissions_list), 300)
        
    return AuthenticatedUser(id=user_id, email=email, permissions=permissions_list, token=token)

def require_permission(required_permission: str):
    async def permission_dependency(
        current_user: AuthenticatedUser = Depends(get_current_user)
    ):
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User is not authenticated"
            )
            
        has_permission = (
            required_permission in current_user.permissions or
            "*" in current_user.permissions or
            "admin:all" in current_user.permissions
        )
        
        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required: {required_permission}"
            )
            
        return current_user
    return permission_dependency
