import asyncio
from app.utils.db import SessionLocal
from app.routers.dashboard import get_dashboard_kpis, get_dashboard_metrics

async def test_dashboard():
    db = SessionLocal()
    try:
        print("Testing dashboard KPIs endpoint...")
        kpis = await get_dashboard_kpis(current_user=None, db=db)
        print("KPIs:", kpis)
        
        print("\nTesting dashboard metrics endpoint...")
        metrics = await get_dashboard_metrics(current_user=None, db=db)
        print("Metrics:", metrics)
        
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(test_dashboard())
