from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.utils.db import get_db
from app.middlewares.rbac_middleware import get_current_rbac_user, require_module_access, RBACUser

router = APIRouter(prefix="/support", tags=["Support"])

@router.get("/")
async def get_support_root(current_user: RBACUser = Depends(require_module_access("support"))):
    return {"message": "Support module root", "status": "active"}

import uuid
from datetime import datetime

@router.get("/tickets")
async def get_tickets():
    return [
        { "id": "T-001", "title": "Login Issue", "status": "OPEN", "priority": "HIGH", "customer": "Acme Corp", "createdAt": datetime.utcnow().isoformat() + "Z" },
        { "id": "T-002", "title": "Billing Error", "status": "IN_PROGRESS", "priority": "MEDIUM", "customer": "Globex", "createdAt": datetime.utcnow().isoformat() + "Z" }
    ]

@router.post("/tickets", status_code=status.HTTP_201_CREATED)
async def create_ticket(body: dict):
    return { "id": f"T-00{uuid.uuid4().hex[:3]}", **body, "status": "OPEN", "createdAt": datetime.utcnow().isoformat() + "Z" }

