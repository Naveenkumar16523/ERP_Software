from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.utils.db import get_db
from app.middlewares.rbac_middleware import get_current_rbac_user, require_module_access, RBACUser
from app.models.supply_chain_sql_models import FleetVehicle, Shipment, VehicleLocation, CustomsDocument, VehicleMaintenance, Driver, DriverDutyLog, Trip, LorryReceipt
from fastapi.responses import Response
from app.utils.export import generate_pdf

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

class DriverCreate(BaseModel):
    name: str
    licenseNumber: str
    licenseExpiryDate: datetime
    phone: str
    assignedVehicleId: Optional[str] = None
    status: Optional[str] = "Available"

class TripCreate(BaseModel):
    vehicleId: str
    driverId: str
    origin: str
    destination: str
    plannedRoute: Optional[str] = None
    startTime: Optional[datetime] = None
    endTime: Optional[datetime] = None
    distance: Optional[str] = None
    fuelCost: Optional[str] = None
    status: Optional[str] = "Planned"

class DutyLogCreate(BaseModel):
    startTime: datetime
    notes: Optional[str] = None

class VehicleMaintenanceCreate(BaseModel):
    vehicleId: str
    description: str
    cost: str
    status: Optional[str] = "Scheduled"
    scheduledDate: datetime

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

@router.get("/drivers")
async def list_drivers(current_user: RBACUser = Depends(require_module_access("supply_chain")), db: Session = Depends(get_db)):
    return db.query(Driver).order_by(Driver.createdAt.desc()).all()

@router.post("/drivers", status_code=status.HTTP_201_CREATED)
async def create_driver(body: DriverCreate, current_user: RBACUser = Depends(require_module_access("supply_chain")), db: Session = Depends(get_db)):
    driver = Driver(**body.dict())
    db.add(driver)
    db.commit()
    db.refresh(driver)
    return driver

@router.put("/drivers/{driver_id}")
async def update_driver(driver_id: str, body: dict, current_user: RBACUser = Depends(require_module_access("supply_chain")), db: Session = Depends(get_db)):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver: raise HTTPException(status_code=404, detail="Driver not found")
    for k, v in body.items():
        setattr(driver, k, v)
    db.commit()
    db.refresh(driver)
    return driver

@router.delete("/drivers/{driver_id}")
async def delete_driver(driver_id: str, current_user: RBACUser = Depends(require_module_access("supply_chain")), db: Session = Depends(get_db)):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if driver:
        db.delete(driver)
        db.commit()
    return {"message": "Deleted"}

@router.post("/drivers/{driver_id}/duty/start")
async def start_duty(driver_id: str, body: DutyLogCreate, current_user: RBACUser = Depends(require_module_access("supply_chain")), db: Session = Depends(get_db)):
    log = DriverDutyLog(driverId=driver_id, startTime=body.startTime, notes=body.notes)
    db.add(log)
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if driver: driver.status = "On Duty"
    db.commit()
    return {"message": "Shift started"}

@router.post("/drivers/{driver_id}/duty/end")
async def end_duty(driver_id: str, current_user: RBACUser = Depends(require_module_access("supply_chain")), db: Session = Depends(get_db)):
    log = db.query(DriverDutyLog).filter(DriverDutyLog.driverId == driver_id, DriverDutyLog.endTime == None).order_by(DriverDutyLog.startTime.desc()).first()
    if log: log.endTime = datetime.utcnow()
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if driver: driver.status = "Available"
    db.commit()
    return {"message": "Shift ended"}

@router.get("/trips")
async def list_trips(current_user: RBACUser = Depends(require_module_access("supply_chain")), db: Session = Depends(get_db)):
    return db.query(Trip).order_by(Trip.createdAt.desc()).all()

@router.post("/trips", status_code=status.HTTP_201_CREATED)
async def create_trip(body: TripCreate, current_user: RBACUser = Depends(require_module_access("supply_chain")), db: Session = Depends(get_db)):
    trip = Trip(**body.dict())
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip

