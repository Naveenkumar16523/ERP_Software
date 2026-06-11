import time
import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, func

from app.utils.db import get_db
from app.utils.audit import log_audit_event
from app.utils.crypto_ledger import calculate_block_hash
from app.middlewares.auth_middleware import get_current_user, require_permission, AuthenticatedUser
from app.models.models import Supplier, PurchaseRequisition, RFQ, PurchaseOrder, GoodsReceipt, SupplierInvoice, Account, JournalEntry

router = APIRouter(prefix="/procurement", tags=["Procurement"])

default_suppliers = [
    {"name": "Global Trade Inc", "email": "global@trade.com", "phone": "1234567890", "address": "123 Global Way", "deliveryScore": 95.0, "qualityScore": 98.0, "priceScore": 90.0, "overallScore": 94.3},
    {"name": "Acme Industrial Supplies", "email": "sales@acme.com", "phone": "2345678901", "address": "456 Industrial Pkwy", "deliveryScore": 88.0, "qualityScore": 90.0, "priceScore": 95.0, "overallScore": 91.0},
    {"name": "Apex Logistics & Goods", "email": "info@apexlogistics.com", "phone": "3456789012", "address": "789 Logistics Blvd", "deliveryScore": 72.0, "qualityScore": 85.0, "priceScore": 98.0, "overallScore": 85.0}
]

def seed_suppliers_if_empty(db: Session):
    # Seeding disabled to start completely empty
    pass

def update_account_balance(db: Session, account_id: str, amount: float, is_debit: bool):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        return
    if account.type in ["ASSET", "EXPENSE"]:
        balance_change = amount if is_debit else -amount
    else:
        balance_change = -amount if is_debit else amount
    account.balance += balance_change

# 1. SUPPLIERS

