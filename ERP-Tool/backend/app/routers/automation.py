from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.utils.db import get_db
from app.middlewares.rbac_middleware import get_current_rbac_user, require_module_access, RBACUser

router = APIRouter(prefix="/automation", tags=["Automation"])

@router.get("/")
async def get_automation_root(current_user: RBACUser = Depends(require_module_access("automation"))):
    return {"message": "Automation module root", "status": "active"}
