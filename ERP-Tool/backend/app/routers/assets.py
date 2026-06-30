from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.utils.db import get_db
from app.middlewares.rbac_middleware import get_current_rbac_user, require_module_access, RBACUser

router = APIRouter(prefix="/assets", tags=["Assets"])

@router.get("/")
async def get_assets_root(current_user: RBACUser = Depends(require_module_access("assets"))):
    return {"message": "Assets module root", "status": "active"}


import uuid
from datetime import datetime

@router.get("/assets")
async def get_assets():
    return [
        { "id": "AST-001", "name": "Company Van", "category": "Vehicles", "status": "ACTIVE", "value": 25000 },
        { "id": "AST-002", "name": "Office Server", "category": "IT Equipment", "status": "MAINTENANCE", "value": 5000 }
    ]

@router.post("/assets", status_code=status.HTTP_201_CREATED)
async def create_asset(body: dict):
    return { "id": f"AST-00{uuid.uuid4().hex[:2]}", **body, "status": "ACTIVE" }
