from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.utils.db import get_db
from app.middlewares.auth_middleware import get_current_user, AuthenticatedUser
from app.models.models import (
    Employee, Product, Supplier, PurchaseOrder, CustomerOrder, 
    FixedAsset, ProductionOrder, Lead, Opportunity, StockTransaction
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/metrics")
async def get_dashboard_metrics(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get aggregated dashboard metrics for Logistics ERP"""
    
    # HR Metrics
    total_employees = db.query(func.count(Employee.id)).scalar()
    active_employees = db.query(func.count(Employee.id)).filter(Employee.isActive == True).scalar()
    
    # Inventory Metrics
    total_products = db.query(func.count(Product.id)).scalar()
    low_stock_products = db.query(func.count(Product.id)).filter(
        Product.currentStock <= Product.reorderPoint
    ).scalar()
    
    # Procurement Metrics
    total_suppliers = db.query(func.count(Supplier.id)).scalar()
    active_purchase_orders = db.query(func.count(PurchaseOrder.id)).filter(
        PurchaseOrder.status.in_(["DRAFT", "APPROVED", "SHIPPED"])
    ).scalar()
    
    # Sales/CRM Metrics
    total_leads = db.query(func.count(Lead.id)).scalar()
    qualified_leads = db.query(func.count(Lead.id)).filter(Lead.status == "QUALIFIED").scalar()
    total_opportunities = db.query(func.count(Opportunity.id)).scalar()
    total_pipeline_value = db.query(func.sum(Opportunity.value)).scalar() or 0
    
    # E-Commerce Metrics
    total_orders = db.query(func.count(CustomerOrder.id)).scalar()
    pending_orders = db.query(func.count(CustomerOrder.id)).filter(
        CustomerOrder.status.in_(["PLACED", "PROCESSING"])
    ).scalar()
    total_revenue = db.query(func.sum(CustomerOrder.totalAmount)).scalar() or 0
    
    # Manufacturing Metrics
    active_production_orders = db.query(func.count(ProductionOrder.id)).filter(
        ProductionOrder.status == "IN_PROGRESS"
    ).scalar()
    completed_production_orders = db.query(func.count(ProductionOrder.id)).filter(
        ProductionOrder.status == "COMPLETED"
    ).scalar()
    
    # Fixed Assets Metrics
    total_assets = db.query(func.count(FixedAsset.id)).scalar()
    active_assets = db.query(func.count(FixedAsset.id)).filter(FixedAsset.status == "ACTIVE").scalar()
    
    # Stock Transactions (recent activity)
    recent_transactions = db.query(StockTransaction).order_by(
        desc(StockTransaction.transactionDate)
    ).limit(10).all()
    
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
        "recentActivity": [
            {
                "type": "STOCK_TRANSACTION",
                "id": t.id,
                "product": t.product.name if t.product else "Unknown",
                "quantity": t.quantity,
                "transactionType": t.type,
                "date": t.transactionDate.isoformat() if t.transactionDate else None
            }
            for t in recent_transactions
        ]
    }

@router.get("/kpis")
async def get_dashboard_kpis(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get key performance indicators for dashboard"""
    
    # Calculate KPIs based on Logistics ERP data
    total_employees = db.query(func.count(Employee.id)).scalar() or 0
    total_products = db.query(func.count(Product.id)).scalar() or 0
    total_suppliers = db.query(func.count(Supplier.id)).scalar() or 0
    total_orders = db.query(func.count(CustomerOrder.id)).scalar() or 0
    total_revenue = db.query(func.sum(CustomerOrder.totalAmount)).scalar() or 0
    total_assets = db.query(func.count(FixedAsset.id)).scalar() or 0
    
    # Calculate average supplier score
    avg_supplier_score = db.query(func.avg(Supplier.overallScore)).scalar() or 0
    
    # Calculate production efficiency
    total_production = db.query(func.count(ProductionOrder.id)).scalar() or 0
    completed_production = db.query(func.count(ProductionOrder.id)).filter(
        ProductionOrder.status == "COMPLETED"
    ).scalar() or 0
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
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 5
):
    """Get recent customer orders"""
    orders = db.query(CustomerOrder).order_by(
        desc(CustomerOrder.createdAt)
    ).limit(limit).all()
    
    return [
        {
            "orderNo": order.orderNo,
            "customerName": order.customerName,
            "totalAmount": float(order.totalAmount),
            "status": order.status,
            "createdAt": order.createdAt.isoformat() if order.createdAt else None
        }
        for order in orders
    ]

@router.get("/top-products")
async def get_top_products(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 5
):
    """Get top products by stock value"""
    products = db.query(Product).order_by(
        desc(Product.currentStock * Product.costPrice)
    ).limit(limit).all()
    
    return [
        {
            "code": product.code,
            "name": product.name,
            "currentStock": product.currentStock,
            "stockValue": float(product.currentStock * product.costPrice),
            "type": product.type
        }
        for product in products
    ]
