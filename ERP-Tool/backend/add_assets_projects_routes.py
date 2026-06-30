import uuid
from datetime import datetime
import os

# ---- ASSETS ----
assets_file = 'app/routers/assets.py'
if os.path.exists(assets_file):
    with open(assets_file, 'r', encoding='utf-8') as f:
        assets_content = f.read()

    assets_mock = """
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
"""
    if '@router.get("/assets")' not in assets_content:
        with open(assets_file, 'w', encoding='utf-8') as f:
            f.write(assets_content + '\n' + assets_mock)


# ---- PROJECTS ----
projects_file = 'app/routers/projects.py'
if os.path.exists(projects_file):
    with open(projects_file, 'r', encoding='utf-8') as f:
        projects_content = f.read()

    projects_mock = """
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
"""
    if '@router.get("/projects")' not in projects_content:
        with open(projects_file, 'w', encoding='utf-8') as f:
            f.write(projects_content + '\n' + projects_mock)

