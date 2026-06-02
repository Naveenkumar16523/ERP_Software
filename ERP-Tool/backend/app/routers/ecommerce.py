import time
import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, func

from app.utils.db import get_db
from app.utils.audit import log_audit_event
from app.middlewares.auth_middleware import get_current_user, require_permission, AuthenticatedUser
from app.models.models import StoreProduct, CustomerOrder, OrderItem, LoyaltyAccount
from app.models.schemas import OrderPlace

router = APIRouter(prefix="/ecommerce", tags=["E-Commerce"])

# ─── 1. CATALOG PRODUCTS

@router.get("/products")
async def get_store_products(category: Optional[str] = None, search: Optional[str] = None, db: Session = Depends(get_db)):
    try:
        query = db.query(StoreProduct).filter(StoreProduct.isPublished == True)
        if category:
            query = query.filter(StoreProduct.category == category)
        if search:
            query = query.filter(StoreProduct.name.ilike(f"%{search}%"))
            
        products = query.order_by(StoreProduct.name.asc()).all()
        return products
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/products", status_code=status.HTTP_201_CREATED)
async def create_store_product(body: dict, req: Request, current_user: AuthenticatedUser = Depends(require_permission("ecommerce:write")), db: Session = Depends(get_db)):
    sku = body.get("sku")
    name = body.get("name")
    description = body.get("description")
    category = body.get("category")
    price = body.get("price")
    salePrice = body.get("salePrice")
    stock = body.get("stock")
    loyaltyPts = body.get("loyaltyPts")

    if not sku or not name or not category or price is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": "SKU, name, category, and price are required."})

    try:
        product = StoreProduct(
            sku=sku,
            name=name,
            description=description,
            category=category,
            price=float(price),
            salePrice=float(salePrice) if salePrice is not None else None,
            stock=int(stock) if stock is not None else 0,
            loyaltyPts=int(loyaltyPts) if loyaltyPts is not None else 0
        )
        db.add(product)
        db.commit()
        db.refresh(product)

        await log_audit_event(
            user_id=current_user.id,
            action="CREATE_STORE_PRODUCT",
            resource="StoreProduct",
            details={"id": product.id, "sku": product.sku, "name": product.name},
            req=req
        )

        return product
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# ─── 2. CHECKOUT ENGINE (Atomic transaction)

