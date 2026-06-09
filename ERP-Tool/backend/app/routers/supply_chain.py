import time
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.utils.db import get_db
from app.middlewares.auth_middleware import get_current_user, require_permission, AuthenticatedUser
from app.models.models import Shipment
from app.models.schemas import ShipmentCreate

router = APIRouter(prefix="/supply-chain", tags=["Supply Chain"])

@router.get("/shipments")
async def get_shipments(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        shipments = db.query(Shipment).order_by(Shipment.createdAt.desc()).all()
        return shipments
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/shipments", status_code=status.HTTP_201_CREATED)
async def create_shipment(body: ShipmentCreate, current_user: AuthenticatedUser = Depends(require_permission("supply_chain:write")), db: Session = Depends(get_db)):
    try:
        timestamp_ms = int(time.time() * 1000)
        shipment_no = f"SHP-{timestamp_ms}"
        
        shipment = Shipment(
            shipmentNo=shipment_no,
            carrier=body.carrier,
            origin=body.origin,
            destination=body.destination,
            status="PENDING",
            estimatedDelivery=body.estimatedDelivery
        )
        db.add(shipment)
        db.commit()
        db.refresh(shipment)
        return shipment
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.patch("/shipments/{id}/status")
async def update_shipment_status(id: str, body: dict, current_user: AuthenticatedUser = Depends(require_permission("supply_chain:write")), db: Session = Depends(get_db)):
    try:
        shipment = db.query(Shipment).filter(Shipment.id == id).first()
        if not shipment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipment not found")
        status_val = body.get("status")
        if status_val:
            shipment.status = status_val
        db.commit()
        db.refresh(shipment)
        return shipment
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
