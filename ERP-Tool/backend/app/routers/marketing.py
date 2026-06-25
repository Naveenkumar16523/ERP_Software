from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.utils.db import get_db
from app.middlewares.rbac_middleware import get_current_rbac_user, require_module_access, RBACUser

router = APIRouter(prefix="/marketing", tags=["Marketing"])

@router.get("/")
async def get_marketing_root(current_user: RBACUser = Depends(require_module_access("marketing"))):
    return {"message": "Marketing module root", "status": "active"}