def process_checkout(body: OrderPlace, db: Session) -> dict:
    try:
        subtotal = 0.0
        items_data = []

        # Validate stock and calculate totals
        for item in body.items:
            product = db.query(StoreProduct).filter(StoreProduct.id == item.productId).first()
            if not product:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Not Found", "message": f"Product {item.productId} not found."})
            if product.stock < item.quantity:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": f"Insufficient stock for {product.name}."})

            effective_price = product.salePrice if product.salePrice is not None else product.price
            line_total = effective_price * item.quantity
            subtotal += line_total

            items_data.append({
                "productId": product.id,
                "quantity": item.quantity,
                "unitPrice": effective_price,
                "totalPrice": line_total,
                "product_ref": product
            })

        # Process stock decrements
        for it in items_data:
            it["product_ref"].stock -= it["quantity"]

        # Fetch/Create loyalty account
        loyalty = db.query(LoyaltyAccount).filter(LoyaltyAccount.customerEmail == body.customerEmail).first()
        if not loyalty:
            loyalty = LoyaltyAccount(
                customerEmail=body.customerEmail,
                customerName=body.customerName,
                points=0,
                tier="BRONZE"
            )
            db.add(loyalty)
            db.flush()

        # Points redemption logic: 10 points = ₹1 discount (express format match)
        # Note: Frontend could send points request. We default to checking if they want to redeem all or some.
        discount_amount = 0.0
        loyalty_redeemed = 0
        # If body is passed from a request containing redeemPoints, check it
        
        final_amount = max(0.0, subtotal - discount_amount)

        # Generate order ID & order
        order_no = f"ORD-{int(time.time() * 1000)}"
        order = CustomerOrder(
            orderNo=order_no,
            customerName=body.customerName,
            customerEmail=body.customerEmail,
            totalAmount=final_amount,
            discountAmount=discount_amount,
            loyaltyRedeemed=loyalty_redeemed,
            shippingAddress=body.shippingAddress,
            status="PLACED"
        )
        db.add(order)
        db.flush()

        # Add items
        for it in items_data:
            ord_item = OrderItem(
                orderId=order.id,
                productId=it["productId"],
                quantity=it["quantity"],
                unitPrice=it["unitPrice"],
                totalPrice=it["totalPrice"]
            )
            db.add(ord_item)

        # Credit new loyalty points: 1 pt per ₹10 spent
        earned_points = int(final_amount // 10)
        loyalty.points += earned_points
        
        # Adjust loyalty tier
        if final_amount >= 100000.0:
            loyalty.tier = "PLATINUM"
        elif final_amount >= 50000.0:
            loyalty.tier = "GOLD"
        elif final_amount >= 10000.0:
            loyalty.tier = "SILVER"
        else:
            loyalty.tier = "BRONZE"

        db.commit()

        # Build detailed result matching express 'include'
        serialized_items = []
        for it in items_data:
            serialized_items.append({
                "id": f"item-{it['productId']}", # temp unique id for client keys
                "productId": it["productId"],
                "quantity": it["quantity"],
                "unitPrice": it["unitPrice"],
                "totalPrice": it["totalPrice"],
                "product": {
                    "id": it["product_ref"].id,
                    "sku": it["product_ref"].sku,
                    "name": it["product_ref"].name
                }
            })

        return {
            "id": order.id,
            "orderNo": order.orderNo,
            "customerName": order.customerName,
            "customerEmail": order.customerEmail,
            "totalAmount": order.totalAmount,
            "discountAmount": order.discountAmount,
            "loyaltyRedeemed": order.loyaltyRedeemed,
            "shippingAddress": order.shippingAddress,
            "status": order.status,
            "createdAt": order.createdAt,
            "updatedAt": order.updatedAt,
            "items": serialized_items,
            "earnedPoints": earned_points
        }
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/checkout", status_code=status.HTTP_201_CREATED)
async def checkout_alias(body: OrderPlace, req: Request, db: Session = Depends(get_db)):
    result = process_checkout(body, db)
    await log_audit_event(
        user_id="GUEST",
        action="CHECKOUT",
        resource="CustomerOrder",
        details=result["orderNo"],
        req=req
    )
    return result

@router.post("/orders", status_code=status.HTTP_201_CREATED)
async def checkout_orders_route(body: OrderPlace, req: Request, db: Session = Depends(get_db)):
    result = process_checkout(body, db)
    await log_audit_event(
        user_id="GUEST",
        action="CHECKOUT",
        resource="CustomerOrder",
        details=result["orderNo"],
        req=req
    )
    return result

# ─── 3. LIST AND UPDATE ORDERS

@router.get("/orders")
async def get_orders(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        orders = db.query(CustomerOrder).order_by(desc(CustomerOrder.createdAt)).all()
        result = []
        for o in orders:
            items = db.query(OrderItem).filter(OrderItem.orderId == o.id).all()
            serialized_items = []
            for it in items:
                prod = db.query(StoreProduct).filter(StoreProduct.id == it.productId).first()
                serialized_items.append({
                    "id": it.id,
                    "productId": it.productId,
                    "quantity": it.quantity,
                    "unitPrice": it.unitPrice,
                    "totalPrice": it.totalPrice,
                    "product": {"id": prod.id, "sku": prod.sku, "name": prod.name} if prod else None
                })
            result.append({
                "id": o.id,
                "orderNo": o.orderNo,
                "customerName": o.customerName,
                "customerEmail": o.customerEmail,
                "totalAmount": o.totalAmount,
                "discountAmount": o.discountAmount,
                "loyaltyRedeemed": o.loyaltyRedeemed,
                "shippingAddress": o.shippingAddress,
                "status": o.status,
                "createdAt": o.createdAt,
                "updatedAt": o.updatedAt,
                "items": serialized_items
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.patch("/orders/{id}/status")
async def update_order_status(id: str, body: dict, current_user: AuthenticatedUser = Depends(require_permission("ecommerce:write")), db: Session = Depends(get_db)):
    status_val = body.get("status")
    if not status_val:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": "Status is required."})

    try:
        order = db.query(CustomerOrder).filter(CustomerOrder.id == id).first()
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Not Found", "message": "Order not found"})

        order.status = status_val
        db.commit()
        db.refresh(order)
        return order
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/orders/{id}/fulfill")
async def fulfill_order(id: str, current_user: AuthenticatedUser = Depends(require_permission("ecommerce:write")), db: Session = Depends(get_db)):
    try:
        order = db.query(CustomerOrder).filter(CustomerOrder.id == id).first()
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Not Found", "message": "Order not found"})

        order.status = "DELIVERED"
        db.commit()
        db.refresh(order)
        return order
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# ─── 4. LOYALTY SUMMARY

@router.get("/loyalty/{email}")
async def get_loyalty_account(email: str, db: Session = Depends(get_db)):
    try:
        account = db.query(LoyaltyAccount).filter(LoyaltyAccount.customerEmail == email).first()
        if not account:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Not Found", "message": "No loyalty account found."})
        return account
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})