@router.get("/suppliers")
async def get_suppliers(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        seed_suppliers_if_empty(db)
        suppliers = db.query(Supplier).order_by(desc(Supplier.overallScore)).all()
        return suppliers
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/supplier", status_code=status.HTTP_201_CREATED)
async def create_supplier(body: dict, current_user: AuthenticatedUser = Depends(require_permission("procurement:write")), db: Session = Depends(get_db)):
    name = body.get("name")
    email = body.get("email")
    phone = body.get("phone")
    address = body.get("address")

    if not name or not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": "Missing name or email for supplier."})

    try:
        supplier = Supplier(name=name, email=email, phone=phone, address=address)
        db.add(supplier)
        db.commit()
        db.refresh(supplier)
        return supplier
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 2. PURCHASE REQUISITIONS

@router.get("/requisitions")
async def get_requisitions(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        requisitions = db.query(PurchaseRequisition).order_by(desc(PurchaseRequisition.createdAt)).all()
        return requisitions
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/requisition", status_code=status.HTTP_201_CREATED)
async def create_requisition(body: dict, current_user: AuthenticatedUser = Depends(require_permission("procurement:write")), db: Session = Depends(get_db)):
    requested_by = body.get("requestedBy")
    department = body.get("department")
    items = body.get("items")

    if not requested_by or not department or items is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": "Missing required requisition details."})

    try:
        count = db.query(func.count(PurchaseRequisition.id)).scalar()
        pr_no = f"PR-{int(time.time() * 1000)}-{count + 1}"
        items_str = items if isinstance(items, str) else json.dumps(items)

        pr = PurchaseRequisition(
            prNo=pr_no,
            requestedBy=requested_by,
            department=department,
            status="PENDING",
            items=items_str
        )
        db.add(pr)
        db.commit()
        db.refresh(pr)
        return pr
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 3. REQUEST FOR QUOTES (RFQs)

@router.get("/rfqs")
async def get_rfqs(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        rfqs = db.query(RFQ).order_by(desc(RFQ.createdAt)).all()
        result = []
        for rfq in rfqs:
            pr = db.query(PurchaseRequisition).filter(PurchaseRequisition.id == rfq.purchaseRequisitionId).first() if rfq.purchaseRequisitionId else None
            result.append({
                "id": rfq.id,
                "rfqNo": rfq.rfqNo,
                "purchaseRequisitionId": rfq.purchaseRequisitionId,
                "status": rfq.status,
                "items": rfq.items,
                "createdAt": rfq.createdAt,
                "updatedAt": rfq.updatedAt,
                "purchaseRequisition": {"id": pr.id, "prNo": pr.prNo} if pr else None
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/rfq", status_code=status.HTTP_201_CREATED)
async def create_rfq(body: dict, current_user: AuthenticatedUser = Depends(require_permission("procurement:write")), db: Session = Depends(get_db)):
    pr_id = body.get("purchaseRequisitionId")
    items = body.get("items")

    if items is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": "Missing items for RFQ."})

    try:
        count = db.query(func.count(RFQ.id)).scalar()
        rfq_no = f"RFQ-{int(time.time() * 1000)}-{count + 1}"
        items_str = items if isinstance(items, str) else json.dumps(items)

        rfq = RFQ(
            rfqNo=rfq_no,
            purchaseRequisitionId=pr_id or None,
            status="SENT",
            items=items_str
        )
        db.add(rfq)

        if pr_id:
            pr = db.query(PurchaseRequisition).filter(PurchaseRequisition.id == pr_id).first()
            if pr:
                pr.status = "APPROVED"

        db.commit()
        db.refresh(rfq)
        return rfq
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 4. PURCHASE ORDERS

@router.get("/purchase-orders")
async def get_purchase_orders(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        pos = db.query(PurchaseOrder).order_by(desc(PurchaseOrder.createdAt)).all()
        result = []
        for po in pos:
            sup = db.query(Supplier).filter(Supplier.id == po.supplierId).first()
            rfq = db.query(RFQ).filter(RFQ.id == po.rfqId).first() if po.rfqId else None
            result.append({
                "id": po.id,
                "poNo": po.poNo,
                "supplierId": po.supplierId,
                "rfqId": po.rfqId,
                "status": po.status,
                "items": po.items,
                "totalAmount": po.totalAmount,
                "createdAt": po.createdAt,
                "updatedAt": po.updatedAt,
                "supplier": {"id": sup.id, "name": sup.name} if sup else None,
                "rfq": {"id": rfq.id, "rfqNo": rfq.rfqNo} if rfq else None
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/purchase-order", status_code=status.HTTP_201_CREATED)
async def create_purchase_order(body: dict, current_user: AuthenticatedUser = Depends(require_permission("procurement:write")), db: Session = Depends(get_db)):
    supplierId = body.get("supplierId")
    rfqId = body.get("rfqId")
    items = body.get("items")
    totalAmount = body.get("totalAmount")

    if not supplierId or items is None or totalAmount is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": "Missing PO details."})

    try:
        count = db.query(func.count(PurchaseOrder.id)).scalar()
        po_no = f"PO-{int(time.time() * 1000)}-{count + 1}"
        items_str = items if isinstance(items, str) else json.dumps(items)

        po = PurchaseOrder(
            poNo=po_no,
            supplierId=supplierId,
            rfqId=rfqId or None,
            status="APPROVED",
            items=items_str,
            totalAmount=float(totalAmount)
        )
        db.add(po)

        if rfqId:
            rfq = db.query(RFQ).filter(RFQ.id == rfqId).first()
            if rfq:
                rfq.status = "CLOSED"

        db.commit()
        db.refresh(po)
        return po
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 5. GOODS RECEIPT NOTES (GRNs)

@router.get("/goods-receipts")
async def get_goods_receipts(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        grns = db.query(GoodsReceipt).order_by(desc(GoodsReceipt.createdAt)).all()
        result = []
        for grn in grns:
            po = db.query(PurchaseOrder).filter(PurchaseOrder.id == grn.purchaseOrderId).first()
            sup = db.query(Supplier).filter(Supplier.id == grn.supplierId).first()
            result.append({
                "id": grn.id,
                "grnNo": grn.grnNo,
                "purchaseOrderId": grn.purchaseOrderId,
                "supplierId": grn.supplierId,
                "receivedBy": grn.receivedBy,
                "receivedItems": grn.receivedItems,
                "createdAt": grn.createdAt,
                "purchaseOrder": {"id": po.id, "poNo": po.poNo} if po else None,
                "supplier": {"id": sup.id, "name": sup.name} if sup else None
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/goods-receipt", status_code=status.HTTP_201_CREATED)
async def create_goods_receipt(body: dict, current_user: AuthenticatedUser = Depends(require_permission("procurement:write")), db: Session = Depends(get_db)):
    po_id = body.get("purchaseOrderId")
    received_by = body.get("receivedBy")
    received_items = body.get("receivedItems")
    delay_days = body.get("deliveryDelayDays")

    if not po_id or not received_by or received_items is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": "Missing Goods Receipt details."})

    try:
        po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
        if not po:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Not Found", "message": "Purchase Order not found."})

        count = db.query(func.count(GoodsReceipt.id)).scalar()
        grn_no = f"GRN-{int(time.time() * 1000)}-{count + 1}"
        items_str = received_items if isinstance(received_items, str) else json.dumps(received_items)

        grn = GoodsReceipt(
            grnNo=grn_no,
            purchaseOrderId=po_id,
            supplierId=po.supplierId,
            receivedBy=received_by,
            receivedItems=items_str
        )
        db.add(grn)

        # Update PO status
        po.status = "SHIPPED"

        # Update supplier score rating
        supplier = db.query(Supplier).filter(Supplier.id == po.supplierId).first()
        if supplier:
            items_list = received_items if isinstance(received_items, list) else json.loads(received_items)
            total_items = 0
            defective_items = 0
            for item in items_list:
                qty_rec = item.get("qtyReceived") or 0
                total_items += qty_rec
                if item.get("qualityStatus") in ["DEFECTIVE", "REJECTED"]:
                    defective_items += qty_rec

            quality_score = ((total_items - defective_items) / total_items * 100) if total_items > 0 else 100.0
            new_quality = (supplier.qualityScore * 4 + quality_score) / 5

            delay = int(delay_days) if delay_days is not None else 0
            delivery_score = 100
            if delay == 1:
                delivery_score = 95
            elif delay == 2:
                delivery_score = 90
            elif delay == 3:
                delivery_score = 80
            elif delay > 3:
                delivery_score = max(40, 100 - delay * 10)

            new_delivery = (supplier.deliveryScore * 4 + delivery_score) / 5
            new_overall = (new_delivery + new_quality + supplier.priceScore) / 3

            supplier.qualityScore = new_quality
            supplier.deliveryScore = new_delivery
            supplier.overallScore = new_overall

        db.commit()
        db.refresh(grn)
        return grn
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 6. INVOICES & 3-WAY MATCHING

@router.get("/invoices")
async def get_supplier_invoices(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        invoices = db.query(SupplierInvoice).order_by(desc(SupplierInvoice.createdAt)).all()
        result = []
        for inv in invoices:
            po = db.query(PurchaseOrder).filter(PurchaseOrder.id == inv.purchaseOrderId).first()
            sup = db.query(Supplier).filter(Supplier.id == inv.supplierId).first()
            result.append({
                "id": inv.id,
                "invoiceNo": inv.invoiceNo,
                "purchaseOrderId": inv.purchaseOrderId,
                "supplierId": inv.supplierId,
                "items": inv.items,
                "totalAmount": inv.totalAmount,
                "taxAmount": inv.taxAmount,
                "status": inv.status,
                "matchingLog": inv.matchingLog,
                "createdAt": inv.createdAt,
                "purchaseOrder": {"id": po.id, "poNo": po.poNo} if po else None,
                "supplier": {"id": sup.id, "name": sup.name} if sup else None
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/invoice", status_code=status.HTTP_201_CREATED)
async def create_supplier_invoice(body: dict, req: Request, current_user: AuthenticatedUser = Depends(require_permission("procurement:write")), db: Session = Depends(get_db)):
    invoiceNo = body.get("invoiceNo")
    purchaseOrderId = body.get("purchaseOrderId")
    items = body.get("items")
    totalAmount = body.get("totalAmount")
    taxAmount = body.get("taxAmount") or 0.0

    if not invoiceNo or not purchaseOrderId or items is None or totalAmount is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": "Missing Invoice details."})

    try:
        po = db.query(PurchaseOrder).filter(PurchaseOrder.id == purchaseOrderId).first()
        if not po:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Not Found", "message": "Associated Purchase Order not found."})

        grns = db.query(GoodsReceipt).filter(GoodsReceipt.purchaseOrderId == purchaseOrderId).all()
        supplier = db.query(Supplier).filter(Supplier.id == po.supplierId).first()

        if not supplier:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Not Found", "message": "Supplier not found."})

        po_items = po.items if isinstance(po.items, list) else json.loads(po.items)
        invoice_items = items if isinstance(items, list) else json.loads(items)

        # Aggregate receipts qty map
        grn_qty_map = {}
        for grn in grns:
            grn_items = grn.receivedItems if isinstance(grn.receivedItems, list) else json.loads(grn.receivedItems)
            for rit in grn_items:
                item_id = rit.get("itemId")
                grn_qty_map[item_id] = grn_qty_map.get(item_id, 0) + (rit.get("qtyReceived") or 0)

        # Perform 3-way matching logic
        matching_logs = []
        match_passed = True
        price_discrepancy = 0.0

        for inv_it in invoice_items:
            item_id = inv_it.get("itemId")
            inv_qty = inv_it.get("qty") or 0
            inv_price = inv_it.get("price") or 0.0

            po_it = next((p for p in po_items if p.get("itemId") == item_id), None)
            total_received = grn_qty_map.get(item_id, 0)

            if not po_it:
                match_passed = False
                matching_logs.append(f"Item \"{item_id}\" was not part of the Purchase Order.")
                continue

            po_qty = po_it.get("qty") or 0
            po_price = po_it.get("price") or 0.0

            # 1. Compare vs PO qty
            if inv_qty > po_qty:
                match_passed = False
                matching_logs.append(f"Quantity overflow: Invoiced qty ({inv_qty}) exceeds PO qty ({po_qty}) for item \"{item_id}\".")

            # 2. Compare vs GRN qty
            if inv_qty > total_received:
                match_passed = False
                matching_logs.append(f"Quantity mismatch: Invoiced qty ({inv_qty}) exceeds GRN received qty ({total_received}) for item \"{item_id}\".")

            # 3. Compare vs PO Price
            if inv_price > po_price:
                match_passed = False
                diff = inv_price - po_price
                price_discrepancy += (diff / po_price) * 100
                matching_logs.append(f"Price discrepancy: Invoiced unit price (₹{inv_price}) exceeds PO unit price (₹{po_price}) for item \"{item_id}\".")

        status_val = "MATCH_PASSED" if match_passed else "MATCH_FAILED"
        final_log = json.dumps({
            "passed": match_passed,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "logs": matching_logs
        })

        # Recalculate price score
        price_score_this_time = max(0.0, 100.0 - price_discrepancy)
        new_price = (supplier.priceScore * 4 + price_score_this_time) / 5
        new_overall = (supplier.deliveryScore + supplier.qualityScore + new_price) / 3

        supplier.priceScore = new_price
        supplier.overallScore = new_overall

        invoice = SupplierInvoice(
            invoiceNo=invoiceNo,
            purchaseOrderId=purchaseOrderId,
            supplierId=po.supplierId,
            items=json.dumps(invoice_items),
            totalAmount=float(totalAmount),
            taxAmount=float(taxAmount),
            status=status_val,
            matchingLog=final_log
        )
        db.add(invoice)

        if match_passed:
            po.status = "COMPLETED"

            # Automatic ledger transaction matching express flow
            debit_acc = db.query(Account).filter(or_(Account.code == "5000", Account.name == "Consulting Expense")).first()
            credit_acc = db.query(Account).filter(or_(Account.code == "2000", Account.name == "Accounts Payable")).first()

            if debit_acc and credit_acc:
                last_entry = db.query(JournalEntry).order_by(JournalEntry.blockIndex.desc()).first()
                prev_hash = last_entry.blockHash if last_entry else "0"
                next_index = (last_entry.blockIndex + 1) if last_entry else 1
                voucher_no = f"VCHR-AP-{int(time.time() * 1000)}-{next_index}"
                date = datetime.utcnow()

                block_hash = calculate_block_hash(
                    block_index=next_index,
                    voucher_no=voucher_no,
                    amount=float(totalAmount),
                    debit_acc=debit_acc.name,
                    credit_acc=credit_acc.name,
                    prev_hash=prev_hash,
                    date=date
                )

                journal = JournalEntry(
                    blockIndex=next_index,
                    voucherType="JOURNAL",
                    voucherNo=voucher_no,
                    date=date,
                    amount=float(totalAmount),
                    debitAcc=debit_acc.name,
                    creditAcc=credit_acc.name,
                    narration=f"Automated journal entry for matched invoice {invoiceNo}",
                    prevHash=prev_hash,
                    blockHash=block_hash
                )
                db.add(journal)

                update_account_balance(db, debit_acc.id, float(totalAmount), True)
                update_account_balance(db, credit_acc.id, float(totalAmount), False)

        db.commit()
        db.refresh(invoice)

        return {"invoice": invoice, "matchPassed": match_passed, "logs": matching_logs}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})
