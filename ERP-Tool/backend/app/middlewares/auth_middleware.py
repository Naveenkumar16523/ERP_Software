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
    def __init__(self, id: str, email: str, permissions: list, token: str, is_ceo: bool = False):
        self.id = id
        self.email = email
        self.permissions = permissions
        self.token = token
        self.is_ceo = is_ceo

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
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
        
    user_id = payload.get("sub") or payload.get("userId")
    email = payload.get("email") or payload.get("username")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    # 1. Check if user is in the new ERPUser table (RBAC system)
    from app.models.sql_models import ERPUser, ModuleAccess
    user = db.query(ERPUser).filter(ERPUser.id == user_id).first()
    
    if user:
        # ERPUser session is stateless JWT, skip DB Session validation
        if not user.isActive:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is inactive"
            )
            
        # Build permissions list from ModuleAccess
        permissions_list = []
        if user.isCEO:
            permissions_list = ["*"]
        else:
            role_id = user.roleId
            if role_id:
                module_accesses = db.query(ModuleAccess).filter(ModuleAccess.roleId == role_id).all()
                
                # Map db module keys to route keys
                MODULE_MAPPING = {
                    "finance": "finance",
                    "support": "support",
                    "supply_chain": "supply_chain",
                    "projects": "projects",
                    "procurement": "procurement",
                    "human_resources": "hr",
                    "manufacturing": "manufacturing",
                    "inventory": "inventory",
                    "crm_pipeline": "crm",
                    "ecommerce": "ecommerce",
                    "fixed_assets": "assets",
                    "analytics_hub": "analytics",
                    "banking": "banking",
                    "healthcare": "healthcare",
                    "education": "education",
                    "sustainability": "sustainability",
                    "marketing": "marketing",
                    "security": "security",
                    "migration_hub": "migration",
                    "rpa_automation": "automation"
                }
                
                for access in module_accesses:
                    db_key = access.moduleKey
                    keys_to_add = [db_key]
                    
                    mapped_key = MODULE_MAPPING.get(db_key)
                    if mapped_key:
                        keys_to_add.append(mapped_key)
                        
                    for k in set(keys_to_add):
                        if access.canRead:
                            permissions_list.append(f"{k}:read")
                        if access.canWrite:
                            permissions_list.append(f"{k}:write")
                        if access.canExport:
                            permissions_list.append(f"{k}:export")
                            
        return AuthenticatedUser(
            id=user.id,
            email=user.email or email,
            permissions=permissions_list,
            token=token,
            is_ceo=user.isCEO
        )

    # 2. Fallback to old User (stateful) session verification
    from app.models.models import User, Session as UserSession
    old_user = db.query(User).filter(User.id == user_id, User.isActive == True).first()
    if not old_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive or deleted"
        )
        
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
        
    # Check cached permissions
    permissions_cache_key = f"user:perms:{user_id}"
    cached_perms = cache_get(permissions_cache_key)
    
    permissions_list = []
    if cached_perms:
        try:
            permissions_list = json.loads(cached_perms)
        except Exception:
            permissions_list = []
            
    if not permissions_list:
        from app.models.models import UserRole, Role, RolePermission, Permission
        is_ceo = db.query(UserRole).join(Role).filter(
            UserRole.userId == old_user.id,
            Role.name.in_(["CEO", "admin", "ADMIN", "superadmin"])
        ).first() is not None
        
        permissions = db.query(Permission.name).join(
            RolePermission, Permission.id == RolePermission.permissionId
        ).join(
            UserRole, RolePermission.roleId == UserRole.roleId
        ).filter(
            UserRole.userId == old_user.id
        ).all()
        
        permissions_list = [p[0] for p in permissions]
        cache_set(permissions_cache_key, json.dumps(permissions_list), 300)
    else:
        is_ceo = "*" in permissions_list or "admin:all" in permissions_list
        if not is_ceo:
            from app.models.models import UserRole, Role
            is_ceo = db.query(UserRole).join(Role).filter(
                UserRole.userId == old_user.id,
                Role.name.in_(["CEO", "admin", "ADMIN", "superadmin"])
            ).first() is not None
            
    return AuthenticatedUser(id=user_id, email=email, permissions=permissions_list, token=token, is_ceo=is_ceo)

def require_permission(required_permission: str):
    async def permission_dependency(
        current_user: AuthenticatedUser = Depends(get_current_user)
    ):
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User is not authenticated"
            )
            
        if current_user.is_ceo:
            return current_user
            
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