@router.put("/trips/{trip_id}")
async def update_trip(trip_id: str, body: dict, current_user: RBACUser = Depends(require_module_access("supply_chain")), db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip: raise HTTPException(status_code=404, detail="Trip not found")
    for k, v in body.items():
        setattr(trip, k, v)
    db.commit()
    db.refresh(trip)
    return trip

@router.delete("/trips/{trip_id}")
async def delete_trip(trip_id: str, current_user: RBACUser = Depends(require_module_access("supply_chain")), db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if trip:
        db.delete(trip)
        db.commit()
    return {"message": "Deleted"}

@router.put("/shipments/{shipment_id}/trip")
async def assign_shipment_to_trip(shipment_id: str, body: dict, current_user: RBACUser = Depends(require_module_access("supply_chain")), db: Session = Depends(get_db)):
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment: raise HTTPException(status_code=404, detail="Shipment not found")
    shipment.tripId = body.get("tripId")
    db.commit()
    db.refresh(shipment)
    return shipment

@router.get("/lr")
async def list_lrs(current_user: RBACUser = Depends(require_module_access("supply_chain")), db: Session = Depends(get_db)):
    return db.query(LorryReceipt).order_by(LorryReceipt.createdAt.desc()).all()

@router.post("/lr", status_code=status.HTTP_201_CREATED)
async def create_lr(body: dict, current_user: RBACUser = Depends(require_module_access("supply_chain")), db: Session = Depends(get_db)):
    lr = LorryReceipt(
        lrNumber=body.get("lrNumber"),
        consignor=body.get("consignor"),
        consignee=body.get("consignee"),
        goodsDescription=body.get("goodsDescription"),
        weight=body.get("weight"),
        freightTerms=body.get("freightTerms"),
        amount=body.get("amount"),
        status=body.get("status", "ISSUED"),
        tripId=body.get("tripId"),
        shipmentId=body.get("shipmentId")
    )
    db.add(lr)
    db.commit()
    db.refresh(lr)
    return lr

@router.get("/lr/{lr_id}/pdf")
async def get_lr_pdf(lr_id: str, current_user: RBACUser = Depends(require_module_access("supply_chain")), db: Session = Depends(get_db)):
    lr = db.query(LorryReceipt).filter(LorryReceipt.id == lr_id).first()
    if not lr:
        raise HTTPException(status_code=404, detail="Lorry Receipt not found")

    # A simple HTML template for Lorry Receipt
    html_content = f"""
    <html>
    <head>
        <style>
            body {{ font-family: sans-serif; font-size: 14px; color: #333; }}
            .header {{ text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }}
            .header h1 {{ color: #2563eb; margin: 0; }}
            .details-table {{ width: 100%; border-collapse: collapse; margin-bottom: 20px; }}
            .details-table th, .details-table td {{ border: 1px solid #ccc; padding: 8px; text-align: left; }}
            .details-table th {{ background-color: #f3f4f6; width: 30%; }}
            .footer {{ margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 10px; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>LORRY RECEIPT / CONSIGNMENT NOTE</h1>
            <p>Receipt No: <strong>{lr.lrNumber}</strong> | Date: {lr.createdAt.strftime('%Y-%m-%d')}</p>
        </div>
        
        <table class="details-table">
            <tr>
                <th>Consignor (Sender)</th>
                <td>{lr.consignor}</td>
            </tr>
            <tr>
                <th>Consignee (Receiver)</th>
                <td>{lr.consignee}</td>
            </tr>
            <tr>
                <th>Goods Description</th>
                <td>{lr.goodsDescription}</td>
            </tr>
            <tr>
                <th>Weight</th>
                <td>{lr.weight}</td>
            </tr>
            <tr>
                <th>Freight Terms</th>
                <td>{lr.freightTerms}</td>
            </tr>
            <tr>
                <th>Amount</th>
                <td>{lr.amount or 'N/A'}</td>
            </tr>
            <tr>
                <th>Status</th>
                <td>{lr.status}</td>
            </tr>
        </table>
        
        <div class="footer">
            <p>This is a computer generated document. No signature is required.</p>
            <p>Subject to terms and conditions of carrier.</p>
        </div>
    </body>
    </html>
    """

    try:
        pdf_bytes = generate_pdf(html_content)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=LR-{lr.lrNumber}.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")

@router.get("/maintenance")
async def list_maintenance(current_user: RBACUser = Depends(require_module_access("supply_chain")), db: Session = Depends(get_db)):
    return db.query(VehicleMaintenance).order_by(VehicleMaintenance.scheduledDate.asc()).all()

@router.post("/maintenance", status_code=status.HTTP_201_CREATED)
async def create_maintenance(body: VehicleMaintenanceCreate, current_user: RBACUser = Depends(require_module_access("supply_chain")), db: Session = Depends(get_db)):
    maint = VehicleMaintenance(**body.dict())
    db.add(maint)
    db.commit()
    db.refresh(maint)
    return maint

@router.put("/maintenance/{maintenance_id}")
async def update_maintenance(maintenance_id: str, body: dict, current_user: RBACUser = Depends(require_module_access("supply_chain")), db: Session = Depends(get_db)):
    maint = db.query(VehicleMaintenance).filter(VehicleMaintenance.id == maintenance_id).first()
    if not maint: raise HTTPException(status_code=404, detail="Maintenance log not found")
    for k, v in body.items():
        setattr(maint, k, v)
    db.commit()
    db.refresh(maint)
    return maint

@router.delete("/maintenance/{maintenance_id}")
async def delete_maintenance(maintenance_id: str, current_user: RBACUser = Depends(require_module_access("supply_chain")), db: Session = Depends(get_db)):
    maint = db.query(VehicleMaintenance).filter(VehicleMaintenance.id == maintenance_id).first()
    if maint:
        db.delete(maint)
        db.commit()
    return {"message": "Deleted"}
