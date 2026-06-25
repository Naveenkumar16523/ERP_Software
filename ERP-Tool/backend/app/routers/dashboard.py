from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.utils.db import get_db
from app.middlewares.rbac_middleware import get_current_rbac_user, RBACUser

from app.models.hr_sql_models import Employee
from app.models.finance_sql_models import FinanceAccount, Invoice

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/metrics")
async def get_dashboard_metrics(
    current_user: RBACUser = Depends(get_current_rbac_user),
    db: Session = Depends(get_db)
):
    """Get aggregated dashboard metrics for Logistics ERP using SQL"""
    
    # HR Metrics
    total_employees = db.query(Employee).count()
    active_employees = db.query(Employee).filter(Employee.status == "Active").count()
    
    # Finance Metrics
    total_invoices = db.query(Invoice).count()
    pending_invoices = db.query(Invoice).filter(Invoice.status == "PENDING").count()
    
    # Mocking disabled modules
    total_products = 0
    low_stock_products = 0
    total_suppliers = 0
    active_purchase_orders = 0
    
    from app.models.crm_sql_models import Lead
    total_leads = db.query(Lead).count()
    qualified_leads = db.query(Lead).filter(Lead.status == "Qualified").count()
    
    pipeline_val_query = db.query(func.sum(Lead.expectedRevenue)).filter(Lead.status == "Qualified").scalar()
    total_pipeline_value = float(pipeline_val_query) if pipeline_val_query else 0.0
    total_opportunities = db.query(Lead).filter(Lead.status.in_(["Negotiation", "Proposal"])).count() if hasattr(Lead, "status") else 0

    total_orders = 0
    pending_orders = 0
    total_revenue = 0.0
    active_production_orders = 0
    completed_production_orders = 0
    total_assets = 0
    active_assets = 0
    recent_activity = []
    
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
            "totalPipelineValue": total_pipeline_value
        },
        "ecommerce": {
            "totalOrders": total_orders,
            "pendingOrders": pending_orders,
            "totalRevenue": total_revenue
        },
        "manufacturing": {
            "activeProductionOrders": active_production_orders,
            "completedProductionOrders": completed_production_orders
        },
        "assets": {
            "totalAssets": total_assets,
            "activeAssets": active_assets
        },
        "finance": {
            "totalInvoices": total_invoices,
            "pendingInvoices": pending_invoices
        },
        "recentActivity": recent_activity
    }

@router.get("/kpis")
async def get_dashboard_kpis(
    current_user: RBACUser = Depends(get_current_rbac_user),
    db: Session = Depends(get_db)
):
    """Get key performance indicators for dashboard"""
    total_employees = db.query(Employee).count()
    
    return {
        "totalEmployees": total_employees,
        "totalProducts": 0,
        "totalSuppliers": 0,
        "totalOrders": 0,
        "totalRevenue": 0.0,
        "totalAssets": 0,
        "avgSupplierScore": 0.0,
        "productionEfficiency": 0.0
    }

@router.get("/recent-orders")
async def get_recent_orders(
    current_user: RBACUser = Depends(get_current_rbac_user),
    db: Session = Depends(get_db),
    limit: int = 5
):
    """Get recent customer orders"""
    return []

@router.get("/top-products")
async def get_top_products(
    current_user: RBACUser = Depends(get_current_rbac_user),
    db: Session = Depends(get_db),
    limit: int = 5
):
    """Get top products by stock value"""
    return []

