import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request

from app.utils.db import get_db
from app.utils.audit import log_audit_event
from app.middlewares.auth_middleware import get_current_user, require_permission, AuthenticatedUser
from app.models.schemas import AssetCreate

router = APIRouter(prefix="/assets", tags=["Assets"])

def compute_depreciation_schedule(asset: dict, override_method: Optional[str] = None) -> List[dict]:
    purchase_cost = asset.get("purchaseCost", 0.0)
    salvage_value = asset.get("salvageValue", 0.0)
    useful_life = asset.get("usefulLifeYears", 1)
    method = override_method or asset.get("depMethod", "STRAIGHT_LINE")
    rate = asset.get("depRate", 0.2)
    purchase_date = asset.get("purchaseDate")
    start_year = purchase_date.year if purchase_date and isinstance(purchase_date, datetime) else datetime.utcnow().year

    schedule = []
    book_value = purchase_cost

    if method == "STRAIGHT_LINE":
        annual_dep = (purchase_cost - salvage_value) / useful_life if useful_life else 0
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

@router.get("/fixed-assets")
async def get_fixed_assets(current_user: AuthenticatedUser = Depends(get_current_user), db = Depends(get_db)):
    try:
        assets = await db.fixed_assets.find().sort("assetCode", 1).to_list(length=None)
        result = []
        for a in assets:
            dep_logs = await db.depreciation_logs.find({"assetId": a["id"]}).to_list(length=None)
            for d in dep_logs: d["_id"] = str(d["_id"])
            maint_orders = await db.maintenance_orders.find({"assetId": a["id"]}).to_list(length=None)
            for m in maint_orders: m["_id"] = str(m["_id"])
            a["_id"] = str(a["_id"])
            a["depreciationLogs"] = dep_logs
            a["maintenanceOrders"] = maint_orders
            result.append(a)
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/fixed-assets", status_code=status.HTTP_201_CREATED)
async def create_fixed_asset(body: AssetCreate, req: Request, current_user: AuthenticatedUser = Depends(require_permission("assets:write")), db = Depends(get_db)):
    try:
        existing = await db.fixed_assets.find_one({"assetCode": body.assetCode})
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Conflict", "message": "Asset code already registered"})

        asset = {
            "id": str(uuid.uuid4()),
            "assetCode": body.assetCode,
            "name": body.name,
            "category": body.category,
            "location": body.location,
            "serialNo": body.serialNo,
            "purchaseDate": body.purchaseDate,
            "purchaseCost": float(body.purchaseCost),
            "salvageValue": float(body.salvageValue or 0.0),
            "usefulLifeYears": int(body.usefulLifeYears or 5),
            "depMethod": body.depMethod or "STRAIGHT_LINE",
            "depRate": float(body.depRate or 0.2),
            "currentBookValue": float(body.purchaseCost),
            "status": "ACTIVE",
            "createdAt": datetime.utcnow()
        }
        await db.fixed_assets.insert_one(asset)
        asset["_id"] = str(asset["_id"])

        await log_audit_event(
            user_id=current_user.id if hasattr(current_user, 'id') else current_user.get("id"),
            action="CREATE_FIXED_ASSET",
            resource="FixedAsset",
            details={"id": asset["id"], "assetCode": asset["assetCode"], "name": asset["name"]},
            req=req
        )

        return asset
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.get("")
async def get_assets_alias(current_user: AuthenticatedUser = Depends(get_current_user), db = Depends(get_db)):
    return await get_fixed_assets(current_user, db)

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_asset_alias(body: AssetCreate, req: Request, current_user: AuthenticatedUser = Depends(require_permission("assets:write")), db = Depends(get_db)):
    return await create_fixed_asset(body, req, current_user, db)

