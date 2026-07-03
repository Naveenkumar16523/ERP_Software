from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from app.utils.db import get_db
from app.middlewares.rbac_middleware import get_current_rbac_user, require_module_access, RBACUser
from app.models.security_sql_models import SecurityAlert, AccessLog, UserActivity, ComplianceItem
from app.schemas.security_schemas import SecurityAlertResponse, AccessLogResponse, UserActivityResponse, ComplianceItemResponse, SecurityAlertUpdate

router = APIRouter(prefix="/security", tags=["Security"])

def seed_security_data_if_empty(db: Session):
    if db.query(SecurityAlert).count() == 0:
        alerts = [
            {"type": "Multiple Login Failures", "severity": "HIGH", "description": "5 failed attempts from IP 192.168.1.45", "status": "ACTIVE"},
            {"type": "Unusual Data Export", "severity": "MEDIUM", "description": "10,000 CRM records exported by User-012", "status": "ACTIVE"},
            {"type": "Privilege Escalation", "severity": "CRITICAL", "description": "Unauthorized role change attempted", "status": "INVESTIGATING", "assignedTo": "Admin-1"}
        ]
        for a in alerts:
            db.add(SecurityAlert(**a))
            
        logs = [
            {"userId": "EMP-001", "ipAddress": "10.0.0.5", "action": "LOGIN", "status": "SUCCESS"},
            {"userId": "UNKNOWN", "ipAddress": "192.168.1.45", "action": "LOGIN", "status": "FAILED"},
            {"userId": "EMP-042", "ipAddress": "10.0.0.8", "action": "API_KEY_ROTATION", "status": "SUCCESS"}
        ]
        for l in logs:
            db.add(AccessLog(**l))
            
        activities = [
            {"userId": "EMP-001", "module": "Finance", "action": "VIEW_INVOICE", "metadata_info": {"invoiceId": "INV-1024"}},
            {"userId": "EMP-012", "module": "CRM", "action": "EXPORT_LEADS", "metadata_info": {"count": 10000}}
        ]
        for act in activities:
            db.add(UserActivity(**act))
            
        compliance = [
            {"standard": "SOC 2 Type II", "status": "Compliant", "nextAuditDate": datetime.utcnow() + timedelta(days=90)},
            {"standard": "ISO 27001", "status": "Compliant", "nextAuditDate": datetime.utcnow() + timedelta(days=120)},
            {"standard": "GDPR Data Processing", "status": "Needs Review", "nextAuditDate": datetime.utcnow() + timedelta(days=15)}
        ]
        for c in compliance:
            db.add(ComplianceItem(**c))
            
        db.commit()

@router.get("/alerts", response_model=List[SecurityAlertResponse])
def get_security_alerts(db: Session = Depends(get_db), current_user: RBACUser = Depends(require_module_access("security"))):
    seed_security_data_if_empty(db)
    return db.query(SecurityAlert).order_by(SecurityAlert.createdAt.desc()).all()

@router.patch("/alerts/{alert_id}", response_model=SecurityAlertResponse)
def update_security_alert(alert_id: str, payload: SecurityAlertUpdate, db: Session = Depends(get_db), current_user: RBACUser = Depends(require_module_access("security"))):
    alert = db.query(SecurityAlert).filter(SecurityAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    if payload.status:
        alert.status = payload.status
    if payload.assignedTo is not None:
        alert.assignedTo = payload.assignedTo
        
    db.commit()
    db.refresh(alert)
    return alert

@router.get("/access-logs", response_model=List[AccessLogResponse])
def get_access_logs(db: Session = Depends(get_db), current_user: RBACUser = Depends(require_module_access("security"))):
    return db.query(AccessLog).order_by(AccessLog.timestamp.desc()).all()

@router.get("/user-activities", response_model=List[UserActivityResponse])
def get_user_activities(db: Session = Depends(get_db), current_user: RBACUser = Depends(require_module_access("security"))):
    return db.query(UserActivity).order_by(UserActivity.timestamp.desc()).all()

@router.get("/compliance", response_model=List[ComplianceItemResponse])
def get_compliance_items(db: Session = Depends(get_db), current_user: RBACUser = Depends(require_module_access("security"))):
    return db.query(ComplianceItem).all()
