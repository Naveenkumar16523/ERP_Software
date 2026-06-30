import os

ecommerce_file = 'app/routers/ecommerce.py'
if os.path.exists(ecommerce_file):
    with open(ecommerce_file, 'r', encoding='utf-8') as f:
        content = f.read()

    mock_routes = """
import uuid
from datetime import datetime

@router.get("/products")
async def get_products():
    return [
        { "id": "PROD-001", "name": "Logistics Cloud Standard", "category": "Software", "price": 199.99, "stock": 1000 },
        { "id": "PROD-002", "name": "GPS Tracker Unit", "category": "Hardware", "price": 49.99, "stock": 500 }
    ]

@router.post("/products", status_code=status.HTTP_201_CREATED)
async def create_product(body: dict):
    return { "id": f"PROD-00{uuid.uuid4().hex[:2]}", **body }

@router.get("/orders")
async def get_orders():
    return [
        { "id": "ORD-001", "customerName": "Acme Corp", "total": 499.95, "status": "SHIPPED", "date": datetime.utcnow().isoformat() + "Z" }
    ]

@router.post("/orders", status_code=status.HTTP_201_CREATED)
async def create_order(body: dict):
    return { "id": f"ORD-00{uuid.uuid4().hex[:2]}", **body, "status": "PROCESSING", "date": datetime.utcnow().isoformat() + "Z" }
"""
    if '@router.get("/products")' not in content:
        with open(ecommerce_file, 'w', encoding='utf-8') as f:
            f.write(content + '\n' + mock_routes)

