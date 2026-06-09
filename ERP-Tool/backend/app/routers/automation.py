from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.utils.db import get_db
from app.models.models import AutomationWorkflow, BotRunLog

router = APIRouter(prefix="/automation", tags=["RPA Automation"])

# ─── Workflows ─────────────────────────────────────────────────────────────────

@router.get("/workflows")
async def get_workflows(db: Session = Depends(get_db)):
    try:
        return db.query(AutomationWorkflow).order_by(desc(AutomationWorkflow.createdAt)).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/workflows", status_code=201)
async def create_workflow(body: dict, db: Session = Depends(get_db)):
    name = body.get("name")
    trigger = body.get("trigger", "MANUAL")
    if not name:
        raise HTTPException(status_code=400, detail="name is required")
    try:
        workflow = AutomationWorkflow(
            name=name,
            description=body.get("description"),
            trigger=trigger,
            schedule=body.get("schedule"),
            status=body.get("status", "ACTIVE"),
            lastRun=body.get("lastRun"),
            successCount=int(body.get("successCount", 0)),
            failureCount=int(body.get("failureCount", 0))
        )
        db.add(workflow)
        db.commit()
        db.refresh(workflow)
        return workflow
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/workflows/{id}/status")
async def update_workflow_status(id: str, body: dict, db: Session = Depends(get_db)):
    workflow = db.query(AutomationWorkflow).filter(AutomationWorkflow.id == id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    workflow.status = body.get("status", workflow.status)
    db.commit()
    db.refresh(workflow)
    return workflow

@router.post("/workflows/{id}/run", status_code=201)
async def run_workflow(id: str, db: Session = Depends(get_db)):
    workflow = db.query(AutomationWorkflow).filter(AutomationWorkflow.id == id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    try:
        now = datetime.utcnow()
        log = BotRunLog(
            workflowId=id,
            status="SUCCESS",
            startedAt=now,
            completedAt=now,
            duration=0.5,
            recordsProcessed=int(body.get("recordsProcessed", 0)) if False else 0,
            errorMessage=None
        )
        db.add(log)
        workflow.successCount += 1
        workflow.lastRun = now.strftime("%Y-%m-%dT%H:%M:%S")
        db.commit()
        db.refresh(log)
        return log
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ─── Bot Run Logs ──────────────────────────────────────────────────────────────

@router.get("/run-logs")
async def get_run_logs(db: Session = Depends(get_db)):
    try:
        return db.query(BotRunLog).order_by(desc(BotRunLog.createdAt)).limit(200).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/run-logs", status_code=201)
async def create_run_log(body: dict, db: Session = Depends(get_db)):
    workflowId = body.get("workflowId")
    run_status = body.get("status", "SUCCESS")
    if not workflowId:
        raise HTTPException(status_code=400, detail="workflowId is required")
    try:
        now = datetime.utcnow()
        log = BotRunLog(
            workflowId=workflowId,
            status=run_status,
            startedAt=body.get("startedAt") or now,
            completedAt=body.get("completedAt") or now,
            duration=float(body.get("duration", 0)),
            recordsProcessed=int(body.get("recordsProcessed", 0)),
            errorMessage=body.get("errorMessage")
        )
        db.add(log)
        # Update workflow stats
        workflow = db.query(AutomationWorkflow).filter(AutomationWorkflow.id == workflowId).first()
        if workflow:
            if run_status == "SUCCESS":
                workflow.successCount += 1
            elif run_status == "FAILED":
                workflow.failureCount += 1
            workflow.lastRun = now.strftime("%Y-%m-%dT%H:%M:%S")
        db.commit()
        db.refresh(log)
        return log
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
