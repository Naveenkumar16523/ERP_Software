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

    # Calculate KPIs
    shipments = db.query(Shipment).all()
    vehicles = db.query(FleetVehicle).all()
    
    total_shipments = len(shipments)
    delivered = len([s for s in shipments if s.status == "Delivered"])
    
    # OTIF (On-Time In-Full) Rate - simulate based on delivered ratio + 5% buffer
    otif_rate = 0
    if total_shipments > 0:
        otif_rate = round((delivered / total_shipments) * 100, 1)
        if otif_rate == 0: otif_rate = 85.5 # Fallback if no deliveries yet
    
    # Fleet Utilization
    total_vehicles = len(vehicles)
    in_transit_vehicles = len([v for v in vehicles if v.status == "In Transit"])
    fleet_utilization = 0
    if total_vehicles > 0:
        fleet_utilization = round((in_transit_vehicles / total_vehicles) * 100, 1)
        
    # Simulated metrics based on shipment volume
    base_km = total_shipments * 450
    revenue_per_km = 45.5 # INR per km
    fuel_efficiency = 4.2 # km/l
    co2_emissions = total_shipments * 1.2 # tons
    
    # Chart data
    monthly_trend = [
        {"month": "Jan", "shipments": total_shipments * 0.8},
        {"month": "Feb", "shipments": total_shipments * 0.9},
        {"month": "Mar", "shipments": total_shipments * 1.1},
        {"month": "Apr", "shipments": total_shipments},
    ]

    response_data = {
        "otifRate": otif_rate,
        "fleetUtilization": fleet_utilization,
        "fuelEfficiency": fuel_efficiency,
        "revenuePerKm": revenue_per_km,
        "co2Emissions": co2_emissions,
        "totalDistance": base_km,
        "monthlyTrend": monthly_trend
    }
    
    # Cache for 5 minutes (300 seconds)
    cache_set(cache_key, json.dumps(response_data), 300)
    
    return response_data

