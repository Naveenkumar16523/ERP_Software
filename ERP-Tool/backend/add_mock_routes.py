import uuid
from datetime import datetime

with open('app/routers/manufacturing.py', 'r', encoding='utf-8') as f:
    content = f.read()

mock_routes = """
@router.get("/machines")
async def get_machines():
    return [
        { "id": "M-001", "name": "CNC Milling Center", "type": "Milling", "status": "OPERATIONAL", "efficiency": 92 },
        { "id": "M-002", "name": "Laser Cutter Alpha", "type": "Cutting", "status": "MAINTENANCE", "efficiency": 0 },
        { "id": "M-003", "name": "Assembly Robot Arm", "type": "Assembly", "status": "OPERATIONAL", "efficiency": 98 }
    ]

@router.post("/machines", status_code=status.HTTP_201_CREATED)
async def create_machine(body: dict):
    return { "id": f"M-00{uuid.uuid4().hex[:3]}", **body, "status": "OPERATIONAL" }

@router.patch("/machines/{id}/status")
async def update_machine_status(id: str, body: dict):
    return { "id": id, "status": body.get("status") }

@router.get("/work-orders")
async def get_work_orders():
    return [
        { "id": "WO-1001", "product": "Engine Block A", "quantity": 50, "status": "IN_PROGRESS", "progress": 60, "dueDate": datetime.utcnow().isoformat() + "Z" },
        { "id": "WO-1002", "product": "Steel Chassis", "quantity": 120, "status": "PLANNED", "progress": 0, "dueDate": datetime.utcnow().isoformat() + "Z" }
    ]

@router.post("/work-orders", status_code=status.HTTP_201_CREATED)
async def create_work_order(body: dict):
    return { "id": f"WO-10{uuid.uuid4().hex[:2]}", **body, "status": "PLANNED", "progress": 0 }

@router.patch("/work-orders/{id}/status")
async def update_work_order_status(id: str, body: dict):
    return { "id": id, "status": body.get("status") }

@router.get("/downtime")
async def get_downtime():
    return [
        { "id": "DL-001", "machineId": "M-002", "reason": "Scheduled Maintenance", "duration": 120, "date": datetime.utcnow().isoformat() + "Z" }
    ]

@router.post("/downtime", status_code=status.HTTP_201_CREATED)
async def create_downtime(body: dict):
    return { "id": f"DL-00{uuid.uuid4().hex[:2]}", **body }
"""

if "@router.get(\"/machines\")" not in content:
    with open('app/routers/manufacturing.py', 'w', encoding='utf-8') as f:
        f.write(content + '\n' + mock_routes)

with open('app/routers/procurement.py', 'r', encoding='utf-8') as f:
    proc_content = f.read()

proc_mock = """
@router.get("/suppliers")
async def get_suppliers():
    return [
        { "id": "SUP-001", "name": "Global Steel Co", "contact": "John Doe", "email": "john@globalsteel.com", "status": "ACTIVE", "rating": 4.8 },
        { "id": "SUP-002", "name": "TechParts Inc", "contact": "Jane Smith", "email": "jane@techparts.com", "status": "ACTIVE", "rating": 4.5 }
    ]

@router.post("/suppliers", status_code=status.HTTP_201_CREATED)
async def create_supplier(body: dict):
    return { "id": f"SUP-00{uuid.uuid4().hex[:2]}", **body, "status": "ACTIVE" }
"""

if "@router.get(\"/suppliers\")" not in proc_content:
    with open('app/routers/procurement.py', 'w', encoding='utf-8') as f:
        f.write(proc_content + '\n' + proc_mock)
