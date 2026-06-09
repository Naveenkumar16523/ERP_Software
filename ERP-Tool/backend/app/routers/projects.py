from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.utils.db import get_db
from app.middlewares.auth_middleware import get_current_user, require_permission, AuthenticatedUser
from app.models.models import Project, ProjectTask
from app.models.schemas import ProjectCreate, ProjectTaskCreate

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("")
async def get_projects(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        projects = db.query(Project).order_by(Project.createdAt.desc()).all()
        result = []
        for p in projects:
            tasks = db.query(ProjectTask).filter(ProjectTask.projectId == p.id).all()
            result.append({
                "id": p.id,
                "name": p.name,
                "code": p.code,
                "description": p.description,
                "manager": p.manager,
                "startDate": p.startDate,
                "endDate": p.endDate,
                "status": p.status,
                "budget": p.budget,
                "createdAt": p.createdAt,
                "updatedAt": p.updatedAt,
                "tasks": [{
                    "id": t.id,
                    "projectId": t.projectId,
                    "title": t.title,
                    "description": t.description,
                    "assignedTo": t.assignedTo,
                    "status": t.status,
                    "dueDate": t.dueDate,
                    "createdAt": t.createdAt
                } for t in tasks]
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_project(body: ProjectCreate, current_user: AuthenticatedUser = Depends(require_permission("projects:write")), db: Session = Depends(get_db)):
    try:
        # Check unique code
        existing = db.query(Project).filter(Project.code == body.code).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Project code already exists")
            
        project = Project(
            name=body.name,
            code=body.code,
            description=body.description,
            manager=body.manager,
            startDate=body.startDate,
            endDate=body.endDate,
            status="PLANNING",
            budget=body.budget
        )
        db.add(project)
        db.commit()
        db.refresh(project)
        
        # Include empty tasks array for frontend compatibility
        project_dict = {
            "id": project.id,
            "name": project.name,
            "code": project.code,
            "description": project.description,
            "manager": project.manager,
            "startDate": project.startDate,
            "endDate": project.endDate,
            "status": project.status,
            "budget": project.budget,
            "createdAt": project.createdAt,
            "updatedAt": project.updatedAt,
            "tasks": []
        }
        return project_dict
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/{projectId}/tasks", status_code=status.HTTP_201_CREATED)
async def add_task(projectId: str, body: ProjectTaskCreate, current_user: AuthenticatedUser = Depends(require_permission("projects:write")), db: Session = Depends(get_db)):
    try:
        project = db.query(Project).filter(Project.id == projectId).first()
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
            
        task = ProjectTask(
            projectId=projectId,
            title=body.title,
            description=body.description,
            assignedTo=body.assignedTo,
            status="TODO",
            dueDate=body.dueDate
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        return task
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
