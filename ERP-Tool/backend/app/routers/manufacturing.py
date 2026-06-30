import uuid
import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request

from app.utils.db import get_db
from app.utils.audit import log_audit_event
from app.middlewares.auth_middleware import get_current_user, require_permission, AuthenticatedUser
from app.models.schemas import OEELogCreate

router = APIRouter(prefix="/manufacturing", tags=["Manufacturing"])

@router.get("/boms")
async def get_boms(current_user: AuthenticatedUser = Depends(get_current_user), db = Depends(get_db)):
    try:
        boms = await db.bill_of_materials.find().sort("bomNo", 1).to_list(length=None)
        result = []
        for b in boms:
            prod = await db.products.find_one({"id": b["finishedProductId"]})
            components = await db.bom_components.find({"bomId": b["id"]}).to_list(length=None)
            comp_list = []
            for c in components:
                c_prod = await db.products.find_one({"id": c["productId"]})
                comp_list.append({
                    "id": c["id"],
                    "bomId": c["bomId"],
                    "productId": c["productId"],
                    "quantity": c["quantity"],
                    "product": {"id": c_prod["id"], "code": c_prod.get("code"), "name": c_prod.get("name")} if c_prod else None
                })
            b["_id"] = str(b["_id"])
            result.append({
                "id": b["id"],
                "bomNo": b["bomNo"],
                "finishedProductId": b["finishedProductId"],
                "name": b["name"],
                "quantity": b.get("quantity", 1),
                "createdAt": b.get("createdAt"),
                "updatedAt": b.get("updatedAt"),
                "finishedProduct": {"id": prod["id"], "code": prod.get("code"), "name": prod.get("name")} if prod else None,
                "components": comp_list
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/boms", status_code=status.HTTP_201_CREATED)
async def create_bom(body: dict, req: Request, current_user: AuthenticatedUser = Depends(require_permission("manufacturing:write")), db = Depends(get_db)):
    bomNo = body.get("bomNo")
    finishedProductId = body.get("finishedProductId")
    name = body.get("name")
    quantity = body.get("quantity")
    components = body.get("components")

    if not bomNo or not finishedProductId or not name or not components or not isinstance(components, list) or len(components) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": "BOM Number, Finished Product, Name, and Component list are required."})

    try:
        bom_id = str(uuid.uuid4())
        bom = {
            "id": bom_id,
            "bomNo": bomNo,
            "finishedProductId": finishedProductId,
            "name": name,
            "quantity": float(quantity) if quantity is not None else 1.0,
            "createdAt": datetime.utcnow()
        }
        await db.bill_of_materials.insert_one(bom)

        for comp in components:
            db_comp = {
                "id": str(uuid.uuid4()),
                "bomId": bom_id,
                "productId": comp["productId"],
                "quantity": float(comp["quantity"]),
                "createdAt": datetime.utcnow()
            }
            await db.bom_components.insert_one(db_comp)

        prod = await db.products.find_one({"id": finishedProductId})
        comps = await db.bom_components.find({"bomId": bom_id}).to_list(length=None)
        comp_list = []
        for c in comps:
            c_prod = await db.products.find_one({"id": c["productId"]})
            comp_list.append({
                "id": c["id"],
                "productId": c["productId"],
                "quantity": c["quantity"],
                "product": {"id": c_prod["id"], "name": c_prod.get("name")} if c_prod else None
            })

        full_bom = {
            "id": bom_id,
            "bomNo": bomNo,
            "finishedProductId": finishedProductId,
            "name": name,
            "quantity": bom["quantity"],
            "finishedProduct": {"id": prod["id"], "name": prod.get("name")} if prod else None,
            "components": comp_list
        }

        await log_audit_event(
            user_id=current_user.id if hasattr(current_user, 'id') else current_user.get("id"),
            action="CREATE_BOM",
            resource="BillOfMaterials",
            details=full_bom,
            req=req
        )

        return full_bom
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.get("/work-centers")
async def get_work_centers(current_user: AuthenticatedUser = Depends(get_current_user), db = Depends(get_db)):
    try:
        work_centers = await db.work_centers.find().sort("name", 1).to_list(length=None)
        for w in work_centers: w["_id"] = str(w["_id"])
        return work_centers
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/work-centers", status_code=status.HTTP_201_CREATED)
async def create_work_center(body: dict, req: Request, current_user: AuthenticatedUser = Depends(require_permission("manufacturing:write")), db = Depends(get_db)):
    name = body.get("name")
    capacityHours = body.get("capacityHours")
    laborRate = body.get("laborRate")
    machineRate = body.get("machineRate")
    efficiency = body.get("efficiency")

    if not name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": "Work Center name is required."})

    try:
        wc = {
            "id": str(uuid.uuid4()),
            "name": name,
            "capacityHours": float(capacityHours) if capacityHours is not None else 8.0,
            "laborRate": float(laborRate) if laborRate is not None else 0.0,
            "machineRate": float(machineRate) if machineRate is not None else 0.0,
            "efficiency": float(efficiency) if efficiency is not None else 1.0,
            "createdAt": datetime.utcnow()
        }
        await db.work_centers.insert_one(wc)
        wc["_id"] = str(wc["_id"])

        await log_audit_event(
            user_id=current_user.id if hasattr(current_user, 'id') else current_user.get("id"),
            action="CREATE_WORK_CENTER",
            resource="WorkCenter",
            details={"id": wc["id"], "name": wc["name"]},
            req=req
        )

        return wc
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.get("/production-orders")
async def get_production_orders(current_user: AuthenticatedUser = Depends(get_current_user), db = Depends(get_db)):
    try:
        orders = await db.production_orders.find().sort("orderNo", 1).to_list(length=None)
        result = []
        for o in orders:
            prod = await db.products.find_one({"id": o["finishedProductId"]})
            bom = await db.bill_of_materials.find_one({"id": o["bomId"]})
            wc = None
            if o.get("workCenterId"):
                wc = await db.work_centers.find_one({"id": o["workCenterId"]})
            
            result.append({
                "id": o["id"],
                "orderNo": o["orderNo"],
                "finishedProductId": o["finishedProductId"],
                "bomId": o["bomId"],
                "workCenterId": o.get("workCenterId"),
                "quantity": o["quantity"],
                "status": o["status"],
                "startDate": o.get("startDate"),
                "endDate": o.get("endDate"),
                "createdAt": o.get("createdAt"),
                "updatedAt": o.get("updatedAt"),
                "finishedProduct": {"id": prod["id"], "code": prod.get("code"), "name": prod.get("name")} if prod else None,
                "bom": {"id": bom["id"], "bomNo": bom.get("bomNo"), "name": bom.get("name")} if bom else None,
                "workCenter": {"id": wc["id"], "name": wc.get("name")} if wc else None
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/production-orders", status_code=status.HTTP_201_CREATED)
async def create_production_order(body: dict, req: Request, current_user: AuthenticatedUser = Depends(require_permission("manufacturing:write")), db = Depends(get_db)):
    orderNo = body.get("orderNo")
    finishedProductId = body.get("finishedProductId")
    bomId = body.get("bomId")
    workCenterId = body.get("workCenterId")
    quantity = body.get("quantity")

    if not orderNo or not finishedProductId or not bomId or quantity is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": "Order Number, Finished Product, BOM, and Quantity are required."})

    try:
        order = {
            "id": str(uuid.uuid4()),
            "orderNo": orderNo,
            "finishedProductId": finishedProductId,
            "bomId": bomId,
            "workCenterId": workCenterId or None,
            "quantity": float(quantity),
            "status": "PLANNED",
            "createdAt": datetime.utcnow()
        }
        await db.production_orders.insert_one(order)
        order["_id"] = str(order["_id"])

        await log_audit_event(
            user_id=current_user.id if hasattr(current_user, 'id') else current_user.get("id"),
            action="CREATE_PRODUCTION_ORDER",
            resource="ProductionOrder",
            details={"id": order["id"], "orderNo": order["orderNo"], "quantity": order["quantity"]},
            req=req
        )

        return order
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.patch("/production-orders/{id}/status")
async def transition_production_status(id: str, body: dict, req: Request, current_user: AuthenticatedUser = Depends(require_permission("manufacturing:write")), db = Depends(get_db)):
    status_val = body.get("status")
    warehouseId = body.get("warehouseId")

    if not status_val:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": "Status is required."})

    try:
        order = await db.production_orders.find_one({"id": id})
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Not Found", "message": "Production order not found."})

        if order.get("status") == "COMPLETED":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": "Completed production orders cannot be changed."})

        updates = {}
        if status_val == "COMPLETED":
            if not warehouseId:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": "Warehouse ID is required to complete production and update stock registers."})

            # Check components stock
            bom_components = await db.bom_components.find({"bomId": order["bomId"]}).to_list(length=None)
            for comp in bom_components:
                prod = await db.products.find_one({"id": comp["productId"]})
                needed = comp["quantity"] * order["quantity"]
                prod_stock = prod.get("currentStock", 0) if prod else 0
                if not prod or prod_stock < needed:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail={"error": "Bad Request", "message": f"Insufficient stock for raw material: {prod.get('name') if prod else comp['productId']}. Needed: {needed}, Available: {prod_stock}"}
                    )

            # Consume raw materials and load finished goods
            for comp in bom_components:
                qty_used = comp["quantity"] * order["quantity"]
                
                # Consume stock entry
                consume_tx = {
                    "id": str(uuid.uuid4()),
                    "productId": comp["productId"],
                    "warehouseId": warehouseId,
                    "quantity": -qty_used,
                    "unitCost": 0.0,
                    "type": "ISSUE",
                    "referenceNo": f"PROD-CONSUME-{order['orderNo']}",
                    "transactionDate": datetime.utcnow(),
                    "createdAt": datetime.utcnow()
                }
                await db.stock_transactions.insert_one(consume_tx)
                
                # Update product stock
                await db.products.update_one(
                    {"id": comp["productId"]},
                    {"$inc": {"currentStock": -qty_used}}
                )

            # Receive finished goods product
            fin_prod = await db.products.find_one({"id": order["finishedProductId"]})
            receipt_tx = {
                "id": str(uuid.uuid4()),
                "productId": order["finishedProductId"],
                "warehouseId": warehouseId,
                "quantity": order["quantity"],
                "unitCost": fin_prod.get("costPrice", 0.0) if fin_prod else 0.0,
                "type": "RECEIPT",
                "referenceNo": f"PROD-RECEIPT-{order['orderNo']}",
                "transactionDate": datetime.utcnow(),
                "createdAt": datetime.utcnow()
            }
            await db.stock_transactions.insert_one(receipt_tx)
            
            if fin_prod:
                await db.products.update_one(
                    {"id": order["finishedProductId"]},
                    {"$inc": {"currentStock": order["quantity"]}}
                )

            updates["status"] = "COMPLETED"
            updates["endDate"] = datetime.utcnow()
        else:
            updates["status"] = status_val
            if status_val == "IN_PROGRESS":
                updates["startDate"] = datetime.utcnow()

        await db.production_orders.update_one({"id": id}, {"$set": updates})
        order.update(updates)
        order["_id"] = str(order["_id"])

        await log_audit_event(
            user_id=current_user.id if hasattr(current_user, 'id') else current_user.get("id"),
            action="TRANSITION_PRODUCTION_ORDER",
            resource="ProductionOrder",
            details={"id": order["id"], "orderNo": order["orderNo"], "status": order["status"]},
            req=req
        )

        return order
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.get("/oee")
async def get_oee_logs(current_user: AuthenticatedUser = Depends(get_current_user), db = Depends(get_db)):
    try:
        logs = await db.oee_logs.find().sort("date", -1).to_list(length=None)
        result = []
        for l in logs:
            wc = await db.work_centers.find_one({"id": l["workCenterId"]})
            l["_id"] = str(l["_id"])
            l["workCenter"] = {"id": wc["id"], "name": wc.get("name")} if wc else None
            result.append(l)
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/oee/logs", status_code=status.HTTP_201_CREATED)
async def create_oee_log(body: OEELogCreate, req: Request, current_user: AuthenticatedUser = Depends(require_permission("manufacturing:write")), db = Depends(get_db)):
    try:
        p_time = body.plannedProductionTime
        r_time = body.runTime
        p_qty = body.plannedQuantity
        t_qty = body.totalQuantity
        g_qty = body.goodQuantity

        availability = min(1.0, r_time / p_time) if p_time else 0.0
        performance = min(1.0, (t_qty / p_qty) * (p_time / r_time)) if t_qty > 0 and r_time > 0 and p_qty > 0 else 0.0
        quality = g_qty / t_qty if t_qty > 0 else 1.0
        oee_score = availability * performance * quality

        oee_log = {
            "id": str(uuid.uuid4()),
            "workCenterId": body.workCenterId,
            "date": body.date,
            "plannedProductionTime": p_time,
            "runTime": r_time,
            "plannedQuantity": p_qty,
            "totalQuantity": t_qty,
            "goodQuantity": g_qty,
            "availability": availability,
            "performance": performance,
            "quality": quality,
            "oeeScore": oee_score,
            "createdAt": datetime.utcnow()
        }
        await db.oee_logs.insert_one(oee_log)
        oee_log["_id"] = str(oee_log["_id"])

        await log_audit_event(
            user_id=current_user.id if hasattr(current_user, 'id') else current_user.get("id"),
            action="CREATE_OEE_LOG",
            resource="OEELog",
            details={"id": oee_log["id"], "workCenterId": oee_log["workCenterId"], "oeeScore": oee_log["oeeScore"]},
            req=req
        )

        return oee_log
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})


@router.get("/machines")
async def get_machines():
    return [
        { "id": "M-001", "name": "CNC Milling Center", "type": "Milling", "status": "OPERATIONAL", "efficiency": 92 },
        { "id": "M-002", "name": "Laser Cutter Alpha", "type": "Cutting", "status": "MAINTENANCE", "efficiency": 0 },
        { "id": "M-003", "name": "Assembly Robot Arm", "type": "Assembly", "status": "OPERATIONAL", "efficiency": 98 }
    ]

@router.post("/machines", status_code=status.HTTP_201_CREATED)
async def create_machine(body: dict):
    return { "id": f"M-00{uuid.uuid4().hex[:3]}", **body, "status": "OPERATIONAL" }

@router.patch("/machines/{id}/status")
async def update_machine_status(id: str, body: dict):
    return { "id": id, "status": body.get("status") }

@router.get("/work-orders")
async def get_work_orders():
    return [
        { "id": "WO-1001", "product": "Engine Block A", "quantity": 50, "status": "IN_PROGRESS", "progress": 60, "dueDate": datetime.utcnow().isoformat() + "Z" },
        { "id": "WO-1002", "product": "Steel Chassis", "quantity": 120, "status": "PLANNED", "progress": 0, "dueDate": datetime.utcnow().isoformat() + "Z" }
    ]

@router.post("/work-orders", status_code=status.HTTP_201_CREATED)
async def create_work_order(body: dict):
    return { "id": f"WO-10{uuid.uuid4().hex[:2]}", **body, "status": "PLANNED", "progress": 0 }

@router.patch("/work-orders/{id}/status")
async def update_work_order_status(id: str, body: dict):
    return { "id": id, "status": body.get("status") }

@router.get("/downtime")
async def get_downtime():
    return [
        { "id": "DL-001", "machineId": "M-002", "reason": "Scheduled Maintenance", "duration": 120, "date": datetime.utcnow().isoformat() + "Z" }
    ]

@router.post("/downtime", status_code=status.HTTP_201_CREATED)
async def create_downtime(body: dict):
    return { "id": f"DL-00{uuid.uuid4().hex[:2]}", **body }
