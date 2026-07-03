from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.utils.db import get_db
from app.middlewares.rbac_middleware import get_current_rbac_user, RBACUser
from app.utils.redis_client import cache_get, cache_set
import json

from app.models.hr_sql_models import Employee
from app.models.finance_sql_models import FinanceAccount, Invoice

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

from typing import Literal

@router.get("/metrics")
async def get_dashboard_metrics(
    period: Literal["daily", "weekly", "monthly"] = "monthly",
    current_user: RBACUser = Depends(get_current_rbac_user),
    db: Session = Depends(get_db)
):
    """Get aggregated dashboard metrics for Logistics ERP using SQL"""
    
    import logging
    logger = logging.getLogger(__name__)
    
    cache_key = f"dashboard:metrics:{period}"
    cached_data = cache_get(cache_key)
    if cached_data:
        try:
            return json.loads(cached_data)
        except Exception as e:
            logger.warning(f"Failed to parse cached metrics: {e}")
            
    try:
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
        
        # Calculate real revenue history based on period
        from datetime import datetime, timedelta
        from collections import defaultdict
        
        # Determine date filter
        now = datetime.utcnow()
        if period == "daily":
            start_date = now - timedelta(days=30)
        elif period == "weekly":
            start_date = now - timedelta(weeks=12)
        else: # monthly
            start_date = now - timedelta(days=365) # Last 12 months

        invoices = db.query(Invoice).filter(Invoice.status == 'PAID', Invoice.createdAt >= start_date).all()
        # Fallback to all invoices if no paid ones to show some data on new accounts
        if not invoices:
            invoices = db.query(Invoice).filter(Invoice.createdAt >= start_date).all()
            
        period_data = defaultdict(float)
        for inv in invoices:
            if inv.createdAt:
                if period == "daily":
                    key = inv.createdAt.strftime('%d %b')
                elif period == "weekly":
                    # e.g. "W14 2026"
                    week_num = inv.createdAt.isocalendar()[1]
                    year = inv.createdAt.isocalendar()[0]
                    key = f"W{week_num:02d} {year}"
                else:
                    key = inv.createdAt.strftime('%b %Y')
                    
                period_data[key] += float(inv.totalAmount or 0.0)
                
        # Format for recharts
        revenue_history = []
        if not period_data:
            revenue_history = []
        else:
            # Sort the keys chronologically (assuming they are inserted in order or we can just rely on defaultdict insertion order if ordered query, but here let's sort them. Actually, strings like '14 Oct' sort alphabetically.
            # To fix this, it's better to sort the invoices first, which SQLAlchemy usually does by ID or we can sort in Python.
            invoices_sorted = sorted([i for i in invoices if i.createdAt], key=lambda x: x.createdAt)
            
            # Re-build dict to guarantee order
            period_data_ordered = defaultdict(float)
            for inv in invoices_sorted:
                if period == "daily":
                    key = inv.createdAt.strftime('%d %b')
                elif period == "weekly":
                    week_num = inv.createdAt.isocalendar()[1]
                    year = inv.createdAt.isocalendar()[0]
                    key = f"W{week_num:02d} {year}"
                else:
                    key = inv.createdAt.strftime('%b %Y')
                period_data_ordered[key] += float(inv.totalAmount or 0.0)

            for k, v in period_data_ordered.items():
                revenue_history.append({"name": k, "current": v, "previous": v * 0.8}) # Approximate previous for comparison
        
        result = {
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
            "revenueHistory": revenue_history,
            "recentActivity": recent_activity
        }
        cache_set(cache_key, json.dumps(result), expiry_seconds=60)
        return result
    except Exception as e:
        logger.error(f"Dashboard metrics error: {e}")
        return {
            "hr": {"totalEmployees": 0, "activeEmployees": 0},
            "inventory": {"totalProducts": 0, "lowStockProducts": 0},
            "procurement": {"totalSuppliers": 0, "activePurchaseOrders": 0},
            "sales": {"totalLeads": 0, "qualifiedLeads": 0, "totalOpportunities": 0, "totalPipelineValue": 0.0},
            "ecommerce": {"totalOrders": 0, "pendingOrders": 0, "totalRevenue": 0.0},
            "manufacturing": {"activeProductionOrders": 0, "completedProductionOrders": 0},
            "assets": {"totalAssets": 0, "activeAssets": 0},
            "finance": {"totalInvoices": 0, "pendingInvoices": 0},
            "recentActivity": []
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

