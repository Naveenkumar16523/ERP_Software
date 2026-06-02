from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, func

from app.utils.db import get_db
from app.utils.audit import log_audit_event
from app.middlewares.auth_middleware import get_current_user, require_permission, AuthenticatedUser
from app.models.models import FixedAsset, DepreciationLog, MaintenanceOrder
from app.models.schemas import AssetCreate

router = APIRouter(prefix="/assets", tags=["Assets"])

# ─── HELPER: Compute Depreciation Schedule (Straight-Line & Declining Balance) ───

def compute_depreciation_schedule(asset: FixedAsset, override_method: Optional[str] = None) -> List[dict]:
    purchase_cost = asset.purchaseCost
    salvage_value = asset.salvageValue
    useful_life = asset.usefulLifeYears
    method = override_method or asset.depMethod
    rate = asset.depRate
    start_year = asset.purchaseDate.year if asset.purchaseDate else datetime.utcnow().year

    schedule = []
    book_value = purchase_cost

    if method == "STRAIGHT_LINE":
        annual_dep = (purchase_cost - salvage_value) / useful_life
        for y in range(useful_life):
            opening = book_value
            dep = min(annual_dep, max(0.0, book_value - salvage_value))
            book_value = max(salvage_value, book_value - dep)
            schedule.append({
                "year": start_year + y,
                "method": "STRAIGHT_LINE",
                "openingValue": round(opening, 2),
                "depAmount": round(dep, 2),
                "closingValue": round(book_value, 2)
            })
    else:
        # Declining Balance
        for y in range(useful_life):
            opening = book_value
            dep = max(0.0, opening * rate)
            book_value = max(salvage_value, opening - dep)
            schedule.append({
                "year": start_year + y,
                "method": "DECLINING_BALANCE",
                "openingValue": round(opening, 2),
                "depAmount": round(dep, 2),
                "closingValue": round(book_value, 2)
            })

    return schedule

# ─── 1. FIXED ASSETS REGISTER

