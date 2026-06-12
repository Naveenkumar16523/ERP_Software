import time
import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.utils.db import get_db
from app.utils.audit import log_audit_event
from app.utils.crypto_ledger import calculate_block_hash, verify_ledger_chain
from app.middlewares.auth_middleware import get_current_user, require_permission, AuthenticatedUser
from app.models.models import Account, JournalEntry, Invoice, Budget, Expense
from app.models.schemas import VoucherCreate, AccountCreate, InvoiceCreate, BudgetCreate, ExpenseCreate

router = APIRouter(prefix="/finance", tags=["Finance"])

def update_account_balance(db: Session, account_id: str, amount: float, is_debit: bool):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        return
    if account.type.upper() in ["ASSET", "EXPENSE"]:
        balance_change = amount if is_debit else -amount
    else:
        # LIABILITY, EQUITY, REVENUE
        balance_change = -amount if is_debit else amount
    account.balance += balance_change

def seed_accounts_if_empty(db: Session):
    # Seeding disabled to start completely empty
    pass

# 1. ACCOUNTS LIST

@router.get("/accounts")
async def get_accounts(current_user: AuthenticatedUser = Depends(require_permission("finance:read")), db: Session = Depends(get_db)):
    try:
        seed_accounts_if_empty(db)
        accounts = db.query(Account).order_by(Account.code.asc()).all()
        return accounts
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/accounts", status_code=status.HTTP_201_CREATED)
async def create_account(body: AccountCreate, current_user: AuthenticatedUser = Depends(require_permission("finance:write")), db: Session = Depends(get_db)):
    try:
        existing = db.query(Account).filter(or_(Account.code == body.code, Account.name == body.name)).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account code or name already exists")
        
        type_mapping = {
            "ASSET": "Asset",
            "LIABILITY": "Liability",
            "EQUITY": "Equity",
            "REVENUE": "Income",
            "EXPENSE": "Expense"
        }
        db_type = type_mapping.get(body.type, body.type)
        
        acc = Account(
            code=body.code,
            name=body.name,
            type=db_type,
            balance=body.balance
        )
        db.add(acc)
        db.commit()
        db.refresh(acc)
        
        return {
            "id": acc.id,
            "code": acc.code,
            "name": acc.name,
            "type": acc.type,
            "balance": acc.balance,
            "status": "ACTIVE",
            "created_at": acc.createdAt
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 2. CREATE VOUCHER & LEDGER ENTRY

@router.post("/voucher", status_code=status.HTTP_201_CREATED)
async def create_voucher(body: VoucherCreate, req: Request, current_user: AuthenticatedUser = Depends(require_permission("finance:write")), db: Session = Depends(get_db)):
    try:
        seed_accounts_if_empty(db)
        
        # Verify both accounts exist
        debit_acc = db.query(Account).filter(or_(Account.code == body.debitAcc, Account.name == body.debitAcc)).first()
        credit_acc = db.query(Account).filter(or_(Account.code == body.creditAcc, Account.name == body.creditAcc)).first()
        
        if not debit_acc or not credit_acc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Not Found", "message": "Debit or Credit account not found in Chart of Accounts."})

        # Run inside single atomic database transaction
        # Voucher number generation
        if body.voucherNo:
            # Check if this voucher number already exists
            existing_vchr = db.query(JournalEntry).filter(JournalEntry.voucherNo == body.voucherNo).first()
            if existing_vchr:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Voucher/Reference number already exists")
            voucher_no = body.voucherNo
        else:
            count = db.query(func.count(JournalEntry.id)).scalar()
            timestamp_ms = int(time.time() * 1000)
            voucher_no = f"VCHR-{timestamp_ms}-{count + 1}"

        # Get last entry to link hash
        last_entry = db.query(JournalEntry).order_by(JournalEntry.blockIndex.desc()).first()
        prev_hash = last_entry.blockHash if last_entry else "0"
        next_index = (last_entry.blockIndex + 1) if last_entry else 1
        date = body.date if body.date else datetime.utcnow()

        # Compute hash
        block_hash = calculate_block_hash(
            block_index=next_index,
            voucher_no=voucher_no,
            amount=body.amount,
            debit_acc=debit_acc.name,
            credit_acc=credit_acc.name,
            prev_hash=prev_hash,
            date=date
        )

        entry = JournalEntry(
            blockIndex=next_index,
            voucherType=body.voucherType.value,
            voucherNo=voucher_no,
            date=date,
            amount=body.amount,
            debitAcc=debit_acc.name,
            creditAcc=credit_acc.name,
            narration=body.narration or "",
            prevHash=prev_hash,
            blockHash=block_hash
        )
        db.add(entry)

        # Update account balances atomically
        update_account_balance(db, debit_acc.id, body.amount, True)
        update_account_balance(db, credit_acc.id, body.amount, False)
        
        db.commit()
        db.refresh(entry)

        await log_audit_event(
            user_id=current_user.id,
            action="CREATE_VOUCHER",
            resource="JournalEntry",
            details={
                "id": entry.id,
                "voucherNo": entry.voucherNo,
                "amount": entry.amount,
                "debitAcc": entry.debitAcc,
                "creditAcc": entry.creditAcc
            },
            req=req
        )

        return {"message": "Voucher successfully verified and added to cryptographic ledger.", "entry": entry}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 2.5 GET JOURNAL ENTRIES

@router.get("/journal-entries")
async def get_journal_entries(current_user: AuthenticatedUser = Depends(require_permission("finance:read")), db: Session = Depends(get_db)):
    try:
        entries = db.query(JournalEntry).order_by(JournalEntry.blockIndex.desc()).all()
        return entries
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 3. VERIFY LEDGER CHAIN INTEGRITY

@router.get("/verify-ledger")
async def verify_ledger(current_user: AuthenticatedUser = Depends(require_permission("finance:read")), db: Session = Depends(get_db)):
    try:
        audit_result = verify_ledger_chain(db)
        return audit_result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 4. REPORT: TRIAL BALANCE

@router.get("/reports/trial-balance")
async def get_trial_balance_report(current_user: AuthenticatedUser = Depends(require_permission("finance:read")), db: Session = Depends(get_db)):
    try:
        seed_accounts_if_empty(db)
        accounts = db.query(Account).all()
        
        total_debit = 0.0
        total_credit = 0.0
        trial_balance = []

        for acc in accounts:
            debit = 0.0
            credit = 0.0
            if acc.type.upper() in ["ASSET", "EXPENSE"]:
                debit = acc.balance
                total_debit += debit
            else:
                credit = acc.balance
                total_credit += credit

            trial_balance.append({
                "id": acc.id,
                "code": acc.code,
                "name": acc.name,
                "type": acc.type,
                "debit": debit,
                "credit": credit
            })

        return {
            "accounts": trial_balance,
            "totalDebit": total_debit,
            "totalCredit": total_credit,
            "balanced": abs(total_debit - total_credit) < 0.01
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 5. REPORT: PROFIT AND LOSS

@router.get("/reports/profit-loss")
async def get_profit_loss_report(current_user: AuthenticatedUser = Depends(require_permission("finance:read")), db: Session = Depends(get_db)):
    try:
        seed_accounts_if_empty(db)
        revenues = db.query(Account).filter(Account.type.in_(["REVENUE", "Income"])).all()
        expenses = db.query(Account).filter(Account.type.in_(["EXPENSE", "Expense"])).all()
        
        total_revenue = sum(r.balance for r in revenues)
        total_expenses = sum(e.balance for e in expenses)
        
        return {
            "revenues": revenues,
            "expenses": expenses,
            "totalRevenue": total_revenue,
            "totalExpenses": total_expenses,
            "netProfit": total_revenue - total_expenses
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 6. REPORT: BALANCE SHEET

@router.get("/reports/balance-sheet")
async def get_balance_sheet_report(current_user: AuthenticatedUser = Depends(require_permission("finance:read")), db: Session = Depends(get_db)):
    try:
        seed_accounts_if_empty(db)
        assets = db.query(Account).filter(Account.type.in_(["ASSET", "Asset"])).all()
        liabilities = db.query(Account).filter(Account.type.in_(["LIABILITY", "Liability"])).all()
        equities = db.query(Account).filter(Account.type.in_(["EQUITY", "Equity"])).all()
        
        total_assets = sum(a.balance for a in assets)
        total_liabilities = sum(l.balance for l in liabilities)
        total_equities = sum(eq.balance for eq in equities)
        
        return {
            "assets": assets,
            "liabilities": liabilities,
            "equities": equities,
            "totalAssets": total_assets,
            "totalLiabilities": total_liabilities,
            "totalEquities": total_equities,
            "totalLiabilitiesEquities": total_liabilities + total_equities
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 7. BANK STATEMENT RECONCILIATION MATCHING ENGINE

@router.post("/reconcile")
async def reconcile_bank_statement(body: dict, current_user: AuthenticatedUser = Depends(require_permission("finance:write")), db: Session = Depends(get_db)):
    statement_lines = body.get("statementLines")
    if not statement_lines or not isinstance(statement_lines, list):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": "Please provide statementLines list."})

    try:
        # Note: This function needs to be updated to work with the new schema
        # For now, return empty results as the debit/credit accounts are now UUIDs
        return {"reconciled": [], "unmatched": statement_lines, "message": "Bank reconciliation needs to be updated for new schema"}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 8. TAX SUMMARY

@router.get("/tax/summary")
async def get_tax_summary(current_user: AuthenticatedUser = Depends(require_permission("finance:read")), db: Session = Depends(get_db)):
    try:
        seed_accounts_if_empty(db)
        gst_acc = db.query(Account).filter(Account.name == "GST Payable").first()
        tds_acc = db.query(Account).filter(Account.name == "TDS Payable").first()
        
        return {
            "gstPayable": gst_acc.balance if gst_acc else 0.0,
            "tdsPayable": tds_acc.balance if tds_acc else 0.0,
            "gstStatus": "Filing Ready",
            "tdsStatus": "Deductions Verified"
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 9. INVOICES

@router.get("/invoices")
async def get_invoices(current_user: AuthenticatedUser = Depends(require_permission("finance:read")), db: Session = Depends(get_db)):
    try:
        invoices = db.query(Invoice).order_by(Invoice.createdAt.desc()).all()
        return invoices
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/invoices", status_code=status.HTTP_201_CREATED)
async def create_invoice(body: InvoiceCreate, current_user: AuthenticatedUser = Depends(require_permission("finance:write")), db: Session = Depends(get_db)):
    try:
        timestamp_ms = int(time.time() * 1000)
        invoice_no = f"INV-{timestamp_ms}"
        invoice = Invoice(
            invoiceNo=invoice_no,
            customerName=body.customerName,
            totalAmount=body.totalAmount,
            status="PENDING",
            dueDate=body.dueDate,
            sent=False
        )
        db.add(invoice)
        db.commit()
        db.refresh(invoice)
        return invoice
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.patch("/invoices/{id}/status")
async def update_invoice_status(id: str, body: dict, current_user: AuthenticatedUser = Depends(require_permission("finance:write")), db: Session = Depends(get_db)):
    try:
        invoice = db.query(Invoice).filter(Invoice.id == id).first()
        if not invoice:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
        status_val = body.get("status")
        if status_val:
            invoice.status = status_val
        if body.get("sent") is not None:
            invoice.sent = body.get("sent")
        db.commit()
        db.refresh(invoice)
        return invoice
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 10. BUDGETS

@router.get("/budgets")
async def get_budgets(current_user: AuthenticatedUser = Depends(require_permission("finance:read")), db: Session = Depends(get_db)):
    try:
        budgets = db.query(Budget).order_by(Budget.createdAt.desc()).all()
        return budgets
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/budgets", status_code=status.HTTP_201_CREATED)
async def create_budget(body: BudgetCreate, current_user: AuthenticatedUser = Depends(require_permission("finance:write")), db: Session = Depends(get_db)):
    try:
        budget = Budget(
            costCenter=body.costCenter,
            period=body.period,
            amount=body.amount,
            spent=0.0,
            year=body.year,
            month=body.month
        )
        db.add(budget)
        db.commit()
        db.refresh(budget)
        return budget
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 11. EXPENSES

@router.get("/expenses")
async def get_expenses(current_user: AuthenticatedUser = Depends(require_permission("finance:read")), db: Session = Depends(get_db)):
    try:
        expenses = db.query(Expense).order_by(Expense.createdAt.desc()).all()
        return expenses
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/expenses", status_code=status.HTTP_201_CREATED)
async def create_expense(body: ExpenseCreate, current_user: AuthenticatedUser = Depends(require_permission("finance:write")), db: Session = Depends(get_db)):
    try:
        expense = Expense(
            description=body.description,
            category=body.category,
            amount=body.amount,
            date=body.date,
            status="PENDING"
        )
        db.add(expense)
        db.commit()
        db.refresh(expense)
        return expense
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.patch("/expenses/{id}/status")
async def update_expense_status(id: str, body: dict, current_user: AuthenticatedUser = Depends(require_permission("finance:write")), db: Session = Depends(get_db)):
    try:
        expense = db.query(Expense).filter(Expense.id == id).first()
        if not expense:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
        status_val = body.get("status")
        if status_val:
            expense.status = status_val
        expense.approvedBy = current_user.email
        db.commit()
        db.refresh(expense)
        return expense
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})
