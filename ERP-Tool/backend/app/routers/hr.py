import time
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, desc, func

from app.utils.db import get_db
from app.utils.audit import log_audit_event
from app.utils.crypto_ledger import calculate_block_hash
from app.middlewares.auth_middleware import get_current_user, require_permission, AuthenticatedUser
from app.models.models import Department, Employee, Candidate, LeaveRequest, AttendanceLog, PaySlip, Account, JournalEntry
from app.models.schemas import EmployeeCreate, LeaveRequestCreate, LeaveStatusUpdate

router = APIRouter(prefix="/hr", tags=["HR"])

# Helper to update account balance
def update_account_balance(db: Session, name_or_code: str, amount: float, is_debit: bool):
    account = db.query(Account).filter(or_(Account.code == name_or_code, Account.name == name_or_code)).first()
    if not account:
        return
    if account.type in ["ASSET", "EXPENSE"]:
        balance_change = amount if is_debit else -amount
    else:
        balance_change = -amount if is_debit else amount
    account.balance += balance_change

# 1. DEPARTMENTS

@router.get("/departments")
async def get_departments(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        departments = db.query(Department).order_by(Department.code.asc()).all()
        # Simple serialization structure including children/parent relations if needed
        result = []
        for d in departments:
            parent = db.query(Department).filter(Department.id == d.parentId).first() if d.parentId else None
            children = db.query(Department).filter(Department.parentId == d.id).all()
            result.append({
                "id": d.id,
                "code": d.code,
                "name": d.name,
                "parentId": d.parentId,
                "createdAt": d.createdAt,
                "updatedAt": d.updatedAt,
                "parent": {"id": parent.id, "code": parent.code, "name": parent.name} if parent else None,
                "children": [{"id": c.id, "code": c.code, "name": c.name} for c in children]
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/departments", status_code=status.HTTP_201_CREATED)
async def create_department(body: dict, current_user: AuthenticatedUser = Depends(require_permission("hr:write")), db: Session = Depends(get_db)):
    code = body.get("code")
    name = body.get("name")
    parentId = body.get("parentId")
    if not code or not name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": "Code and name are required."})
        
    try:
        existing = db.query(Department).filter(or_(Department.code == code, Department.name == name)).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Conflict", "message": "Department code or name already exists"})

        department = Department(code=code, name=name, parentId=parentId or None)
        db.add(department)
        db.commit()
        db.refresh(department)
        return department
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 2. EMPLOYEES

@router.get("/employees")
async def get_employees(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        employees = db.query(Employee).order_by(Employee.employeeCode.asc()).all()
        result = []
        for e in employees:
            dept = db.query(Department).filter(Department.id == e.departmentId).first()
            mgr = db.query(Employee).filter(Employee.id == e.managerId).first() if e.managerId else None
            result.append({
                "id": e.id,
                "employeeCode": e.employeeCode,
                "firstName": e.firstName,
                "lastName": e.lastName,
                "email": e.email,
                "phone": e.phone,
                "departmentId": e.departmentId,
                "jobTitle": e.jobTitle,
                "managerId": e.managerId,
                "baseSalary": e.baseSalary,
                "joiningDate": e.joiningDate,
                "isActive": e.isActive,
                "createdAt": e.createdAt,
                "updatedAt": e.updatedAt,
                "department": {"id": dept.id, "code": dept.code, "name": dept.name} if dept else None,
                "manager": {"id": mgr.id, "employeeCode": mgr.employeeCode, "firstName": mgr.firstName, "lastName": mgr.lastName} if mgr else None
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/employees", status_code=status.HTTP_201_CREATED)
async def create_employee(body: EmployeeCreate, current_user: AuthenticatedUser = Depends(require_permission("hr:write")), db: Session = Depends(get_db)):
    try:
        existing = db.query(Employee).filter(or_(Employee.employeeCode == body.employeeCode, Employee.email == body.email)).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Conflict", "message": "Employee code or email already registered"})

        employee = Employee(
            employeeCode=body.employeeCode,
            firstName=body.firstName,
            lastName=body.lastName,
            email=body.email,
            phone=body.phone,
            departmentId=body.departmentId,
            jobTitle=body.jobTitle,
            managerId=body.managerId or None,
            baseSalary=float(body.baseSalary)
        )
        db.add(employee)
        db.commit()
        db.refresh(employee)
        return employee
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 3. RECRUITMENT CANDIDATES

@router.get("/recruitment/candidates")
async def get_candidates(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        candidates = db.query(Candidate).order_by(desc(Candidate.createdAt)).all()
        return candidates
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/recruitment/candidates", status_code=status.HTTP_201_CREATED)
async def create_candidate(body: dict, current_user: AuthenticatedUser = Depends(require_permission("hr:write")), db: Session = Depends(get_db)):
    name = body.get("name")
    email = body.get("email")
    phone = body.get("phone")
    jobTitle = body.get("jobTitle")
    status_val = body.get("status") or "APPLIED"
    resumeUrl = body.get("resumeUrl")

    if not name or not email or not jobTitle:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": "Name, email, and job title are required."})
        
    try:
        candidate = Candidate(
            name=name,
            email=email,
            phone=phone,
            jobTitle=jobTitle,
            status=status_val,
            resumeUrl=resumeUrl
        )
        db.add(candidate)
        db.commit()
        db.refresh(candidate)
        return candidate
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.patch("/recruitment/candidates/{id}")
async def patch_candidate(id: str, body: dict, current_user: AuthenticatedUser = Depends(require_permission("hr:write")), db: Session = Depends(get_db)):
    try:
        candidate = db.query(Candidate).filter(Candidate.id == id).first()
        if not candidate:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Not Found", "message": "Candidate not found."})

        if "status" in body:
            candidate.status = body["status"]
        if "offerPay" in body and body["offerPay"] is not None:
            candidate.offerPay = float(body["offerPay"])

        db.commit()
        db.refresh(candidate)
        return candidate
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/recruitment/candidates/{id}/offer")
async def generate_offer_letter(id: str, body: dict, current_user: AuthenticatedUser = Depends(require_permission("hr:write")), db: Session = Depends(get_db)):
    offerPay = body.get("offerPay")
    try:
        candidate = db.query(Candidate).filter(Candidate.id == id).first()
        if not candidate:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Not Found", "message": "Candidate not found."})

        pay = float(offerPay) if offerPay else (candidate.offerPay or 50000.0)
        date_str = datetime.utcnow().strftime("%d/%m/%Y")
        
        offer_letter_text = f"""
========================================
OFFER OF EMPLOYMENT
========================================
Date: {date_str}

Dear {candidate.name},

We are thrilled to offer you the position of {candidate.jobTitle} with our organization.

Compensation: ₹{pay:,.2f} per month (Base Salary).
Verification ID: OFF-{candidate.id[:8].upper()}

Your professional skills and experience will be a valuable asset to our team.

Sincerely,
HR Director, EPR Dashboard Corp.
========================================
"""
        candidate.status = "OFFERED"
        candidate.offerSent = True
        candidate.offerPay = pay
        db.commit()

        return {
            "message": "Offer letter generated successfully.",
            "offerLetter": offer_letter_text,
            "candidate": {
                "id": candidate.id,
                "name": candidate.name,
                "email": candidate.email,
                "phone": candidate.phone,
                "jobTitle": candidate.jobTitle,
                "status": "OFFERED",
                "offerSent": True,
                "offerPay": pay
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 4. LEAVES

@router.get("/leaves")
async def get_leaves(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        leaves = db.query(LeaveRequest).order_by(desc(LeaveRequest.createdAt)).all()
        result = []
        for l in leaves:
            emp = db.query(Employee).filter(Employee.id == l.employeeId).first()
            result.append({
                "id": l.id,
                "employeeId": l.employeeId,
                "leaveType": l.leaveType,
                "startDate": l.startDate,
                "endDate": l.endDate,
                "status": l.status,
                "reason": l.reason,
                "approvedBy": l.approvedBy,
                "createdAt": l.createdAt,
                "updatedAt": l.updatedAt,
                "employee": {"id": emp.id, "firstName": emp.firstName, "lastName": emp.lastName} if emp else None
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/leaves", status_code=status.HTTP_201_CREATED)
async def create_leave(body: LeaveRequestCreate, employeeId: str, current_user: AuthenticatedUser = Depends(require_permission("hr:write")), db: Session = Depends(get_db)):
    try:
        leave = LeaveRequest(
            employeeId=employeeId,
            leaveType=body.leaveType,
            startDate=body.startDate,
            endDate=body.endDate,
            reason=body.reason,
            status="PENDING"
        )
        db.add(leave)
        db.commit()
        db.refresh(leave)
        return leave
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.patch("/leaves/{id}")
async def update_leave_status(id: str, body: LeaveStatusUpdate, current_user: AuthenticatedUser = Depends(require_permission("hr:write")), db: Session = Depends(get_db)):
    try:
        leave = db.query(LeaveRequest).filter(LeaveRequest.id == id).first()
        if not leave:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Not Found", "message": "Leave request not found."})

        leave.status = body.status
        leave.approvedBy = current_user.email
        db.commit()
        db.refresh(leave)
        return leave
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 5. ATTENDANCE

@router.get("/attendance")
async def get_attendance(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        logs = db.query(AttendanceLog).order_by(desc(AttendanceLog.date)).all()
        result = []
        for l in logs:
            emp = db.query(Employee).filter(Employee.id == l.employeeId).first()
            result.append({
                "id": l.id,
                "employeeId": l.employeeId,
                "date": l.date,
                "checkIn": l.checkIn,
                "checkOut": l.checkOut,
                "status": l.status,
                "verificationMethod": l.verificationMethod,
                "createdAt": l.createdAt,
                "employee": {"id": emp.id, "firstName": emp.firstName, "lastName": emp.lastName} if emp else None
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/attendance/log")
async def log_attendance(body: dict, current_user: AuthenticatedUser = Depends(require_permission("hr:write")), db: Session = Depends(get_db)):
    employeeId = body.get("employeeId")
    date_str = body.get("date")
    checkIn_str = body.get("checkIn")
    checkOut_str = body.get("checkOut")
    status_val = body.get("status")
    verificationMethod = body.get("verificationMethod")

    if not employeeId or not date_str or not status_val or not verificationMethod:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": "Missing attendance details."})

    try:
        formatted_date = datetime.fromisoformat(date_str.replace("Z", "+00:00")).replace(tzinfo=None)
        checkIn = datetime.fromisoformat(checkIn_str.replace("Z", "+00:00")).replace(tzinfo=None) if checkIn_str else None
        checkOut = datetime.fromisoformat(checkOut_str.replace("Z", "+00:00")).replace(tzinfo=None) if checkOut_str else None

        existing = db.query(AttendanceLog).filter(
            AttendanceLog.employeeId == employeeId,
            AttendanceLog.date == formatted_date
        ).first()

        if existing:
            existing.checkIn = checkIn or existing.checkIn
            existing.checkOut = checkOut or existing.checkOut
            existing.status = status_val
            existing.verificationMethod = verificationMethod
            log = existing
        else:
            log = AttendanceLog(
                employeeId=employeeId,
                date=formatted_date,
                checkIn=checkIn,
                checkOut=checkOut,
                status=status_val,
                verificationMethod=verificationMethod
            )
            db.add(log)
            
        db.commit()
        db.refresh(log)
        return log
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 6. PAYROLL ENGINE

@router.get("/payroll/slips")
async def get_payroll_slips(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        slips = db.query(PaySlip).order_by(desc(PaySlip.year), desc(PaySlip.month)).all()
        result = []
        for s in slips:
            emp = db.query(Employee).filter(Employee.id == s.employeeId).first()
            result.append({
                "id": s.id,
                "employeeId": s.employeeId,
                "month": s.month,
                "year": s.year,
                "baseSalary": s.baseSalary,
                "pfDeduction": s.pfDeduction,
                "esiDeduction": s.esiDeduction,
                "tdsDeduction": s.tdsDeduction,
                "netPay": s.netPay,
                "status": s.status,
                "processedAt": s.processedAt,
                "employee": {"id": emp.id, "firstName": emp.firstName, "lastName": emp.lastName} if emp else None
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/payroll/calculate", status_code=status.HTTP_201_CREATED)
async def calculate_payroll(body: dict, req: Request, current_user: AuthenticatedUser = Depends(require_permission("hr:write")), db: Session = Depends(get_db)):
    employeeId = body.get("employeeId")
    month = body.get("month")
    year = body.get("year")

    if not employeeId or month is None or year is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": "Employee ID, month, and year are required."})

    try:
        month = int(month)
        year = int(year)
        
        employee = db.query(Employee).filter(Employee.id == employeeId).first()
        if not employee:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Not Found", "message": "Employee not found."})

        # Prevent duplicate slip
        duplicate = db.query(PaySlip).filter(
            PaySlip.employeeId == employeeId,
            PaySlip.month == month,
            PaySlip.year == year
        ).first()
        if duplicate:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": f"Payroll already processed for this employee in {month}/{year}."})

        baseSalary = employee.baseSalary
        pfDeduction = baseSalary * 0.12       # 12% standard PF
        esiDeduction = baseSalary * 0.0075    # 0.75% standard ESI

        # Slab-based TDS
        tdsDeduction = 0.0
        if baseSalary > 100000:
            tdsDeduction = 6250.0 + (baseSalary - 100000) * 0.20
        elif baseSalary > 50000:
            tdsDeduction = 1250.0 + (baseSalary - 50000) * 0.10
        elif baseSalary > 25000:
            tdsDeduction = (baseSalary - 25000) * 0.05

        netPay = baseSalary - (pfDeduction + esiDeduction + tdsDeduction)

        # Create slip
        slip = PaySlip(
            employeeId=employeeId,
            month=month,
            year=year,
            baseSalary=baseSalary,
            pfDeduction=pfDeduction,
            esiDeduction=esiDeduction,
            tdsDeduction=tdsDeduction,
            netPay=netPay,
            status="PAID"
        )
        db.add(slip)

        # Post atomic double entry matching express logic
        last_entry = db.query(JournalEntry).order_by(JournalEntry.blockIndex.desc()).first()
        prev_hash = last_entry.blockHash if last_entry else "0"
        next_index = (last_entry.blockIndex + 1) if last_entry else 1
        voucher_no = f"VCHR-PAY-{int(time.time() * 1000)}-{next_index}"
        date = datetime.utcnow()

        block_hash = calculate_block_hash(
            block_index=next_index,
            voucher_no=voucher_no,
            amount=baseSalary,
            debit_acc="Salary Expense",
            credit_acc="Bank A/C",
            prev_hash=prev_hash,
            date=date
        )

        journal = JournalEntry(
            blockIndex=next_index,
            voucherType="JOURNAL",
            voucherNo=voucher_no,
            date=date,
            amount=baseSalary,
            debitAcc="Salary Expense",
            creditAcc="Bank A/C",
            narration=f"Automated payroll entry for {employee.firstName} {employee.lastName} ({month}/{year})",
            prevHash=prev_hash,
            blockHash=block_hash
        )
        db.add(journal)

        # Adjust balances
        update_account_balance(db, "5010", baseSalary, True)      # Debit Salary Expense
        update_account_balance(db, "1000", netPay, False)          # Credit Bank A/C
        update_account_balance(db, "2300", tdsDeduction, False)    # Credit TDS Payable
        update_account_balance(db, "2000", pfDeduction + esiDeduction, False) # Credit accounts payable for PF/ESI

        db.commit()
        db.refresh(slip)
        db.refresh(journal)

        await log_audit_event(
            user_id=current_user.id,
            action="CALCULATE_PAYROLL",
            resource="PaySlip",
            details={
                "id": slip.id,
                "employeeId": slip.employeeId,
                "netPay": slip.netPay
            },
            req=req
        )

        return {"slip": slip, "journal": journal}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})
