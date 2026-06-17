import time
import json
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request

from app.utils.db import get_db
from app.utils.audit import log_audit_event
from app.middlewares.auth_middleware import get_current_user, require_permission, AuthenticatedUser
from app.models.schemas import OrderPlace

router = APIRouter(prefix="/ecommerce", tags=["E-Commerce"])

@router.get("/products")
async def get_store_products(category: Optional[str] = None, search: Optional[str] = None, db = Depends(get_db)):
    try:
        query = {"isPublished": True}
        if category:
            query["category"] = category
        if search:
            query["name"] = {"$regex": search, "$options": "i"}
            
        products = await db.store_products.find(query).sort("name", 1).to_list(length=None)
        for p in products: p["_id"] = str(p["_id"])
        return products
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/products", status_code=status.HTTP_201_CREATED)
async def create_store_product(body: dict, req: Request, current_user: AuthenticatedUser = Depends(require_permission("ecommerce:write")), db = Depends(get_db)):
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
        product = {
            "id": str(uuid.uuid4()),
            "sku": sku,
            "name": name,
            "description": description,
            "category": category,
            "price": float(price),
            "salePrice": float(salePrice) if salePrice is not None else None,
            "stock": int(stock) if stock is not None else 0,
            "loyaltyPts": int(loyaltyPts) if loyaltyPts is not None else 0,
            "isPublished": True,
            "createdAt": datetime.utcnow()
        }
        await db.store_products.insert_one(product)
        product["_id"] = str(product["_id"])

        await log_audit_event(
            user_id=current_user.id if hasattr(current_user, 'id') else current_user.get("id"),
            action="CREATE_STORE_PRODUCT",
            resource="StoreProduct",
            details={"id": product["id"], "sku": product["sku"], "name": product["name"]},
            req=req
        )

        return product
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

