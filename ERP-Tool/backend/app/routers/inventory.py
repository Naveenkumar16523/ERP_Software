from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from app.utils.db import get_db
from app.middlewares.auth_middleware import require_permission, AuthenticatedUser
from app.utils.audit import log_audit_event
import uuid
from datetime import datetime

from app.models.inventory_sql_models import Warehouse, StoreInventory, StockTransaction, InventoryBatch
from app.models.ecommerce_sql_models import StoreProduct

router = APIRouter(prefix="/inventory", tags=["Inventory"])

@router.get("/products")
async def get_inventory_products(db: Session = Depends(get_db), current_user: AuthenticatedUser = Depends(require_permission("inventory:read"))):
    # Join StoreInventory with StoreProduct
    inventory_items = db.query(StoreInventory, StoreProduct).join(StoreProduct, StoreInventory.productId == StoreProduct.id).all()
    
    result = []
    for inv, prod in inventory_items:
        result.append({
            "id": inv.id,
            "productId": prod.id,
            "name": prod.name,
            "sku": prod.sku,
            "currentStock": inv.currentStock,
            "reorderLevel": inv.reorderLevel,
            "barcode": inv.barcode,
            "costPrice": inv.costPrice,
            "warehouseId": inv.warehouseId,
            "category": prod.category
        })
    return result

@router.post("/products")
async def create_inventory_product(body: dict, db: Session = Depends(get_db), current_user: AuthenticatedUser = Depends(require_permission("inventory:write"))):
    product_id = body.get("productId")
    warehouse_id = body.get("warehouseId")
    if not product_id or not warehouse_id:
        raise HTTPException(status_code=400, detail="productId and warehouseId are required")

    barcode = body.get("barcode")
    if not barcode:
        prod = db.query(StoreProduct).filter(StoreProduct.id == product_id).first()
        sku_prefix = prod.sku if prod and prod.sku else "PRD"
        barcode = f"{sku_prefix}-{str(uuid.uuid4())[:6].upper()}"

    inv = StoreInventory(
        productId=product_id,
        warehouseId=warehouse_id,
        currentStock=int(body.get("currentStock", 0)),
        reorderLevel=int(body.get("reorderLevel", 10)),
        barcode=barcode,
        costPrice=float(body.get("costPrice", 0.0))
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)
    return inv

@router.get("/warehouses")
async def get_warehouses(db: Session = Depends(get_db), current_user: AuthenticatedUser = Depends(require_permission("inventory:read"))):
    return db.query(Warehouse).all()

@router.post("/warehouses")
async def create_warehouse(body: dict, db: Session = Depends(get_db), current_user: AuthenticatedUser = Depends(require_permission("inventory:write"))):
    w = Warehouse(
        name=body.get("name"),
        location=body.get("location")
    )
    db.add(w)
    db.commit()
    db.refresh(w)
    return w

@router.get("/stock-transactions")
async def get_stock_transactions(db: Session = Depends(get_db), current_user: AuthenticatedUser = Depends(require_permission("inventory:read"))):
    # Join to get product names for frontend
    txs = db.query(StockTransaction, StoreInventory, StoreProduct).join(
        StoreInventory, StockTransaction.inventoryId == StoreInventory.id
    ).join(
        StoreProduct, StoreInventory.productId == StoreProduct.id
    ).order_by(StockTransaction.timestamp.desc()).limit(100).all()

    return [{
        "id": t[0].id,
        "type": t[0].type,
        "quantity": t[0].quantity,
        "referenceId": t[0].referenceId,
        "notes": t[0].notes,
        "timestamp": t[0].timestamp,
        "productName": t[2].name,
        "sku": t[2].sku
    } for t in txs]

@router.post("/stock-transactions")
async def create_stock_transaction(body: dict, req: Request, db: Session = Depends(get_db), current_user: AuthenticatedUser = Depends(require_permission("inventory:write"))):
    inv_id = body.get("inventoryId")
    type_ = body.get("type")
    qty = body.get("quantity")
    
    if not inv_id or not type_ or not qty:
        raise HTTPException(status_code=400, detail="inventoryId, type, and quantity are required")

    inv = db.query(StoreInventory).filter(StoreInventory.id == inv_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    if type_ == "OUT" and inv.currentStock < qty:
        raise HTTPException(status_code=400, detail="Insufficient stock")

    tx = StockTransaction(
        inventoryId=inv_id,
        type=type_,
        quantity=qty,
        referenceId=body.get("referenceId"),
        notes=body.get("notes")
    )
    
    if type_ == "IN":
        inv.currentStock += qty
    else:
        inv.currentStock -= qty

    # Also update global StoreProduct stock
    prod = db.query(StoreProduct).filter(StoreProduct.id == inv.productId).first()
    if prod:
        if type_ == "IN":
            prod.stock += qty
        else:
            prod.stock -= qty

    db.add(tx)
    db.commit()
    db.refresh(tx)
    
    await log_audit_event(
        user_id=current_user.id if hasattr(current_user, 'id') else current_user.get("id"),
        action="STOCK_ADJUSTMENT",
        resource="StoreInventory",
        details={"inventoryId": inv_id, "type": type_, "quantity": qty},
        req=req
    )

    return tx

@router.get("/batches")
async def get_batches(db: Session = Depends(get_db), current_user: AuthenticatedUser = Depends(require_permission("inventory:read"))):
    batches = db.query(InventoryBatch, StoreInventory, StoreProduct).join(
        StoreInventory, InventoryBatch.inventoryId == StoreInventory.id
    ).join(
        StoreProduct, StoreInventory.productId == StoreProduct.id
    ).all()
    
    return [{
        "id": b[0].id,
        "batchNumber": b[0].batchNumber,
        "expiryDate": b[0].expiryDate,
        "currentStock": b[0].currentStock,
        "productName": b[2].name,
        "sku": b[2].sku
    } for b in batches]

@router.post("/batches")
async def create_batch(body: dict, db: Session = Depends(get_db), current_user: AuthenticatedUser = Depends(require_permission("inventory:write"))):
    b = InventoryBatch(
        inventoryId=body.get("inventoryId"),
        batchNumber=body.get("batchNumber"),
        expiryDate=datetime.fromisoformat(body.get("expiryDate").replace('Z', '+00:00')) if body.get("expiryDate") else None,
        currentStock=int(body.get("currentStock", 0))
    )
    db.add(b)
    db.commit()
    db.refresh(b)
    return b
