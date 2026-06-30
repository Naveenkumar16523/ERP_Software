import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal

from app.utils.db import get_db
from app.middlewares.rbac_middleware import get_current_rbac_user, require_module_access, RBACUser
from app.models.procurement_sql_models import Supplier, PurchaseOrder, POItem
from app.models.finance_sql_models import Budget

router = APIRouter(prefix="/procurement", tags=["Procurement"])

class POItemCreate(BaseModel):
    itemName: str
    quantity: int
    unitPrice: float

class POCreate(BaseModel):
    supplierId: str
    department: str
    budgetId: Optional[str] = None
    items: List[POItemCreate]

@router.get("/purchase-orders")
async def list_pos(
    status_filter: Optional[str] = None,
    current_user: RBACUser = Depends(require_module_access("procurement")),
    db: Session = Depends(get_db)
):
    query = db.query(PurchaseOrder)
    if status_filter:
        query = query.filter(PurchaseOrder.status == status_filter)
    pos = query.order_by(PurchaseOrder.createdAt.desc()).all()
    
    res = []
    for po in pos:
        items = db.query(POItem).filter(POItem.purchaseOrderId == po.id).all()
        supplier = db.query(Supplier).filter(Supplier.id == po.supplierId).first()
        po_dict = {
            "id": po.id,
            "poNumber": po.poNumber,
            "supplierId": po.supplierId,
            "supplierName": supplier.name if supplier else "Unknown Vendor",
            "department": po.department,
            "totalAmount": po.totalAmount,
            "status": po.status,
            "budgetDeducted": po.budgetDeducted,
            "budgetId": po.budgetId,
            "createdAt": po.createdAt,
            "items": [
                {
                    "id": item.id,
                    "itemName": item.itemName,
                    "quantity": item.quantity,
                    "unitPrice": item.unitPrice,
                    "receivedQuantity": item.receivedQuantity
                } for item in items
            ]
        }
        res.append(po_dict)
    return res

@router.post("/purchase-orders", status_code=status.HTTP_201_CREATED)
async def create_po(
    body: POCreate,
    current_user: RBACUser = Depends(require_module_access("procurement")),
    db: Session = Depends(get_db)
):
    supplier = db.query(Supplier).filter(Supplier.id == body.supplierId).first()
    if not supplier:
        # Auto create a dummy supplier if ID is a random string from UI
        supplier = Supplier(id=body.supplierId, name="Vendor " + body.supplierId[:4])
        db.add(supplier)
        db.commit()
        db.refresh(supplier)
        
    po_num = f"PO-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    total = sum(item.quantity * item.unitPrice for item in body.items)
    
    po = PurchaseOrder(
        poNumber=po_num,
        supplierId=supplier.id,
        department=body.department,
        totalAmount=total,
        status="Pending Approval",
        budgetId=body.budgetId
    )
    db.add(po)
    db.commit()
    db.refresh(po)
    
    for item in body.items:
        po_item = POItem(
            purchaseOrderId=po.id,
            itemName=item.itemName,
            quantity=item.quantity,
            unitPrice=item.unitPrice
        )
        db.add(po_item)
    db.commit()
    
    return {"message": "Purchase Order created", "id": po.id}

@router.patch("/purchase-orders/{po_id}/approve")
async def approve_po(
    po_id: str,
    current_user: RBACUser = Depends(require_module_access("procurement")),
    db: Session = Depends(get_db)
):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
        
    if po.status != "Pending Approval":
        raise HTTPException(status_code=400, detail="PO is not pending approval")
        
    if po.budgetId and not po.budgetDeducted:
        budget = db.query(Budget).filter(Budget.id == po.budgetId).first()
        if budget:
            if float(budget.spent) + float(po.totalAmount) > float(budget.amount):
                raise HTTPException(status_code=400, detail="Insufficient budget")
            budget.spent += Decimal(str(po.totalAmount))
            po.budgetDeducted = True
            
    po.status = "Approved"
    db.commit()
    db.refresh(po)
    return {"message": "PO Approved", "id": po.id}

class POItemReceive(BaseModel):
    receivedQuantity: int

@router.patch("/purchase-orders/items/{item_id}/receive")
async def receive_po_item(
    item_id: str,
    body: POItemReceive,
    current_user: RBACUser = Depends(require_module_access("procurement")),
    db: Session = Depends(get_db)
):
    item = db.query(POItem).filter(POItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == item.purchaseOrderId).first()
    if not po or po.status not in ["Approved", "Partially Received"]:
        raise HTTPException(status_code=400, detail="PO must be approved before receiving")
        
    item.receivedQuantity += body.receivedQuantity
    if item.receivedQuantity > item.quantity:
        item.receivedQuantity = item.quantity
        
    db.commit()
    
    # Check if all items in PO are fully received
    all_items = db.query(POItem).filter(POItem.purchaseOrderId == po.id).all()
    all_received = all(i.receivedQuantity >= i.quantity for i in all_items)
    
    if all_received:
        po.status = "Received"
    else:
        po.status = "Partially Received"
        
    db.commit()
    return {"message": "Item received updated", "poStatus": po.status}


@router.get("/suppliers")
async def get_suppliers():
    return [
        { "id": "SUP-001", "name": "Global Steel Co", "contact": "John Doe", "email": "john@globalsteel.com", "status": "ACTIVE", "rating": 4.8 },
        { "id": "SUP-002", "name": "TechParts Inc", "contact": "Jane Smith", "email": "jane@techparts.com", "status": "ACTIVE", "rating": 4.5 }
    ]

@router.post("/suppliers", status_code=status.HTTP_201_CREATED)
async def create_supplier(body: dict):
    return { "id": f"SUP-00{uuid.uuid4().hex[:2]}", **body, "status": "ACTIVE" }
