from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.utils.db import get_db
from app.middlewares.rbac_middleware import get_current_rbac_user, require_module_access, RBACUser

router = APIRouter(prefix="/security", tags=["Security"])

@router.get("/")
async def get_security_root(current_user: RBACUser = Depends(require_module_access("security"))):
    return {"message": "Security module root", "status": "active"}