@router.get("/fixed-assets/{id}/depreciation")
async def get_asset_depreciation_ledger(id: str, current_user: AuthenticatedUser = Depends(get_current_user), db = Depends(get_db)):
    try:
        asset = await db.fixed_assets.find_one({"id": id})
        if not asset:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Not Found", "message": "Asset not found."})

        asset["_id"] = str(asset["_id"])
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
async def run_depreciation(id: str, current_user: AuthenticatedUser = Depends(require_permission("assets:write")), db = Depends(get_db)):
    try:
        asset = await db.fixed_assets.find_one({"id": id})
        if not asset:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Not Found", "message": "Asset not found."})

        year = datetime.utcnow().year
        opening_value = asset.get("currentBookValue", 0.0)

        if asset.get("depMethod") == "STRAIGHT_LINE":
            dep_amount = (asset.get("purchaseCost", 0.0) - asset.get("salvageValue", 0.0)) / asset.get("usefulLifeYears", 1)
        else:
            dep_amount = opening_value * asset.get("depRate", 0.2)

        dep_amount = min(dep_amount, max(0.0, opening_value - asset.get("salvageValue", 0.0)))
        closing_value = max(asset.get("salvageValue", 0.0), opening_value - dep_amount)

        log = {
            "id": str(uuid.uuid4()),
            "assetId": asset["id"],
            "year": year,
            "openingValue": opening_value,
            "depAmount": dep_amount,
            "closingValue": closing_value,
            "method": asset.get("depMethod"),
            "createdAt": datetime.utcnow()
        }
        await db.depreciation_logs.insert_one(log)
        
        await db.fixed_assets.update_one({"id": id}, {"$set": {"currentBookValue": closing_value}})
        
        log["_id"] = str(log["_id"])
        return log
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.patch("/fixed-assets/{id}/dispose")
async def dispose_fixed_asset(id: str, body: dict, current_user: AuthenticatedUser = Depends(require_permission("assets:write")), db = Depends(get_db)):
    disposal_value = body.get("disposalValue")
    try:
        asset = await db.fixed_assets.find_one({"id": id})
        if not asset:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Not Found", "message": "Asset not found."})

        updates = {
            "status": "DISPOSED",
            "disposalDate": datetime.utcnow(),
            "disposalValue": float(disposal_value) if disposal_value is not None else 0.0
        }
        await db.fixed_assets.update_one({"id": id}, {"$set": updates})
        asset.update(updates)
        asset["_id"] = str(asset["_id"])
        return asset
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.get("/maintenance-orders")
async def get_maintenance_orders(current_user: AuthenticatedUser = Depends(get_current_user), db = Depends(get_db)):
    try:
        orders = await db.maintenance_orders.find().sort("createdAt", -1).to_list(length=None)
        result = []
        for o in orders:
            asset = None
            if o.get("assetId"):
                asset = await db.fixed_assets.find_one({"id": o["assetId"]})
            
            o["_id"] = str(o["_id"])
            if asset:
                o["asset"] = {"id": asset["id"], "name": asset["name"], "assetCode": asset["assetCode"]}
            else:
                o["asset"] = None
            result.append(o)
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/maintenance-orders", status_code=status.HTTP_201_CREATED)
async def create_maintenance_order(body: dict, req: Request, current_user: AuthenticatedUser = Depends(require_permission("assets:write")), db = Depends(get_db)):
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
        
        order = {
            "id": str(uuid.uuid4()),
            "workOrderNo": workOrderNo,
            "assetId": assetId or None,
            "title": title,
            "description": description,
            "type": type_val,
            "priority": priority,
            "assignedTo": assignedTo,
            "scheduledDate": scheduledDate,
            "cost": float(cost) if cost is not None else 0.0,
            "status": "OPEN",
            "createdAt": datetime.utcnow()
        }
        await db.maintenance_orders.insert_one(order)
        order["_id"] = str(order["_id"])

        await log_audit_event(
            user_id=current_user.id if hasattr(current_user, 'id') else current_user.get("id"),
            action="CREATE_MAINTENANCE_ORDER",
            resource="MaintenanceOrder",
            details={"id": order["id"], "workOrderNo": order["workOrderNo"]},
            req=req
        )

        return order
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.patch("/maintenance-orders/{id}/status")
async def update_maintenance_status(id: str, body: dict, current_user: AuthenticatedUser = Depends(require_permission("assets:write")), db = Depends(get_db)):
    status_val = body.get("status")
    try:
        order = await db.maintenance_orders.find_one({"id": id})
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Not Found", "message": "Maintenance order not found"})

        updates = {"status": status_val}
        if status_val == "COMPLETED":
            updates["completedDate"] = datetime.utcnow()
            
        await db.maintenance_orders.update_one({"id": id}, {"$set": updates})
        order.update(updates)
        order["_id"] = str(order["_id"])
        return order
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})
