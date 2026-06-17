import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request

from app.utils.db import get_db
from app.utils.audit import log_audit_event
from app.middlewares.auth_middleware import get_current_user, require_permission, AuthenticatedUser

router = APIRouter(prefix="/procurement", tags=["Procurement"])

@router.get("/suppliers")
async def get_suppliers(current_user: AuthenticatedUser = Depends(get_current_user), db = Depends(get_db)):
    try:
        suppliers = await db.suppliers.find({"isActive": True}).sort("name", 1).to_list(length=None)
        for s in suppliers: s["_id"] = str(s["_id"])
        return suppliers
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/suppliers", status_code=status.HTTP_201_CREATED)
async def create_supplier(body: dict, req: Request, current_user: AuthenticatedUser = Depends(require_permission("procurement:write")), db = Depends(get_db)):
    name = body.get("name")
    contactInfo = body.get("contactInfo")
    rating = body.get("rating")
    paymentTerms = body.get("paymentTerms")

    if not name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": "Supplier name is required."})

    try:
        supplier = {
            "id": str(uuid.uuid4()),
            "name": name,
            "contactInfo": contactInfo,
            "rating": float(rating) if rating is not None else 0.0,
            "paymentTerms": paymentTerms or "Net 30",
            "isActive": True,
            "createdAt": datetime.utcnow()
        }
        await db.suppliers.insert_one(supplier)
        supplier["_id"] = str(supplier["_id"])

        await log_audit_event(
            user_id=current_user.id if hasattr(current_user, 'id') else current_user.get("id"),
            action="CREATE_SUPPLIER",
            resource="Supplier",
            details={"id": supplier["id"], "name": supplier["name"]},
            req=req
        )

        return supplier
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.get("/purchase-orders")
async def get_purchase_orders(current_user: AuthenticatedUser = Depends(get_current_user), db = Depends(get_db)):
    try:
        orders = await db.purchase_orders.find().sort("orderDate", -1).to_list(length=None)
        result = []
        for o in orders:
            supplier = await db.suppliers.find_one({"id": o["supplierId"]})
            o["_id"] = str(o["_id"])
            if supplier:
                o["supplier"] = {"id": supplier["id"], "name": supplier["name"]}
            else:
                o["supplier"] = None
            result.append(o)
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/purchase-orders", status_code=status.HTTP_201_CREATED)
async def create_purchase_order(body: dict, req: Request, current_user: AuthenticatedUser = Depends(require_permission("procurement:write")), db = Depends(get_db)):
    poNo = body.get("poNo")
    supplierId = body.get("supplierId")
    totalAmount = body.get("totalAmount")
    items = body.get("items", [])

    if not poNo or not supplierId or totalAmount is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": "PO Number, Supplier ID, and Total Amount are required."})

    try:
        po_id = str(uuid.uuid4())
        order = {
            "id": po_id,
            "poNo": poNo,
            "supplierId": supplierId,
            "totalAmount": float(totalAmount),
            "status": "DRAFT",
            "orderDate": datetime.utcnow(),
            "createdAt": datetime.utcnow()
        }
        await db.purchase_orders.insert_one(order)
        order["_id"] = str(order["_id"])

        if items:
            db_items = []
            for item in items:
                db_items.append({
                    "id": str(uuid.uuid4()),
                    "poId": po_id,
                    "productId": item.get("productId"),
                    "quantity": float(item.get("quantity", 0)),
                    "unitPrice": float(item.get("unitPrice", 0)),
                    "totalPrice": float(item.get("totalPrice", 0)),
                    "createdAt": datetime.utcnow()
                })
            await db.po_items.insert_many(db_items)

        await log_audit_event(
            user_id=current_user.id if hasattr(current_user, 'id') else current_user.get("id"),
            action="CREATE_PURCHASE_ORDER",
            resource="PurchaseOrder",
            details={"id": order["id"], "poNo": order["poNo"]},
            req=req
        )

        return order
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.patch("/purchase-orders/{id}/status")
async def update_po_status(id: str, body: dict, req: Request, current_user: AuthenticatedUser = Depends(require_permission("procurement:write")), db = Depends(get_db)):
    status_val = body.get("status")
    warehouseId = body.get("warehouseId")

    if not status_val:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": "Status is required."})

    try:
        order = await db.purchase_orders.find_one({"id": id})
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Not Found", "message": "Purchase order not found"})

        updates = {"status": status_val}
        
        if status_val == "RECEIVED":
            if not warehouseId:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": "Warehouse ID is required for receiving."})
            
            items = await db.po_items.find({"poId": id}).to_list(length=None)
            for it in items:
                if it.get("productId"):
                    tx = {
                        "id": str(uuid.uuid4()),
                        "productId": it["productId"],
                        "warehouseId": warehouseId,
                        "quantity": it["quantity"],
                        "unitCost": it["unitPrice"],
                        "type": "RECEIPT",
                        "referenceNo": f"PO-RECEIPT-{order['poNo']}",
                        "transactionDate": datetime.utcnow(),
                        "createdAt": datetime.utcnow()
                    }
                    await db.stock_transactions.insert_one(tx)
                    await db.products.update_one(
                        {"id": it["productId"]},
                        {"$inc": {"currentStock": it["quantity"]}}
                    )
                    
            updates["deliveryDate"] = datetime.utcnow()

        await db.purchase_orders.update_one({"id": id}, {"$set": updates})
        order.update(updates)
        order["_id"] = str(order["_id"])

        await log_audit_event(
            user_id=current_user.id if hasattr(current_user, 'id') else current_user.get("id"),
            action="UPDATE_PO_STATUS",
            resource="PurchaseOrder",
            details={"id": order["id"], "poNo": order["poNo"], "status": status_val},
            req=req
        )

        return order
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.get("/contracts")
async def get_contracts(current_user: AuthenticatedUser = Depends(get_current_user), db = Depends(get_db)):
    try:
        contracts = await db.supplier_contracts.find().sort("startDate", -1).to_list(length=None)
        result = []
        for c in contracts:
            supplier = await db.suppliers.find_one({"id": c["supplierId"]})
            c["_id"] = str(c["_id"])
            if supplier:
                c["supplier"] = {"id": supplier["id"], "name": supplier["name"]}
            else:
                c["supplier"] = None
            result.append(c)
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/contracts", status_code=status.HTTP_201_CREATED)
async def create_contract(body: dict, req: Request, current_user: AuthenticatedUser = Depends(require_permission("procurement:write")), db = Depends(get_db)):
    contractNo = body.get("contractNo")
    supplierId = body.get("supplierId")
    title = body.get("title")
    startDate_str = body.get("startDate")
    endDate_str = body.get("endDate")
    value = body.get("value")

    if not contractNo or not supplierId or not title:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": "Contract Number, Supplier, and Title are required."})

    try:
        startDate = datetime.fromisoformat(startDate_str.replace("Z", "+00:00")).replace(tzinfo=None) if startDate_str else None
        endDate = datetime.fromisoformat(endDate_str.replace("Z", "+00:00")).replace(tzinfo=None) if endDate_str else None

        contract = {
            "id": str(uuid.uuid4()),
            "contractNo": contractNo,
            "supplierId": supplierId,
            "title": title,
            "startDate": startDate,
            "endDate": endDate,
            "value": float(value) if value is not None else 0.0,
            "status": "ACTIVE",
            "createdAt": datetime.utcnow()
        }
        await db.supplier_contracts.insert_one(contract)
        contract["_id"] = str(contract["_id"])

        await log_audit_event(
            user_id=current_user.id if hasattr(current_user, 'id') else current_user.get("id"),
            action="CREATE_CONTRACT",
            resource="SupplierContract",
            details={"id": contract["id"], "contractNo": contract["contractNo"]},
            req=req
        )

        return contract
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})
