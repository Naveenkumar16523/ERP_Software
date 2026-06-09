from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.utils.db import get_db
from app.models.models import SecurityEvent, SecurityIncident

router = APIRouter(prefix="/security", tags=["Security"])

# ─── Security Events ───────────────────────────────────────────────────────────

@router.get("/events")
async def get_events(db: Session = Depends(get_db)):
    try:
        return db.query(SecurityEvent).order_by(desc(SecurityEvent.createdAt)).limit(500).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/events", status_code=201)
async def create_event(body: dict, db: Session = Depends(get_db)):
    event_type = body.get("type")
    severity = body.get("severity", "LOW")
    description = body.get("description")
    if not event_type or not description:
        raise HTTPException(status_code=400, detail="type and description are required")
    try:
        event = SecurityEvent(
            type=event_type,
            severity=severity,
            description=description,
            userId=body.get("userId"),
            ipAddress=body.get("ipAddress"),
            userAgent=body.get("userAgent"),
            status=body.get("status", "OPEN")
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/events/{id}/status")
async def update_event_status(id: str, body: dict, db: Session = Depends(get_db)):
    event = db.query(SecurityEvent).filter(SecurityEvent.id == id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    event.status = body.get("status", event.status)
    db.commit()
    db.refresh(event)
    return event

# ─── Security Incidents ────────────────────────────────────────────────────────

@router.get("/incidents")
async def get_incidents(db: Session = Depends(get_db)):
    try:
        return db.query(SecurityIncident).order_by(desc(SecurityIncident.createdAt)).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/incidents", status_code=201)
async def create_incident(body: dict, db: Session = Depends(get_db)):
    title = body.get("title")
    description = body.get("description")
    severity = body.get("severity", "MEDIUM")
    if not title or not description:
        raise HTTPException(status_code=400, detail="title and description are required")
    try:
        incident = SecurityIncident(
            incidentNo=f"INC-{int(datetime.utcnow().timestamp())}",
            title=title,
            description=description,
            severity=severity,
            affectedSystems=body.get("affectedSystems"),
            assignedTo=body.get("assignedTo"),
            status=body.get("status", "OPEN")
        )
        db.add(incident)
        db.commit()
        db.refresh(incident)
        return incident
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/incidents/{id}/status")
async def update_incident_status(id: str, body: dict, db: Session = Depends(get_db)):
    incident = db.query(SecurityIncident).filter(SecurityIncident.id == id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    incident.status = body.get("status", incident.status)
    if body.get("status") in ("RESOLVED", "CLOSED"):
        incident.resolvedAt = datetime.utcnow()
    db.commit()
    db.refresh(incident)
    return incident
