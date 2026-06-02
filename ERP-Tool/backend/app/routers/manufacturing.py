from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, func

from app.utils.db import get_db
from app.utils.audit import log_audit_event
from app.middlewares.auth_middleware import get_current_user, require_permission, AuthenticatedUser
from app.models.models import BillOfMaterials, BOMComponent, WorkCenter, ProductionOrder, OEELog, Product, StockTransaction
from app.models.schemas import OEELogCreate

router = APIRouter(prefix="/manufacturing", tags=["Manufacturing"])

# 1. BILL OF MATERIALS (BOM)

@router.get("/boms")
async def get_boms(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        boms = db.query(BillOfMaterials).order_by(BillOfMaterials.bomNo.asc()).all()
        result = []
        for b in boms:
            prod = db.query(Product).filter(Product.id == b.finishedProductId).first()
            components = db.query(BOMComponent).filter(BOMComponent.bomId == b.id).all()
            comp_list = []
            for c in components:
                c_prod = db.query(Product).filter(Product.id == c.productId).first()
                comp_list.append({
                    "id": c.id,
                    "bomId": c.bomId,
                    "productId": c.productId,
                    "quantity": c.quantity,
                    "product": {"id": c_prod.id, "code": c_prod.code, "name": c_prod.name} if c_prod else None
                })
            result.append({
                "id": b.id,
                "bomNo": b.bomNo,
                "finishedProductId": b.finishedProductId,
                "name": b.name,
                "quantity": b.quantity,
                "createdAt": b.createdAt,
                "updatedAt": b.updatedAt,
                "finishedProduct": {"id": prod.id, "code": prod.code, "name": prod.name} if prod else None,
                "components": comp_list
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/boms", status_code=status.HTTP_201_CREATED)
async def create_bom(body: dict, req: Request, current_user: AuthenticatedUser = Depends(require_permission("manufacturing:write")), db: Session = Depends(get_db)):
    bomNo = body.get("bomNo")
    finishedProductId = body.get("finishedProductId")
    name = body.get("name")
    quantity = body.get("quantity")
    components = body.get("components") # List of { productId, quantity }

    if not bomNo or not finishedProductId or not name or not components or not isinstance(components, list) or len(components) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": "BOM Number, Finished Product, Name, and Component list are required."})

    try:
        # Create BOM
        bom = BillOfMaterials(
            bomNo=bomNo,
            finishedProductId=finishedProductId,
            name=name,
            quantity=float(quantity) if quantity is not None else 1.0
        )
        db.add(bom)
        db.flush()

        # Add components mapping
        for comp in components:
            db_comp = BOMComponent(
                bomId=bom.id,
                productId=comp["productId"],
                quantity=float(comp["quantity"])
            )
            db.add(db_comp)

        db.commit()
        db.refresh(bom)

        # Get serialized detailed BOM
        prod = db.query(Product).filter(Product.id == bom.finishedProductId).first()
        comps = db.query(BOMComponent).filter(BOMComponent.bomId == bom.id).all()
        comp_list = []
        for c in comps:
            c_prod = db.query(Product).filter(Product.id == c.productId).first()
            comp_list.append({
                "id": c.id,
                "productId": c.productId,
                "quantity": c.quantity,
                "product": {"id": c_prod.id, "name": c_prod.name} if c_prod else None
            })

        full_bom = {
            "id": bom.id,
            "bomNo": bom.bomNo,
            "finishedProductId": bom.finishedProductId,
            "name": bom.name,
            "quantity": bom.quantity,
            "finishedProduct": {"id": prod.id, "name": prod.name} if prod else None,
            "components": comp_list
        }

        await log_audit_event(
            user_id=current_user.id,
            action="CREATE_BOM",
            resource="BillOfMaterials",
            details=full_bom,
            req=req
        )

        return full_bom
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 2. WORK CENTERS

@router.get("/work-centers")
async def get_work_centers(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        work_centers = db.query(WorkCenter).order_by(WorkCenter.name.asc()).all()
        return work_centers
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/work-centers", status_code=status.HTTP_201_CREATED)
async def create_work_center(body: dict, req: Request, current_user: AuthenticatedUser = Depends(require_permission("manufacturing:write")), db: Session = Depends(get_db)):
    name = body.get("name")
    capacityHours = body.get("capacityHours")
    laborRate = body.get("laborRate")
    machineRate = body.get("machineRate")
    efficiency = body.get("efficiency")

    if not name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": "Work Center name is required."})

    try:
        wc = WorkCenter(
            name=name,
            capacityHours=float(capacityHours) if capacityHours is not None else 8.0,
            laborRate=float(laborRate) if laborRate is not None else 0.0,
            machineRate=float(machineRate) if machineRate is not None else 0.0,
            efficiency=float(efficiency) if efficiency is not None else 1.0
        )
        db.add(wc)
        db.commit()
        db.refresh(wc)

        await log_audit_event(
            user_id=current_user.id,
            action="CREATE_WORK_CENTER",
            resource="WorkCenter",
            details={"id": wc.id, "name": wc.name},
            req=req
        )

        return wc
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 3. PRODUCTION ORDERS

@router.get("/production-orders")
async def get_production_orders(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        orders = db.query(ProductionOrder).order_by(ProductionOrder.orderNo.asc()).all()
        result = []
        for o in orders:
            prod = db.query(Product).filter(Product.id == o.finishedProductId).first()
            bom = db.query(BillOfMaterials).filter(BillOfMaterials.id == o.bomId).first()
            wc = db.query(WorkCenter).filter(WorkCenter.id == o.workCenterId).first() if o.workCenterId else None
            
            result.append({
                "id": o.id,
                "orderNo": o.orderNo,
                "finishedProductId": o.finishedProductId,
                "bomId": o.bomId,
                "workCenterId": o.workCenterId,
                "quantity": o.quantity,
                "status": o.status,
                "startDate": o.startDate,
                "endDate": o.endDate,
                "createdAt": o.createdAt,
                "updatedAt": o.updatedAt,
                "finishedProduct": {"id": prod.id, "code": prod.code, "name": prod.name} if prod else None,
                "bom": {"id": bom.id, "bomNo": bom.bomNo, "name": bom.name} if bom else None,
                "workCenter": {"id": wc.id, "name": wc.name} if wc else None
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/production-orders", status_code=status.HTTP_201_CREATED)
async def create_production_order(body: dict, req: Request, current_user: AuthenticatedUser = Depends(require_permission("manufacturing:write")), db: Session = Depends(get_db)):
    orderNo = body.get("orderNo")
    finishedProductId = body.get("finishedProductId")
    bomId = body.get("bomId")
    workCenterId = body.get("workCenterId")
    quantity = body.get("quantity")

    if not orderNo or not finishedProductId or not bomId or quantity is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": "Order Number, Finished Product, BOM, and Quantity are required."})

    try:
        order = ProductionOrder(
            orderNo=orderNo,
            finishedProductId=finishedProductId,
            bomId=bomId,
            workCenterId=workCenterId or None,
            quantity=float(quantity),
            status="PLANNED"
        )
        db.add(order)
        db.commit()
        db.refresh(order)

        await log_audit_event(
            user_id=current_user.id,
            action="CREATE_PRODUCTION_ORDER",
            resource="ProductionOrder",
            details={"id": order.id, "orderNo": order.orderNo, "quantity": order.quantity},
            req=req
        )

        return order
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.patch("/production-orders/{id}/status")
async def transition_production_status(id: str, body: dict, req: Request, current_user: AuthenticatedUser = Depends(require_permission("manufacturing:write")), db: Session = Depends(get_db)):
    status_val = body.get("status")
    warehouseId = body.get("warehouseId")

    if not status_val:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": "Status is required."})

    try:
        order = db.query(ProductionOrder).filter(ProductionOrder.id == id).first()
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Not Found", "message": "Production order not found."})

        if order.status == "COMPLETED":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": "Completed production orders cannot be changed."})

        if status_val == "COMPLETED":
            if not warehouseId:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": "Warehouse ID is required to complete production and update stock registers."})

            # Check components stock
            bom_components = db.query(BOMComponent).filter(BOMComponent.bomId == order.bomId).all()
            for comp in bom_components:
                prod = db.query(Product).filter(Product.id == comp.productId).first()
                needed = comp.quantity * order.quantity
                if not prod or prod.currentStock < needed:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail={"error": "Bad Request", "message": f"Insufficient stock for raw material: {prod.name if prod else comp.productId}. Needed: {needed}, Available: {prod.currentStock if prod else 0}"}
                    )

            # Consume raw materials and load finished goods inside transaction
            for comp in bom_components:
                qty_used = comp.quantity * order.quantity
                
                # Consume stock entry
                consume_tx = StockTransaction(
                    productId=comp.productId,
                    warehouseId=warehouseId,
                    quantity=-qty_used,
                    unitCost=0.0,
                    type="ISSUE",
                    referenceNo=f"PROD-CONSUME-{order.orderNo}"
                )
                db.add(consume_tx)
                
                # Update product stock
                comp_prod = db.query(Product).filter(Product.id == comp.productId).first()
                comp_prod.currentStock -= qty_used

            # Receive finished goods product
            fin_prod = db.query(Product).filter(Product.id == order.finishedProductId).first()
            receipt_tx = StockTransaction(
                productId=order.finishedProductId,
                warehouseId=warehouseId,
                quantity=order.quantity,
                unitCost=fin_prod.costPrice if fin_prod else 0.0,
                type="RECEIPT",
                referenceNo=f"PROD-RECEIPT-{order.orderNo}"
            )
            db.add(receipt_tx)
            
            if fin_prod:
                fin_prod.currentStock += order.quantity

            order.status = "COMPLETED"
            order.endDate = datetime.utcnow()
        else:
            order.status = status_val
            if status_val == "IN_PROGRESS":
                order.startDate = datetime.utcnow()

        db.commit()
        db.refresh(order)

        await log_audit_event(
            user_id=current_user.id,
            action="TRANSITION_PRODUCTION_ORDER",
            resource="ProductionOrder",
            details={"id": order.id, "orderNo": order.orderNo, "status": order.status},
            req=req
        )

        return order
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 4. OEE LOGGING AND ANALYTICS

@router.get("/oee")
async def get_oee_logs(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        logs = db.query(OEELog).order_by(desc(OEELog.date)).all()
        result = []
        for l in logs:
            wc = db.query(WorkCenter).filter(WorkCenter.id == l.workCenterId).first()
            result.append({
                "id": l.id,
                "workCenterId": l.workCenterId,
                "date": l.date,
                "plannedProductionTime": l.plannedProductionTime,
                "runTime": l.runTime,
                "plannedQuantity": l.plannedQuantity,
                "totalQuantity": l.totalQuantity,
                "goodQuantity": l.goodQuantity,
                "availability": l.availability,
                "performance": l.performance,
                "quality": l.quality,
                "oeeScore": l.oeeScore,
                "createdAt": l.createdAt,
                "workCenter": {"id": wc.id, "name": wc.name} if wc else None
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/oee/logs", status_code=status.HTTP_201_CREATED)
async def create_oee_log(body: OEELogCreate, req: Request, current_user: AuthenticatedUser = Depends(require_permission("manufacturing:write")), db: Session = Depends(get_db)):
    try:
        p_time = body.plannedProductionTime
        r_time = body.runTime
        p_qty = body.plannedQuantity
        t_qty = body.totalQuantity
        g_qty = body.goodQuantity

        # OEE metrics formula matching express
        availability = min(1.0, r_time / p_time)
        performance = min(1.0, (t_qty / p_qty) * (p_time / r_time)) if t_qty > 0 and r_time > 0 else 0.0
        quality = g_qty / t_qty if t_qty > 0 else 1.0
        oee_score = availability * performance * quality

        oee_log = OEELog(
            workCenterId=body.workCenterId,
            date=body.date,
            plannedProductionTime=p_time,
            runTime=r_time,
            plannedQuantity=p_qty,
            totalQuantity=t_qty,
            goodQuantity=g_qty,
            availability=availability,
            performance=performance,
            quality=quality,
            oeeScore=oee_score
        )
        db.add(oee_log)
        db.commit()
        db.refresh(oee_log)

        await log_audit_event(
            user_id=current_user.id,
            action="CREATE_OEE_LOG",
            resource="OEELog",
            details={"id": oee_log.id, "workCenterId": oee_log.workCenterId, "oeeScore": oee_log.oeeScore},
            req=req
        )

        return oee_log
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})
