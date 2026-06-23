import time
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.utils.db import get_db
from app.middlewares.auth_middleware import get_current_user, require_permission, AuthenticatedUser
from app.models.models import PaySlip, Employee, JournalEntry, Account

router = APIRouter(prefix="/payroll", tags=["Payroll"])

# Helper to update account balance
def update_account_balance(db: Session, name_or_code: str, amount: float, is_debit: bool):
    from sqlalchemy import or_
    account = db.query(Account).filter(or_(Account.code == name_or_code, Account.name == name_or_code)).first()
    if not account:
        return
    if account.type in ["ASSET", "EXPENSE"]:
        balance_change = amount if is_debit else -amount
    else:
        balance_change = -amount if is_debit else amount
    account.balance += balance_change

@router.get("")
async def get_payrolls(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
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
                "employeeName": f"{emp.firstName} {emp.lastName}" if emp else "Unknown",
                "employee": {"id": emp.id, "firstName": emp.firstName, "lastName": emp.lastName} if emp else None
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/generate", status_code=status.HTTP_201_CREATED)
async def generate_payslip(body: dict, current_user: AuthenticatedUser = Depends(require_permission("hr:write")), db: Session = Depends(get_db)):
    employeeId = body.get("employeeId")
    month = body.get("month")
    year = body.get("year")

    if not employeeId or month is None or year is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Employee ID, month, and year are required.")

    try:
        month = int(month)
        year = int(year)
        
        employee = db.query(Employee).filter(Employee.id == employeeId).first()
        if not employee:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found.")

        # Prevent duplicate slip
        duplicate = db.query(PaySlip).filter(
            PaySlip.employeeId == employeeId,
            PaySlip.month == month,
            PaySlip.year == year
        ).first()
        if duplicate:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payroll already processed for this period.")

        baseSalary = employee.baseSalary
        pfDeduction = baseSalary * 0.12
        esiDeduction = baseSalary * 0.0075

        tdsDeduction = 0.0
        if baseSalary > 100000:
            tdsDeduction = 6250.0 + (baseSalary - 100000) * 0.20
        elif baseSalary > 50000:
            tdsDeduction = 1250.0 + (baseSalary - 50000) * 0.10
        elif baseSalary > 25000:
            tdsDeduction = (baseSalary - 25000) * 0.05

        netPay = baseSalary - (pfDeduction + esiDeduction + tdsDeduction)

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
        from app.utils.crypto_ledger import calculate_block_hash
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
        
        return {
            "id": slip.id,
            "employeeId": slip.employeeId,
            "month": slip.month,
            "year": slip.year,
            "baseSalary": slip.baseSalary,
            "pfDeduction": slip.pfDeduction,
            "esiDeduction": slip.esiDeduction,
            "tdsDeduction": slip.tdsDeduction,
            "netPay": slip.netPay,
            "status": slip.status,
            "processedAt": slip.processedAt,
            "employeeName": f"{employee.firstName} {employee.lastName}"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.patch("/{id}/process")
async def process_payroll(id: str, current_user: AuthenticatedUser = Depends(require_permission("hr:write")), db: Session = Depends(get_db)):
    try:
        slip = db.query(PaySlip).filter(PaySlip.id == id).first()
        if not slip:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pay slip not found")
        slip.status = "PAID"
        db.commit()
        db.refresh(slip)
        return slip
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
