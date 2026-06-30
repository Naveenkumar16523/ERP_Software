import uuid
from datetime import datetime

with open('app/routers/payroll.py', 'r', encoding='utf-8') as f:
    content = f.read()

mock_routes = """
import uuid
from datetime import datetime

@router.get("/payrolls")
async def get_payrolls():
    return [
        { "id": "PR-001", "employeeId": "E-001", "employeeName": "John Doe", "month": 5, "year": 2026, "baseSalary": 50000, "taxDeduction": 5000, "netPay": 45000, "status": "Processed" }
    ]

@router.post("/payrolls", status_code=status.HTTP_201_CREATED)
async def create_payroll(body: dict):
    return { "id": f"PR-00{uuid.uuid4().hex[:2]}", **body, "status": "Draft" }

@router.get("/structures")
async def get_structures():
    return [
        { "id": "ST-001", "role": "Software Engineer", "baseSalary": 80000, "allowances": 20000 }
    ]

@router.post("/structures", status_code=status.HTTP_201_CREATED)
async def create_structure(body: dict):
    return { "id": f"ST-00{uuid.uuid4().hex[:2]}", **body }

@router.get("/payslips")
async def get_payslips():
    return []

@router.post("/payslips", status_code=status.HTTP_201_CREATED)
async def create_payslip(body: dict):
    return { "id": f"PS-00{uuid.uuid4().hex[:2]}", **body }
"""

if '@router.get("/payrolls")' not in content:
    with open('app/routers/payroll.py', 'w', encoding='utf-8') as f:
        f.write(content + '\n' + mock_routes)
