from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.utils.db import get_db
from app.utils.audit import log_audit_event
from app.middlewares.auth_middleware import get_current_user, require_permission, AuthenticatedUser
from app.models.models import Product, Warehouse, StockTransaction
from app.models.schemas import ProductCreate, ProductUpdate, WarehouseCreate, StockTransactionCreate

router = APIRouter(prefix="/inventory", tags=["Inventory"])

# 1. PRODUCTS

@router.get("/products")
async def get_products(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        products = db.query(Product).order_by(Product.code.asc()).all()
        return products
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/products", status_code=status.HTTP_201_CREATED)
async def create_product(body: ProductCreate, req: Request, current_user: AuthenticatedUser = Depends(require_permission("inventory:write")), db: Session = Depends(get_db)):
    try:
        # Check if code already exists
        existing = db.query(Product).filter(Product.code == body.code).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Conflict", "message": "Product code already exists"})
            
        product = Product(
            code=body.code,
            name=body.name,
            description=body.description,
            type=body.type,
            reorderPoint=body.reorderPoint,
            safetyStock=body.safetyStock,
            costPrice=body.costPrice,
            salePrice=body.salePrice,
            expiryDate=body.expiryDate
        )
        db.add(product)
        db.commit()
        db.refresh(product)

        await log_audit_event(
            user_id=current_user.id,
            action="CREATE_PRODUCT",
            resource="Product",
            details={
                "id": product.id,
                "code": product.code,
                "name": product.name
            },
            req=req
        )

        return product
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.put("/products/{id}")
async def update_product(id: str, body: ProductUpdate, req: Request, current_user: AuthenticatedUser = Depends(require_permission("inventory:write")), db: Session = Depends(get_db)):
    try:
        product = db.query(Product).filter(Product.id == id).first()
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Not Found", "message": "Product not found"})

        product.code = body.code
        product.name = body.name
        product.description = body.description
        product.type = body.type
        product.reorderPoint = body.reorderPoint
        product.safetyStock = body.safetyStock
        product.costPrice = body.costPrice
        product.salePrice = body.salePrice
        product.expiryDate = body.expiryDate
        
        db.commit()
        db.refresh(product)

        await log_audit_event(
            user_id=current_user.id,
            action="UPDATE_PRODUCT",
            resource="Product",
            details={
                "id": product.id,
                "code": product.code,
                "name": product.name
            },
            req=req
        )

        return product
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 2. WAREHOUSES

@router.get("/warehouses")
async def get_warehouses(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        warehouses = db.query(Warehouse).order_by(Warehouse.name.asc()).all()
        return warehouses
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/warehouses", status_code=status.HTTP_201_CREATED)
async def create_warehouse(body: WarehouseCreate, req: Request, current_user: AuthenticatedUser = Depends(require_permission("inventory:write")), db: Session = Depends(get_db)):
    try:
        existing = db.query(Warehouse).filter(Warehouse.name == body.name).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Conflict", "message": "Warehouse name already exists"})

        warehouse = Warehouse(
            name=body.name,
            location=body.location
        )
        db.add(warehouse)
        db.commit()
        db.refresh(warehouse)

        await log_audit_event(
            user_id=current_user.id,
            action="CREATE_WAREHOUSE",
            resource="Warehouse",
            details={
                "id": warehouse.id,
                "name": warehouse.name
            },
            req=req
        )

        return warehouse
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 3. STOCK TRANSACTIONS

@router.get("/transactions")
async def get_transactions(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        transactions = db.query(StockTransaction).order_by(desc(StockTransaction.transactionDate)).all()
        result = []
        for t in transactions:
            prod = db.query(Product).filter(Product.id == t.productId).first()
            wh = db.query(Warehouse).filter(Warehouse.id == t.warehouseId).first()
            result.append({
                "id": t.id,
                "productId": t.productId,
                "warehouseId": t.warehouseId,
                "quantity": t.quantity,
                "unitCost": t.unitCost,
                "type": t.type,
                "referenceNo": t.referenceNo,
                "transactionDate": t.transactionDate,
                "product": {"id": prod.id, "code": prod.code, "name": prod.name} if prod else None,
                "warehouse": {"id": wh.id, "name": wh.name} if wh else None
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/transactions", status_code=status.HTTP_201_CREATED)
async def create_transaction(body: StockTransactionCreate, req: Request, current_user: AuthenticatedUser = Depends(require_permission("inventory:write")), db: Session = Depends(get_db)):
    try:
        # Enforce existence checks
        product = db.query(Product).filter(Product.id == body.productId).first()
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Not Found", "message": "Product not found"})

        warehouse = db.query(Warehouse).filter(Warehouse.id == body.warehouseId).first()
        if not warehouse:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Not Found", "message": "Warehouse not found"})

        # Net quantity calculation
        qty = float(body.quantity)
        net_qty_change = qty if body.type == "RECEIPT" else -abs(qty)

        # Enforce issue limits
        if body.type == "ISSUE" and product.currentStock < abs(qty):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail={"error": "Bad Request", "message": f"Insufficient stock. Current stock is {product.currentStock}, requested {abs(qty)}"}
            )

        cost = float(body.unitCost) if body.unitCost and float(body.unitCost) > 0 else product.costPrice

        # Run inside standard database transaction block
        tx_obj = StockTransaction(
            productId=body.productId,
            warehouseId=body.warehouseId,
            quantity=net_qty_change,
            unitCost=cost,
            type=body.type,
            referenceNo=body.referenceNo
        )
        db.add(tx_obj)
        
        # Adjust product stock
        product.currentStock += net_qty_change
        
        db.commit()
        db.refresh(tx_obj)

        await log_audit_event(
            user_id=current_user.id,
            action="STOCK_TRANSACTION",
            resource="StockTransaction",
            details={
                "id": tx_obj.id,
                "productId": tx_obj.productId,
                "quantity": tx_obj.quantity,
                "type": tx_obj.type
            },
            req=req
        )

        return tx_obj
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 4. INVENTORY ALERTS (SAFETY STOCK + EXPIRY ALARMS)

@router.get("/alerts")
async def get_alerts(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        products = db.query(Product).all()
        
        reorder_alerts = [p for p in products if p.currentStock <= p.reorderPoint]
        
        thirty_days_later = datetime.utcnow() + timedelta(days=30)
        now = datetime.utcnow()
        
        expiry_alarms = []
        for p in products:
            if p.expiryDate:
                # timezone-naive comparison matching database utc timestamps
                if now <= p.expiryDate <= thirty_days_later:
                    expiry_alarms.append(p)
                    
        return {
            "reorderAlerts": reorder_alerts,
            "expiryAlarms": expiry_alarms
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 5. FIFO & LIFO VALUATION COMPARISON

@router.get("/valuation")
async def get_valuation(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        products = db.query(Product).all()
        valuations = []

        for prod in products:
            transactions = db.query(StockTransaction).filter(
                StockTransaction.productId == prod.id
            ).order_by(StockTransaction.transactionDate.asc()).all()

            # FIFO Queue calculation
            fifo_queue = []
            for tx in transactions:
                if tx.quantity > 0:
                    fifo_queue.append({"qty": tx.quantity, "cost": tx.unitCost})
                elif tx.quantity < 0:
                    to_issue = abs(tx.quantity)
                    while to_issue > 0 and len(fifo_queue) > 0:
                        first = fifo_queue[0]
                        if first["qty"] <= to_issue:
                            to_issue -= first["qty"]
                            fifo_queue.pop(0)
                        else:
                            first["qty"] -= to_issue
                            to_issue = 0
            fifo_val = sum(item["qty"] * item["cost"] for item in fifo_queue)

            # LIFO Stack calculation
            lifo_stack = []
            for tx in transactions:
                if tx.quantity > 0:
                    lifo_stack.append({"qty": tx.quantity, "cost": tx.unitCost})
                elif tx.quantity < 0:
                    to_issue = abs(tx.quantity)
                    while to_issue > 0 and len(lifo_stack) > 0:
                        last = lifo_stack[-1]
                        if last["qty"] <= to_issue:
                            to_issue -= last["qty"]
                            lifo_stack.pop()
                        else:
                            last["qty"] -= to_issue
                            to_issue = 0
            lifo_val = sum(item["qty"] * item["cost"] for item in lifo_stack)

            valuations.append({
                "id": prod.id,
                "code": prod.code,
                "name": prod.name,
                "currentStock": prod.currentStock,
                "fifoValue": fifo_val,
                "lifoValue": lifo_val,
                "difference": fifo_val - lifo_val
            })

        grand_total_fifo = sum(r["fifoValue"] for r in valuations)
        grand_total_lifo = sum(r["lifoValue"] for r in valuations)

        return {
            "valuations": valuations,
            "totals": {
                "fifo": grand_total_fifo,
                "lifo": grand_total_lifo,
                "difference": grand_total_fifo - grand_total_lifo
            }
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})