async def process_checkout(body: OrderPlace, db) -> dict:
    try:
        subtotal = 0.0
        items_data = []

        for item in body.items:
            product = await db.store_products.find_one({"id": item.productId})
            if not product:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Not Found", "message": f"Product {item.productId} not found."})
            if product.get("stock", 0) < item.quantity:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": f"Insufficient stock for {product.get('name')}."})

            effective_price = product.get("salePrice") if product.get("salePrice") is not None else product.get("price", 0.0)
            line_total = effective_price * item.quantity
            subtotal += line_total

            items_data.append({
                "productId": product["id"],
                "quantity": item.quantity,
                "unitPrice": effective_price,
                "totalPrice": line_total,
                "product_ref": product
            })

        # Process stock decrements
        for it in items_data:
            await db.store_products.update_one(
                {"id": it["productId"]},
                {"$inc": {"stock": -it["quantity"]}}
            )

        # Loyalty logic
        loyalty = await db.loyalty_accounts.find_one({"customerEmail": body.customerEmail})
        if not loyalty:
            loyalty = {
                "id": str(uuid.uuid4()),
                "customerEmail": body.customerEmail,
                "customerName": body.customerName,
                "points": 0,
                "tier": "BRONZE",
                "createdAt": datetime.utcnow()
            }
            await db.loyalty_accounts.insert_one(loyalty)

        discount_amount = 0.0
        loyalty_redeemed = 0
        
        final_amount = max(0.0, subtotal - discount_amount)
        order_no = f"ORD-{int(time.time() * 1000)}"
        order_id = str(uuid.uuid4())
        
        order = {
            "id": order_id,
            "orderNo": order_no,
            "customerName": body.customerName,
            "customerEmail": body.customerEmail,
            "totalAmount": final_amount,
            "discountAmount": discount_amount,
            "loyaltyRedeemed": loyalty_redeemed,
            "shippingAddress": body.shippingAddress,
            "status": "PLACED",
            "createdAt": datetime.utcnow()
        }
        await db.customer_orders.insert_one(order)

        order_items = []
        for it in items_data:
            ord_item = {
                "id": str(uuid.uuid4()),
                "orderId": order_id,
                "productId": it["productId"],
                "quantity": it["quantity"],
                "unitPrice": it["unitPrice"],
                "totalPrice": it["totalPrice"],
                "createdAt": datetime.utcnow()
            }
            order_items.append(ord_item)
            
        if order_items:
            await db.order_items.insert_many(order_items)

        earned_points = int(final_amount // 10)
        new_points = loyalty.get("points", 0) + earned_points
        
        tier = "BRONZE"
        if final_amount >= 100000.0:
            tier = "PLATINUM"
        elif final_amount >= 50000.0:
            tier = "GOLD"
        elif final_amount >= 10000.0:
            tier = "SILVER"

        await db.loyalty_accounts.update_one(
            {"customerEmail": body.customerEmail},
            {"$set": {"points": new_points, "tier": tier}}
        )

        serialized_items = []
        for it in items_data:
            serialized_items.append({
                "id": f"item-{it['productId']}",
                "productId": it["productId"],
                "quantity": it["quantity"],
                "unitPrice": it["unitPrice"],
                "totalPrice": it["totalPrice"],
                "product": {
                    "id": it["product_ref"]["id"],
                    "sku": it["product_ref"].get("sku"),
                    "name": it["product_ref"].get("name")
                }
            })

        order["_id"] = str(order["_id"])
        order["items"] = serialized_items
        order["earnedPoints"] = earned_points
        return order
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/checkout", status_code=status.HTTP_201_CREATED)
async def checkout_alias(body: OrderPlace, req: Request, db = Depends(get_db)):
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
async def checkout_orders_route(body: OrderPlace, req: Request, db = Depends(get_db)):
    result = await process_checkout(body, db)
    await log_audit_event(
        user_id="GUEST",
        action="CHECKOUT",
        resource="CustomerOrder",
        details=result["orderNo"],
        req=req
    )
    return result

@router.get("/orders")
async def get_orders(current_user: AuthenticatedUser = Depends(get_current_user), db = Depends(get_db)):
    try:
        orders = await db.customer_orders.find().sort("createdAt", -1).to_list(length=None)
        result = []
        for o in orders:
            items = await db.order_items.find({"orderId": o["id"]}).to_list(length=None)
            serialized_items = []
            for it in items:
                prod = await db.store_products.find_one({"id": it["productId"]})
                serialized_items.append({
                    "id": it["id"],
                    "productId": it["productId"],
                    "quantity": it["quantity"],
                    "unitPrice": it["unitPrice"],
                    "totalPrice": it["totalPrice"],
                    "product": {"id": prod["id"], "sku": prod.get("sku"), "name": prod.get("name")} if prod else None
                })
            
            o["_id"] = str(o["_id"])
            o["items"] = serialized_items
            result.append(o)
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.patch("/orders/{id}/status")
async def update_order_status(id: str, body: dict, current_user: AuthenticatedUser = Depends(require_permission("ecommerce:write")), db = Depends(get_db)):
    status_val = body.get("status")
    if not status_val:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": "Status is required."})

    try:
        order = await db.customer_orders.find_one({"id": id})
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Not Found", "message": "Order not found"})

        await db.customer_orders.update_one({"id": id}, {"$set": {"status": status_val}})
        order["status"] = status_val
        order["_id"] = str(order["_id"])
        return order
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/orders/{id}/fulfill")
async def fulfill_order(id: str, current_user: AuthenticatedUser = Depends(require_permission("ecommerce:write")), db = Depends(get_db)):
    try:
        order = await db.customer_orders.find_one({"id": id})
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Not Found", "message": "Order not found"})

        await db.customer_orders.update_one({"id": id}, {"$set": {"status": "DELIVERED"}})
        order["status"] = "DELIVERED"
        order["_id"] = str(order["_id"])
        return order
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.get("/loyalty/{email}")
async def get_loyalty_account(email: str, db = Depends(get_db)):
    try:
        account = await db.loyalty_accounts.find_one({"customerEmail": email})
        if not account:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Not Found", "message": "No loyalty account found."})
        account["_id"] = str(account["_id"])
        return account
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})
