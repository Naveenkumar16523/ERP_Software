from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.utils.db import get_db
from app.middlewares.rbac_middleware import get_current_rbac_user, require_module_access, RBACUser
from app.models.crm_sql_models import Lead, SupportTicket

router = APIRouter(prefix="/crm", tags=["Crm"])

class LeadCreate(BaseModel):
    name: str
    company: str
    email: str
    phone: str
    expectedRevenue: float

class StatusUpdate(BaseModel):
    status: str

@router.get("/leads")
async def list_leads(
    current_user: RBACUser = Depends(require_module_access("crm")),
    db: Session = Depends(get_db)
):
    return db.query(Lead).order_by(Lead.createdAt.desc()).all()

@router.post("/leads", status_code=status.HTTP_201_CREATED)
async def create_lead(
    body: LeadCreate,
    current_user: RBACUser = Depends(require_module_access("crm")),
    db: Session = Depends(get_db)
):
    lead = Lead(
        name=body.name,
        company=body.company,
        email=body.email,
        phone=body.phone,
        expectedRevenue=body.expectedRevenue
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead

@router.patch("/leads/{lead_id}/status")
async def update_lead_status(
    lead_id: str,
    body: StatusUpdate,
    current_user: RBACUser = Depends(require_module_access("crm")),
    db: Session = Depends(get_db)
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    lead.status = body.status
    db.commit()
    db.refresh(lead)
    return lead

class TicketCreate(BaseModel):
    title: str
    description: str
    leadId: Optional[str] = None
    priority: str

@router.get("/tickets")
async def list_tickets(
    current_user: RBACUser = Depends(require_module_access("crm")),
    db: Session = Depends(get_db)
):
    tickets = db.query(SupportTicket).order_by(SupportTicket.createdAt.desc()).all()
    res = []
    for t in tickets:
        lead_name = None
        if t.leadId:
            lead = db.query(Lead).filter(Lead.id == t.leadId).first()
            if lead:
                lead_name = lead.name
        res.append({
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "leadId": t.leadId,
            "leadName": lead_name,
            "status": t.status,
            "priority": t.priority,
            "createdAt": t.createdAt
        })
    return res

@router.post("/tickets", status_code=status.HTTP_201_CREATED)
async def create_ticket(
    body: TicketCreate,
    current_user: RBACUser = Depends(require_module_access("crm")),
    db: Session = Depends(get_db)
):
    ticket = SupportTicket(
        title=body.title,
        description=body.description,
        leadId=body.leadId,
        priority=body.priority
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket

@router.patch("/tickets/{ticket_id}/status")
async def update_ticket_status(
    ticket_id: str,
    body: StatusUpdate,
    current_user: RBACUser = Depends(require_module_access("crm")),
    db: Session = Depends(get_db)
):
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    ticket.status = body.status
    db.commit()
    db.refresh(ticket)
    return ticket
