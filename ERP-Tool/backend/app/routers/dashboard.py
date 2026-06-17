from fastapi import APIRouter, Depends
from app.utils.db import get_db
from app.middlewares.rbac_middleware import get_current_rbac_user, RBACUser

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/metrics")
async def get_dashboard_metrics(
    current_user: RBACUser = Depends(get_current_rbac_user),
    db = Depends(get_db)
):
    """Get aggregated dashboard metrics for Logistics ERP using MongoDB"""
    
    # HR Metrics
    total_employees = await db.employees.count_documents({})
    active_employees = await db.employees.count_documents({"isActive": True})
    
    # Inventory Metrics
    total_products = await db.products.count_documents({})
    low_stock_products = await db.products.count_documents({
        "$expr": { "$lte": ["$currentStock", "$reorderPoint"] }
    })
    
    # Procurement Metrics
    total_suppliers = await db.suppliers.count_documents({})
    active_purchase_orders = await db.purchase_orders.count_documents({
        "status": {"$in": ["DRAFT", "APPROVED", "SHIPPED"]}
    })
    
    # Sales/CRM Metrics
    total_leads = await db.leads.count_documents({})
    qualified_leads = await db.leads.count_documents({"status": "QUALIFIED"})
    total_opportunities = await db.opportunities.count_documents({})
    
    pipeline_agg = await db.opportunities.aggregate([
        {"$group": {"_id": None, "total": {"$sum": "$value"}}}
    ]).to_list(length=1)
    total_pipeline_value = pipeline_agg[0]["total"] if pipeline_agg else 0
    
    # E-Commerce Metrics
    total_orders = await db.customer_orders.count_documents({})
    pending_orders = await db.customer_orders.count_documents({
        "status": {"$in": ["PLACED", "PROCESSING"]}
    })
    
    revenue_agg = await db.customer_orders.aggregate([
        {"$group": {"_id": None, "total": {"$sum": "$totalAmount"}}}
    ]).to_list(length=1)
    total_revenue = revenue_agg[0]["total"] if revenue_agg else 0
    
    # Manufacturing Metrics
    active_production_orders = await db.production_orders.count_documents({
        "status": "IN_PROGRESS"
    })
    completed_production_orders = await db.production_orders.count_documents({
        "status": "COMPLETED"
    })
    
    # Fixed Assets Metrics
    total_assets = await db.fixed_assets.count_documents({})
    active_assets = await db.fixed_assets.count_documents({"status": "ACTIVE"})
    
    # Stock Transactions (recent activity)
    recent_transactions = await db.stock_transactions.find().sort("transactionDate", -1).limit(10).to_list(length=10)
    
    recent_activity = []
    for t in recent_transactions:
        # Resolve product name if we have a productId
        product_name = "Unknown"
        if "productId" in t:
            product = await db.products.find_one({"id": t["productId"]})
            if product and "name" in product:
                product_name = product["name"]
                
        recent_activity.append({
            "type": "STOCK_TRANSACTION",
            "id": t.get("id", str(t.get("_id"))),
            "product": product_name,
            "quantity": t.get("quantity", 0),
            "transactionType": t.get("type", "UNKNOWN"),
            "date": t.get("transactionDate").isoformat() if t.get("transactionDate") else None
        })
    
    return {
        "hr": {
            "totalEmployees": total_employees,
            "activeEmployees": active_employees
        },
        "inventory": {
            "totalProducts": total_products,
            "lowStockProducts": low_stock_products
        },
        "procurement": {
            "totalSuppliers": total_suppliers,
            "activePurchaseOrders": active_purchase_orders
        },
        "sales": {
            "totalLeads": total_leads,
            "qualifiedLeads": qualified_leads,
            "totalOpportunities": total_opportunities,
            "totalPipelineValue": float(total_pipeline_value)
        },
        "ecommerce": {
            "totalOrders": total_orders,
            "pendingOrders": pending_orders,
            "totalRevenue": float(total_revenue)
        },
        "manufacturing": {
            "activeProductionOrders": active_production_orders,
            "completedProductionOrders": completed_production_orders
        },
        "assets": {
            "totalAssets": total_assets,
            "activeAssets": active_assets
        },
        "recentActivity": recent_activity
    }

@router.get("/kpis")
async def get_dashboard_kpis(
    current_user: RBACUser = Depends(get_current_rbac_user),
    db = Depends(get_db)
):
    """Get key performance indicators for dashboard"""
    
    total_employees = await db.employees.count_documents({})
    total_products = await db.products.count_documents({})
    total_suppliers = await db.suppliers.count_documents({})
    total_orders = await db.customer_orders.count_documents({})
    
    revenue_agg = await db.customer_orders.aggregate([
        {"$group": {"_id": None, "total": {"$sum": "$totalAmount"}}}
    ]).to_list(length=1)
    total_revenue = revenue_agg[0]["total"] if revenue_agg else 0
    
    total_assets = await db.fixed_assets.count_documents({})
    
    score_agg = await db.suppliers.aggregate([
        {"$group": {"_id": None, "avg": {"$avg": "$overallScore"}}}
    ]).to_list(length=1)
    avg_supplier_score = score_agg[0]["avg"] if score_agg else 0
    
    total_production = await db.production_orders.count_documents({})
    completed_production = await db.production_orders.count_documents({
        "status": "COMPLETED"
    })
    production_efficiency = (completed_production / total_production * 100) if total_production > 0 else 0
    
    return {
        "totalEmployees": total_employees,
        "totalProducts": total_products,
        "totalSuppliers": total_suppliers,
        "totalOrders": total_orders,
        "totalRevenue": float(total_revenue),
        "totalAssets": total_assets,
        "avgSupplierScore": float(avg_supplier_score),
        "productionEfficiency": round(production_efficiency, 2)
    }

@router.get("/recent-orders")
async def get_recent_orders(
    current_user: RBACUser = Depends(get_current_rbac_user),
    db = Depends(get_db),
    limit: int = 5
):
    """Get recent customer orders"""
    orders = await db.customer_orders.find().sort("createdAt", -1).limit(limit).to_list(length=limit)
    
    return [
        {
            "orderNo": order.get("orderNo"),
            "customerName": order.get("customerName"),
            "totalAmount": float(order.get("totalAmount", 0)),
            "status": order.get("status"),
            "createdAt": order.get("createdAt").isoformat() if order.get("createdAt") else None
        }
        for order in orders
    ]

@router.get("/top-products")
async def get_top_products(
    current_user: RBACUser = Depends(get_current_rbac_user),
    db = Depends(get_db),
    limit: int = 5
):
    """Get top products by stock value"""
    pipeline = [
        {"$addFields": {"stockValue": {"$multiply": ["$currentStock", "$costPrice"]}}},
        {"$sort": {"stockValue": -1}},
        {"$limit": limit}
    ]
    products = await db.products.aggregate(pipeline).to_list(length=limit)
    
    return [
        {
            "code": product.get("code"),
            "name": product.get("name"),
            "currentStock": product.get("currentStock", 0),
            "stockValue": float(product.get("stockValue", 0)),
            "type": product.get("type")
        }
        for product in products
    ]
