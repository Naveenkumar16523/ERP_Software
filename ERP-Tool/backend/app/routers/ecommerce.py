import time
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.utils.db import get_db
from app.utils.audit import log_audit_event
from app.middlewares.auth_middleware import get_current_user, require_permission, AuthenticatedUser
from app.models.schemas import OrderPlace
from app.models.ecommerce_sql_models import StoreProduct, CustomerOrder, OrderItem, LoyaltyAccount

router = APIRouter(prefix="/ecommerce", tags=["E-Commerce"])

@router.get("/products")
async def get_store_products(category: Optional[str] = None, search: Optional[str] = None, db: Session = Depends(get_db)):
    try:
        query = db.query(StoreProduct).filter(StoreProduct.isPublished == True)
        if category:
            query = query.filter(StoreProduct.category == category)
        if search:
            query = query.filter(StoreProduct.name.ilike(f"%{search}%"))
            
        products = query.order_by(StoreProduct.name).all()
        result = []
        for p in products:
            p_dict = {
                "id": p.id,
                "_id": p.id,
                "sku": p.sku,
                "name": p.name,
                "description": p.description,
                "category": p.category,
                "price": p.price,
                "salePrice": p.salePrice,
                "stock": p.stock,
                "loyaltyPts": p.loyaltyPts,
                "isPublished": p.isPublished,
                "createdAt": p.createdAt
            }
            result.append(p_dict)
        return result
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
            id=str(uuid.uuid4()),
            sku=sku,
            name=name,
            description=description,
            category=category,
            price=float(price),
            salePrice=float(salePrice) if salePrice is not None else None,
            stock=int(stock) if stock is not None else 0,
            loyaltyPts=int(loyaltyPts) if loyaltyPts is not None else 0,
            isPublished=True,
            createdAt=datetime.utcnow()
        )
        db.add(product)
        db.commit()
        db.refresh(product)

        await log_audit_event(
            user_id=current_user.id if hasattr(current_user, 'id') else current_user.get("id"),
            action="CREATE_STORE_PRODUCT",
            resource="StoreProduct",
            details={"id": product.id, "sku": product.sku, "name": product.name},
            req=req
        )

        return {
            "id": product.id,
            "_id": product.id,
            "sku": product.sku,
            "name": product.name,
            "description": product.description,
            "category": product.category,
            "price": product.price,
            "salePrice": product.salePrice,
            "stock": product.stock,
            "loyaltyPts": product.loyaltyPts,
            "isPublished": product.isPublished,
            "createdAt": product.createdAt
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

async def process_checkout(body: OrderPlace, db: Session) -> dict:
    try:
        subtotal = 0.0
        items_data = []

        if not body.items:
            pass
        else:
            for item in body.items:
                product_id = item.get("productId")
                quantity = item.get("quantity", 1)
                
                product = db.query(StoreProduct).filter(StoreProduct.id == product_id).first()
                if not product:
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Not Found", "message": f"Product {product_id} not found."})
                if product.stock < quantity:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": f"Insufficient stock for {product.name}."})

                effective_price = product.salePrice if product.salePrice is not None else product.price
                line_total = effective_price * quantity
                subtotal += line_total

                items_data.append({
                    "productId": product.id,
                    "quantity": quantity,
                    "unitPrice": effective_price,
                    "totalPrice": line_total,
                    "product_ref": product
                })

        for it in items_data:
            product = it["product_ref"]
            product.stock -= it["quantity"]

        email = body.customerEmail or (body.shippingAddress.get("email") if body.shippingAddress else "guest@example.com")
        name = body.customerName or (body.shippingAddress.get("name") if body.shippingAddress else "Guest")
        
        loyalty = db.query(LoyaltyAccount).filter(LoyaltyAccount.customerEmail == email).first()
        if not loyalty:
            loyalty = LoyaltyAccount(
                id=str(uuid.uuid4()),
                customerEmail=email,
                customerName=name,
                points=0,
                tier="BRONZE",
                createdAt=datetime.utcnow()
            )
            db.add(loyalty)
            db.commit()
            db.refresh(loyalty)

        discount_amount = 0.0
        loyalty_redeemed = 0
        
        if body.total is not None and body.total > 0:
            final_amount = body.total
        else:
            final_amount = max(0.0, subtotal - discount_amount)
            
        order_no = f"ORD-{int(time.time() * 1000)}"
        order_id = str(uuid.uuid4())
        
        order = CustomerOrder(
            id=order_id,
            orderNo=order_no,
            customerName=name,
            customerEmail=email,
            totalAmount=final_amount,
            discountAmount=discount_amount,
            loyaltyRedeemed=loyalty_redeemed,
            shippingAddress=body.shippingAddress,
            status=body.status or "PLACED",
            createdAt=datetime.utcnow()
        )
        db.add(order)

        order_items_objs = []
        for it in items_data:
            ord_item = OrderItem(
                id=str(uuid.uuid4()),
                orderId=order_id,
                productId=it["productId"],
                quantity=it["quantity"],
                unitPrice=it["unitPrice"],
                totalPrice=it["totalPrice"],
                createdAt=datetime.utcnow()
            )
            db.add(ord_item)
            order_items_objs.append(ord_item)

        earned_points = int(final_amount // 10)
        loyalty.points += earned_points
        
        if final_amount >= 100000.0:
            loyalty.tier = "PLATINUM"
        elif final_amount >= 50000.0:
            loyalty.tier = "GOLD"
        elif final_amount >= 10000.0:
            loyalty.tier = "SILVER"

        db.commit()
        db.refresh(order)

        serialized_items = []
        for it, obj in zip(items_data, order_items_objs):
            serialized_items.append({
                "id": obj.id,
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
            "_id": order.id,
            "orderNo": order.orderNo,
            "customerName": order.customerName,
            "customerEmail": order.customerEmail,
            "totalAmount": order.totalAmount,
            "discountAmount": order.discountAmount,
            "loyaltyRedeemed": order.loyaltyRedeemed,
            "shippingAddress": order.shippingAddress,
            "status": order.status,
            "createdAt": order.createdAt,
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
    result = await process_checkout(body, db)
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
    result = await process_checkout(body, db)
    await log_audit_event(
        user_id="GUEST",
        action="CHECKOUT",
        resource="CustomerOrder",
        details=result["orderNo"],
    )
    return result

@router.get("/test-error")
async def test_error():
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Test", "message": "Test error"})

@router.get("/test-deploy")
async def test_deploy():
    return {"status": "deployed", "version": "fix-serialization-v3"}

@router.get("/orders")
async def get_orders(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        import math
        def safe_float(val):
            if val is None: return 0.0
            try:
                v = float(val)
                if math.isnan(v) or math.isinf(v): return 0.0
                return v
            except:
                return 0.0

        orders = db.query(CustomerOrder).order_by(CustomerOrder.createdAt.desc()).all()
        result = []
        for o in orders:
            items = db.query(OrderItem).filter(OrderItem.orderId == o.id).all()
            serialized_items = []
            for it in items:
                prod = db.query(StoreProduct).filter(StoreProduct.id == it.productId).first()
                serialized_items.append({
                    "id": str(it.id) if it.id else "",
                    "productId": str(it.productId) if it.productId else None,
                    "quantity": int(it.quantity) if it.quantity else 0,
                    "unitPrice": safe_float(it.unitPrice),
                    "totalPrice": safe_float(it.totalPrice),
                    "product": {"id": str(prod.id), "sku": str(prod.sku), "name": str(prod.name)} if prod else None
                })
            
            result.append({
                "id": str(o.id) if o.id else "",
                "_id": str(o.id) if o.id else "",
                "orderNo": str(o.orderNo) if o.orderNo else "",
                "customerName": str(o.customerName) if o.customerName else "",
                "customerEmail": str(o.customerEmail) if o.customerEmail else "",
                "totalAmount": safe_float(o.totalAmount),
                "discountAmount": safe_float(o.discountAmount),
                "loyaltyRedeemed": int(o.loyaltyRedeemed) if o.loyaltyRedeemed else 0,
                "shippingAddress": o.shippingAddress if isinstance(o.shippingAddress, (dict, list)) else {},
                "status": str(o.status) if o.status else "PLACED",
                "createdAt": o.createdAt.isoformat() if hasattr(o.createdAt, 'isoformat') else str(o.createdAt),
                "items": serialized_items
            })
            
        from fastapi.encoders import jsonable_encoder
        import json
        encoded_result = jsonable_encoder(result)
        # Explicitly verify it's JSON serializable inside the try-except
        json.dumps(encoded_result, allow_nan=False)
        return encoded_result
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
        
        return {
            "id": order.id,
            "_id": order.id,
            "status": order.status
        }
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
        
        return {
            "id": order.id,
            "_id": order.id,
            "status": order.status
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.get("/loyalty/{email}")
async def get_loyalty_account(email: str, db: Session = Depends(get_db)):
    try:
        account = db.query(LoyaltyAccount).filter(LoyaltyAccount.customerEmail == email).first()
        if not account:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Not Found", "message": "No loyalty account found."})
        
        return {
            "id": account.id,
            "_id": account.id,
            "customerEmail": account.customerEmail,
            "customerName": account.customerName,
            "points": account.points,
            "tier": account.tier,
            "createdAt": account.createdAt
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})