@router.get("/fixed-assets")
async def get_fixed_assets(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        assets = db.query(FixedAsset).order_by(FixedAsset.assetCode.asc()).all()
        result = []
        for a in assets:
            dep_logs = db.query(DepreciationLog).filter(DepreciationLog.assetId == a.id).all()
            maint_orders = db.query(MaintenanceOrder).filter(MaintenanceOrder.assetId == a.id).all()
            result.append({
                "id": a.id,
                "assetCode": a.assetCode,
                "name": a.name,
                "category": a.category,
                "location": a.location,
                "serialNo": a.serialNo,
                "purchaseDate": a.purchaseDate,
                "purchaseCost": a.purchaseCost,
                "salvageValue": a.salvageValue,
                "usefulLifeYears": a.usefulLifeYears,
                "depMethod": a.depMethod,
                "depRate": a.depRate,
                "currentBookValue": a.currentBookValue,
                "status": a.status,
                "disposalDate": a.disposalDate,
                "disposalValue": a.disposalValue,
                "createdAt": a.createdAt,
                "updatedAt": a.updatedAt,
                "depreciationLogs": dep_logs,
                "maintenanceOrders": maint_orders
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/fixed-assets", status_code=status.HTTP_201_CREATED)
async def create_fixed_asset(body: AssetCreate, req: Request, current_user: AuthenticatedUser = Depends(require_permission("assets:write")), db: Session = Depends(get_db)):
    try:
        # Check if asset code exists
        existing = db.query(FixedAsset).filter(FixedAsset.assetCode == body.assetCode).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Conflict", "message": "Asset code already registered"})

        asset = FixedAsset(
            assetCode=body.assetCode,
            name=body.name,
            category=body.category,
            location=body.location,
            serialNo=body.serialNo,
            purchaseDate=body.purchaseDate,
            purchaseCost=float(body.purchaseCost),
            salvageValue=float(body.salvageValue or 0.0),
            usefulLifeYears=int(body.usefulLifeYears or 5),
            depMethod=body.depMethod or "STRAIGHT_LINE",
            depRate=float(body.depRate or 0.2),
            currentBookValue=float(body.purchaseCost),
            status="ACTIVE"
        )
        db.add(asset)
        db.commit()
        db.refresh(asset)

        await log_audit_event(
            user_id=current_user.id,
            action="CREATE_FIXED_ASSET",
            resource="FixedAsset",
            details={"id": asset.id, "assetCode": asset.assetCode, "name": asset.name},
            req=req
        )

        return asset
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# Direct root endpoints to ensure compatibility with frontend api.js '/assets' queries
@router.get("")
async def get_assets_alias(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    return await get_fixed_assets(current_user, db)

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_asset_alias(body: AssetCreate, req: Request, current_user: AuthenticatedUser = Depends(require_permission("assets:write")), db: Session = Depends(get_db)):
    return await create_fixed_asset(body, req, current_user, db)

# ─── 2. DEPRECIATION SCHEDULER

@router.get("/fixed-assets/{id}/depreciation")
async def get_asset_depreciation_ledger(id: str, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        asset = db.query(FixedAsset).filter(FixedAsset.id == id).first()
        if not asset:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Not Found", "message": "Asset not found."})

        sl_schedule = compute_depreciation_schedule(asset, "STRAIGHT_LINE")
        db_schedule = compute_depreciation_schedule(asset, "DECLINING_BALANCE")

        return {
            "asset": asset,
            "straightLine": sl_schedule,
            "decliningBalance": db_schedule
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/fixed-assets/{id}/run-depreciation", status_code=status.HTTP_201_CREATED)
async def run_depreciation(id: str, current_user: AuthenticatedUser = Depends(require_permission("assets:write")), db: Session = Depends(get_db)):
    try:
        asset = db.query(FixedAsset).filter(FixedAsset.id == id).first()
        if not asset:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Not Found", "message": "Asset not found."})

        year = datetime.utcnow().year
        opening_value = asset.currentBookValue

        if asset.depMethod == "STRAIGHT_LINE":
            dep_amount = (asset.purchaseCost - asset.salvageValue) / asset.usefulLifeYears
        else:
            dep_amount = opening_value * asset.depRate

        # Cap depreciation
        dep_amount = min(dep_amount, max(0.0, opening_value - asset.salvageValue))
        closing_value = max(asset.salvageValue, opening_value - dep_amount)

        # Logging depreciation entry
        log = DepreciationLog(
            assetId=asset.id,
            year=year,
            openingValue=opening_value,
            depAmount=dep_amount,
            closingValue=closing_value,
            method=asset.depMethod
        )
        db.add(log)
        asset.currentBookValue = closing_value
        
        db.commit()
        db.refresh(log)
        return log
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.patch("/fixed-assets/{id}/dispose")
async def dispose_fixed_asset(id: str, body: dict, current_user: AuthenticatedUser = Depends(require_permission("assets:write")), db: Session = Depends(get_db)):
    disposal_value = body.get("disposalValue")
    try:
        asset = db.query(FixedAsset).filter(FixedAsset.id == id).first()
        if not asset:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Not Found", "message": "Asset not found."})

        asset.status = "DISPOSED"
        asset.disposalDate = datetime.utcnow()
        asset.disposalValue = float(disposal_value) if disposal_value is not None else 0.0
        
        db.commit()
        db.refresh(asset)
        return asset
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# ─── 3. MAINTENANCE WORK ORDERS

@router.get("/maintenance-orders")
async def get_maintenance_orders(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        orders = db.query(MaintenanceOrder).order_by(desc(MaintenanceOrder.createdAt)).all()
        result = []
        for o in orders:
            asset = db.query(FixedAsset).filter(FixedAsset.id == o.assetId).first() if o.assetId else None
            result.append({
                "id": o.id,
                "workOrderNo": o.workOrderNo,
                "assetId": o.assetId,
                "title": o.title,
                "description": o.description,
                "type": o.type,
                "priority": o.priority,
                "assignedTo": o.assignedTo,
                "scheduledDate": o.scheduledDate,
                "completedDate": o.completedDate,
                "cost": o.cost,
                "status": o.status,
                "createdAt": o.createdAt,
                "updatedAt": o.updatedAt,
                "asset": {"id": asset.id, "name": asset.name, "assetCode": asset.assetCode} if asset else None
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/maintenance-orders", status_code=status.HTTP_201_CREATED)
async def create_maintenance_order(body: dict, req: Request, current_user: AuthenticatedUser = Depends(require_permission("assets:write")), db: Session = Depends(get_db)):
    workOrderNo = body.get("workOrderNo")
    assetId = body.get("assetId")
    title = body.get("title")
    description = body.get("description")
    type_val = body.get("type")
    priority = body.get("priority") or "MEDIUM"
    assignedTo = body.get("assignedTo")
    scheduledDate_str = body.get("scheduledDate")
    cost = body.get("cost")

    if not workOrderNo or not title or not type_val:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": "Work Order number, title, and type are required."})

    try:
        scheduledDate = datetime.fromisoformat(scheduledDate_str.replace("Z", "+00:00")).replace(tzinfo=None) if scheduledDate_str else None
        
        order = MaintenanceOrder(
            workOrderNo=workOrderNo,
            assetId=assetId or None,
            title=title,
            description=description,
            type=type_val,
            priority=priority,
            assignedTo=assignedTo,
            scheduledDate=scheduledDate,
            cost=float(cost) if cost is not None else 0.0,
            status="OPEN"
        )
        db.add(order)
        db.commit()
        db.refresh(order)

        await log_audit_event(
            user_id=current_user.id,
            action="CREATE_MAINTENANCE_ORDER",
            resource="MaintenanceOrder",
            details={"id": order.id, "workOrderNo": order.workOrderNo},
            req=req
        )

        return order
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.patch("/maintenance-orders/{id}/status")
async def update_maintenance_status(id: str, body: dict, current_user: AuthenticatedUser = Depends(require_permission("assets:write")), db: Session = Depends(get_db)):
    status_val = body.get("status")
    try:
        order = db.query(MaintenanceOrder).filter(MaintenanceOrder.id == id).first()
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Not Found", "message": "Maintenance order not found"})

        order.status = status_val
        if status_val == "COMPLETED":
            order.completedDate = datetime.utcnow()
            
        db.commit()
        db.refresh(order)
        return order
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})
