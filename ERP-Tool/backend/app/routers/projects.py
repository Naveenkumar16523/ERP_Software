from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.utils.db import get_db
from app.middlewares.rbac_middleware import get_current_rbac_user, require_module_access, RBACUser

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("/")
async def get_projects_root(current_user: RBACUser = Depends(require_module_access("projects"))):
    return {"message": "Projects module root", "status": "active"}


import uuid
from datetime import datetime

@router.get("/projects")
async def get_projects():
    return [
        { "id": "PRJ-001", "name": "Website Redesign", "status": "IN_PROGRESS", "budget": 15000 },
        { "id": "PRJ-002", "name": "Q3 Marketing", "status": "PLANNED", "budget": 8000 }
    ]

@router.post("/projects", status_code=status.HTTP_201_CREATED)
async def create_project(body: dict):
    return { "id": f"PRJ-00{uuid.uuid4().hex[:2]}", **body, "status": "PLANNED" }

@router.get("/tasks")
async def get_tasks():
    return [
        { "id": "TSK-001", "projectId": "PRJ-001", "title": "Design Mockups", "status": "TODO", "priority": "HIGH" }
    ]

@router.post("/tasks", status_code=status.HTTP_201_CREATED)
async def create_task(body: dict):
    return { "id": f"TSK-00{uuid.uuid4().hex[:2]}", **body, "status": "TODO" }
