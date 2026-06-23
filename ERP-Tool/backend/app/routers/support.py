import time
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.utils.db import get_db
from app.middlewares.auth_middleware import get_current_user, require_permission, AuthenticatedUser
from app.models.models import SupportTicket
from app.models.schemas import SupportTicketCreate

router = APIRouter(prefix="/support", tags=["Support"])

@router.get("/tickets")
async def get_tickets(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        tickets = db.query(SupportTicket).order_by(SupportTicket.createdAt.desc()).all()
        return tickets
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/tickets", status_code=status.HTTP_201_CREATED)
async def create_ticket(body: SupportTicketCreate, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        timestamp_ms = int(time.time() * 1000)
        ticket_no = f"TCK-{timestamp_ms}"
        
        ticket = SupportTicket(
            ticketNo=ticket_no,
            title=body.title,
            customer=body.customer,
            priority=body.priority,
            status="OPEN",
            assignedTo=body.assignedTo
        )
        db.add(ticket)
        db.commit()
        db.refresh(ticket)
        return ticket
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.patch("/tickets/{id}/status")
async def update_ticket_status(id: str, body: dict, current_user: AuthenticatedUser = Depends(require_permission("support:write")), db: Session = Depends(get_db)):
    try:
        ticket = db.query(SupportTicket).filter(SupportTicket.id == id).first()
        if not ticket:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
        status_val = body.get("status")
        if status_val:
            ticket.status = status_val
        db.commit()
        db.refresh(ticket)
        return ticket
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
