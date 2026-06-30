from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import calendar
import uuid
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.utils.db import get_db
from app.middlewares.rbac_middleware import get_current_rbac_user, require_module_access, RBACUser
from app.models.payroll_sql_models import TaxRule, PayrollRecord
from app.models.hr_sql_models import Employee

router = APIRouter(prefix="/payroll", tags=["Payroll"])

class TaxRuleCreate(BaseModel):
    region: str
    minSalary: float
    maxSalary: Optional[float] = None
    taxPercent: float

class PayrollGenerateReq(BaseModel):
    month: int
    year: int

@router.get("/rules")
async def list_tax_rules(
    current_user: RBACUser = Depends(require_module_access("payroll")),
    db: Session = Depends(get_db)
):
    return db.query(TaxRule).order_by(TaxRule.minSalary).all()

@router.post("/rules", status_code=status.HTTP_201_CREATED)
async def create_tax_rule(
    body: TaxRuleCreate,
    current_user: RBACUser = Depends(require_module_access("payroll")),
    db: Session = Depends(get_db)
):
    rule = TaxRule(
        region=body.region,
        minSalary=body.minSalary,
        maxSalary=body.maxSalary,
        taxPercent=body.taxPercent
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule

@router.delete("/rules/{rule_id}")
async def delete_tax_rule(
    rule_id: str,
    current_user: RBACUser = Depends(require_module_access("payroll")),
    db: Session = Depends(get_db)
):
    rule = db.query(TaxRule).filter(TaxRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Tax rule not found")
    db.delete(rule)
    db.commit()
    return {"message": "Deleted successfully"}

@router.get("/records")
async def list_payroll_records(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: RBACUser = Depends(require_module_access("payroll")),
    db: Session = Depends(get_db)
):
    query = db.query(PayrollRecord)
    if month:
        query = query.filter(PayrollRecord.month == month)
    if year:
        query = query.filter(PayrollRecord.year == year)
    return query.order_by(PayrollRecord.createdAt.desc()).all()

@router.post("/generate", status_code=status.HTTP_201_CREATED)
async def generate_payroll(
    body: PayrollGenerateReq,
    current_user: RBACUser = Depends(require_module_access("payroll")),
    db: Session = Depends(get_db)
):
    # Prevent duplicate generation
    existing = db.query(PayrollRecord).filter(
        PayrollRecord.month == body.month, 
        PayrollRecord.year == body.year
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Payroll already generated for this month and year")
    
    employees = db.query(Employee).filter(Employee.status == "Active").all()
    if not employees:
        raise HTTPException(status_code=404, detail="No active employees found")
        
    tax_rules = db.query(TaxRule).order_by(TaxRule.minSalary).all()
    
    records = []
    
    # Simple days in month calculation
    days_in_month = calendar.monthrange(body.year, body.month)[1]
    
    for emp in employees:
        base_salary = emp.salary or 0
        allowances = 0 # Can be calculated based on level later
        
        # Calculate daily rate
        daily_rate = base_salary / days_in_month if base_salary > 0 else 0
        
        # Unpaid leave deductions
        unpaid_days = emp.unpaidLeaveDeductionDays or 0
        unpaid_amount = round(unpaid_days * daily_rate, 2)
        
        # Clear the deduction days from employee after capturing them in payroll
        emp.unpaidLeaveDeductionDays = 0
        
        taxable_income = float(base_salary) + allowances - unpaid_amount
        if taxable_income < 0:
            taxable_income = 0
            
        # Determine tax bracket
        applicable_tax_pct = 0
        for rule in tax_rules:
            if taxable_income >= rule.minSalary:
                if rule.maxSalary is None or taxable_income <= rule.maxSalary:
                    applicable_tax_pct = float(rule.taxPercent)
                    break
                    
        tax_amount = round((taxable_income * applicable_tax_pct) / 100, 2)
        net_pay = taxable_income - tax_amount
        
        # Mocking pdf logic
        pdf_mock = f"data:application/pdf;base64,JVBERi0xLjc..." # Could generate real one later
        
        record = PayrollRecord(
            employeeId=emp.id,
            employeeName=emp.fullName,
            month=body.month,
            year=body.year,
            baseSalary=base_salary,
            allowances=allowances,
            unpaidLeaveDeductionDays=unpaid_days,
            unpaidLeaveDeductionAmount=unpaid_amount,
            taxDeduction=tax_amount,
            netPay=net_pay,
            status="Processed",
            payslipPdf=pdf_mock,
            processedAt=datetime.utcnow()
        )
        db.add(record)
        records.append(record)
        
    db.commit()
    for r in records:
        db.refresh(r)
        
    return {"message": f"Successfully generated payroll for {len(records)} employees", "records": records}


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

@router.post("/payslips/{payroll_id}/send-payslip")
async def send_payslip(payroll_id: str, db: Session = Depends(get_db)):
    # Mock sending an email for a given payslip
    sender_email = "erp-system@demo.com"
    receiver_email = "employee@demo.com" # In reality, fetched from Employee model
    
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Your Payslip - {payroll_id}"
    msg["From"] = sender_email
    msg["To"] = receiver_email
    
    html = f"""
    <html>
      <body>
        <h2>Hello,</h2>
        <p>Your payslip <strong>{payroll_id}</strong> has been generated.</p>
        <p>Please log in to the ERP portal to view the full details.</p>
        <br>
        <p>Best regards,<br>ERP Payroll Team</p>
      </body>
    </html>
    """
    
    part = MIMEText(html, "html")
    msg.attach(part)
    
    # Mocking SMTP send
    print(f"[MOCK SMTP] Sending email to {receiver_email}:\n{msg.as_string()}")
    
    return {"status": "success", "message": f"Payslip sent successfully"}
