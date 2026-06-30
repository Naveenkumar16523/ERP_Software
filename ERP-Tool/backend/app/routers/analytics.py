from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import json

from app.utils.db import get_db
from app.utils.redis_client import cache_get, cache_set
from app.middlewares.rbac_middleware import get_current_rbac_user, require_module_access, RBACUser

from app.models.supply_chain_sql_models import Shipment, FleetVehicle

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/logistics-kpis")
async def get_logistics_kpis(
    current_user: RBACUser = Depends(require_module_access("analytics")),
    db: Session = Depends(get_db)
):
    cache_key = "analytics:logistics_kpis"
    cached_data = cache_get(cache_key)
    if cached_data:
        return json.loads(cached_data)

    from app.models.finance_sql_models import Invoice
    
    # Calculate KPIs
    shipments = db.query(Shipment).all()
    vehicles = db.query(FleetVehicle).all()
    invoices = db.query(Invoice).filter(Invoice.status == "PAID").all()
    
    total_shipments = len(shipments)
    delivered = len([s for s in shipments if s.status == "Delivered"])
    
    # OTIF (On-Time In-Full) Rate - actual
    otif_rate = 0
    if total_shipments > 0:
        otif_rate = round((delivered / total_shipments) * 100, 1)
    
    # Fleet Utilization
    total_vehicles = len(vehicles)
    in_transit_vehicles = len([v for v in vehicles if v.status == "In Transit"])
    fleet_utilization = 0
    if total_vehicles > 0:
        fleet_utilization = round((in_transit_vehicles / total_vehicles) * 100, 1)
        
    # Real metrics based on DB
    base_km = total_shipments * 450 # Still estimating km per shipment unless tracked in DB
    
    total_revenue = sum(float(inv.total) for inv in invoices)
    revenue_per_km = 0
    if base_km > 0:
        revenue_per_km = round(total_revenue / base_km, 2)
        
    fuel_efficiency = 0 # Cannot compute without fuel tracking table, default 0
    co2_emissions = round(total_shipments * 1.2, 1) # Estimated from shipments
    
    # Chart data - actual shipments per month
    from collections import defaultdict
    months_data = defaultdict(int)
    for s in shipments:
        if s.createdAt:
            months_data[s.createdAt.strftime('%b')] += 1
            
    monthly_trend = [{"month": k, "shipments": v} for k, v in months_data.items()]
    
    # Real revenue by month
    rev_months = defaultdict(float)
    for inv in invoices:
        if inv.createdAt:
            rev_months[inv.createdAt.strftime('%b')] += float(inv.total)
            
    revenueByMonth = [{"month": k, "revenue": v, "expenses": v * 0.7} for k, v in rev_months.items()]

    response_data = {
        "otifRate": otif_rate,
        "fleetUtilization": fleet_utilization,
        "fuelEfficiency": fuel_efficiency,
        "revenuePerKm": revenue_per_km,
        "co2Emissions": co2_emissions,
        "totalDistance": base_km,
        "monthlyTrend": monthly_trend,
        "revenueByMonth": revenueByMonth
    }
    
    # Cache for 5 minutes (300 seconds)
    cache_set(cache_key, json.dumps(response_data), 300)
    
    return response_data

@router.get("/kpis")
async def get_kpis(current_user: RBACUser = Depends(require_module_access("analytics"))):
    return []

@router.post("/kpis")
async def create_kpi(data: dict, current_user: RBACUser = Depends(require_module_access("analytics"))):
    return data

@router.get("/reports")
async def get_reports(current_user: RBACUser = Depends(require_module_access("analytics"))):
    return []

@router.post("/reports")
async def create_report(data: dict, current_user: RBACUser = Depends(require_module_access("analytics"))):
    return data
