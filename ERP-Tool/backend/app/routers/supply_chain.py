from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.utils.db import get_db
from app.middlewares.rbac_middleware import get_current_rbac_user, require_module_access, RBACUser
from app.models.supply_chain_sql_models import FleetVehicle, Shipment, VehicleLocation, CustomsDocument, VehicleMaintenance

router = APIRouter(prefix="/supply-chain", tags=["Supply chain"])

class VehicleCreate(BaseModel):
    registrationNumber: str
    vehicleType: str
    status: Optional[str] = "Available"
    currentLocation: Optional[str] = None

class ShipmentCreate(BaseModel):
    trackingNumber: str
    origin: str
    destination: str
    vehicleId: Optional[str] = None
    status: Optional[str] = "Pending"

class LocationUpdate(BaseModel):
    latitude: str
    longitude: str

class PodUpdate(BaseModel):
    podSignature: str

@router.get("/vehicles")
async def list_vehicles(
    current_user: RBACUser = Depends(require_module_access("supply_chain")),
    db: Session = Depends(get_db)
):
    return db.query(FleetVehicle).order_by(FleetVehicle.createdAt.desc()).all()

@router.post("/vehicles", status_code=status.HTTP_201_CREATED)
async def create_vehicle(
    body: VehicleCreate,
    current_user: RBACUser = Depends(require_module_access("supply_chain")),
    db: Session = Depends(get_db)
):
    vehicle = FleetVehicle(
        registrationNumber=body.registrationNumber,
        vehicleType=body.vehicleType,
        status=body.status,
        currentLocation=body.currentLocation
    )
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle

@router.post("/vehicles/{vehicle_id}/gps")
async def update_vehicle_gps(
    vehicle_id: str,
    body: LocationUpdate,
    current_user: RBACUser = Depends(require_module_access("supply_chain")),
    db: Session = Depends(get_db)
):
    vehicle = db.query(FleetVehicle).filter(FleetVehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
        
    loc = VehicleLocation(
        vehicleId=vehicle_id,
        latitude=body.latitude,
        longitude=body.longitude
    )
    db.add(loc)
    
    vehicle.currentLocation = f"{body.latitude}, {body.longitude}"
    
    db.commit()
    return {"message": "GPS updated successfully"}

@router.get("/shipments")
async def list_shipments(
    current_user: RBACUser = Depends(require_module_access("supply_chain")),
    db: Session = Depends(get_db)
):
    return db.query(Shipment).order_by(Shipment.createdAt.desc()).all()

@router.post("/shipments", status_code=status.HTTP_201_CREATED)
async def create_shipment(
    body: ShipmentCreate,
    current_user: RBACUser = Depends(require_module_access("supply_chain")),
    db: Session = Depends(get_db)
):
    shipment = Shipment(
        trackingNumber=body.trackingNumber,
        origin=body.origin,
        destination=body.destination,
        vehicleId=body.vehicleId,
        status=body.status
    )
    db.add(shipment)
    db.commit()
    db.refresh(shipment)
    return shipment

@router.patch("/shipments/{shipment_id}/status")
async def update_shipment_status(
    shipment_id: str,
    body: dict,
    current_user: RBACUser = Depends(require_module_access("supply_chain")),
    db: Session = Depends(get_db)
):
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
        
    if "status" in body:
        shipment.status = body["status"]
    
    db.commit()
    db.refresh(shipment)
    return shipment

@router.post("/shipments/{shipment_id}/pod")
async def update_shipment_pod(
    shipment_id: str,
    body: PodUpdate,
    current_user: RBACUser = Depends(require_module_access("supply_chain")),
    db: Session = Depends(get_db)
):
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
        
    shipment.podSignature = body.podSignature
    shipment.status = "Delivered"
    
    db.commit()
    db.refresh(shipment)
    return shipment
