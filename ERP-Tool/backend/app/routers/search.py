from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.utils.db import get_db
from app.middlewares.rbac_middleware import get_current_rbac_user, RBACUser

from app.models.crm_sql_models import Lead
from app.models.finance_sql_models import Invoice
from app.models.hr_sql_models import Employee

router = APIRouter(prefix="/search", tags=["Global Search"])

@router.get("/")
async def global_search(
    q: str = Query(..., min_length=1),
    current_user: RBACUser = Depends(get_current_rbac_user),
    db: Session = Depends(get_db)
):
    results = []

    # 1. Search Leads
    leads = db.query(Lead).filter(
        or_(
            Lead.companyName.ilike(f"%{q}%"),
            Lead.contactPerson.ilike(f"%{q}%"),
            Lead.email.ilike(f"%{q}%")
        )
    ).limit(5).all()
    
    for l in leads:
        results.append({
            "type": "Lead",
            "id": l.id,
            "title": f"Lead: {l.companyName}",
            "subtitle": f"{l.contactPerson} - {l.status}",
            "link": "/crm"
        })

    # 2. Search Invoices
    invoices = db.query(Invoice).filter(
        or_(
            Invoice.invoiceNo.ilike(f"%{q}%"),
            Invoice.customerName.ilike(f"%{q}%")
        )
    ).limit(5).all()
    
    for inv in invoices:
        results.append({
            "type": "Invoice",
            "id": inv.id,
            "title": f"Invoice: {inv.invoiceNo}",
            "subtitle": f"{inv.customerName} - {inv.status}",
            "link": "/finance"
        })
        
    # 3. Search Employees
    employees = db.query(Employee).filter(
        or_(
            Employee.firstName.ilike(f"%{q}%"),
            Employee.lastName.ilike(f"%{q}%"),
            Employee.email.ilike(f"%{q}%"),
            Employee.department.ilike(f"%{q}%")
        )
    ).limit(5).all()
    
    for emp in employees:
        results.append({
            "type": "Employee",
            "id": emp.id,
            "title": f"Employee: {emp.firstName} {emp.lastName}",
            "subtitle": f"{emp.department} - {emp.designation}",
            "link": "/hr"
        })

    return {"query": q, "results": results}
