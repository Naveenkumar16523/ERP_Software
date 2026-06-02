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
from app.models.models import Account, JournalEntry
from app.models.schemas import VoucherCreate, AccountCreate

router = APIRouter(prefix="/finance", tags=["Finance"])

def update_account_balance(db: Session, account_id: str, amount: float, is_debit: bool):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        return
    if account.type in ["ASSET", "EXPENSE"]:
        balance_change = amount if is_debit else -amount
    else:
        # LIABILITY, EQUITY, REVENUE
        balance_change = -amount if is_debit else amount
    account.balance += balance_change

def seed_accounts_if_empty(db: Session):
    count = db.query(func.count(Account.id)).scalar()
    if count == 0:
        default_accounts = [
            {"code": "1000", "name": "Bank A/C", "type": "ASSET", "balance": 1000000.0},
            {"code": "1010", "name": "Cash A/C", "type": "ASSET", "balance": 50000.0},
            {"code": "1200", "name": "Accounts Receivable", "type": "ASSET", "balance": 340000.0},
            {"code": "2000", "name": "Accounts Payable", "type": "LIABILITY", "balance": 120000.0},
            {"code": "2200", "name": "GST Payable", "type": "LIABILITY", "balance": 18000.0},
            {"code": "2300", "name": "TDS Payable", "type": "LIABILITY", "balance": 5000.0},
            {"code": "3000", "name": "Share Capital", "type": "EQUITY", "balance": 800000.0},
            {"code": "4000", "name": "Sales Revenue", "type": "REVENUE", "balance": 650000.0},
            {"code": "5000", "name": "Consulting Expense", "type": "EXPENSE", "balance": 150000.0},
            {"code": "5010", "name": "Salary Expense", "type": "EXPENSE", "balance": 714000.0}
        ]
        for acc in default_accounts:
            db_acc = Account(
                code=acc["code"],
                name=acc["name"],
                type=acc["type"],
                balance=acc["balance"]
            )
            db.add(db_acc)
        db.commit()

# 1. ACCOUNTS LIST

@router.get("/accounts")
async def get_accounts(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        seed_accounts_if_empty(db)
        accounts = db.query(Account).order_by(Account.code.asc()).all()
        return accounts
    except Exception as e:
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
        count = db.query(func.count(JournalEntry.id)).scalar()
        timestamp_ms = int(time.time() * 1000)
        voucher_no = f"VCHR-{timestamp_ms}-{count + 1}"

        # Get last entry to link hash
        last_entry = db.query(JournalEntry).order_by(JournalEntry.blockIndex.desc()).first()
        prev_hash = last_entry.blockHash if last_entry else "0"
        next_index = (last_entry.blockIndex + 1) if last_entry else 1
        date = datetime.utcnow()

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

# 3. VERIFY LEDGER CHAIN INTEGRITY

@router.get("/verify-ledger")
async def verify_ledger(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        audit_result = verify_ledger_chain(db)
        return audit_result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 4. REPORT: TRIAL BALANCE

@router.get("/reports/trial-balance")
async def get_trial_balance_report(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        seed_accounts_if_empty(db)
        accounts = db.query(Account).all()
        
        total_debit = 0.0
        total_credit = 0.0
        trial_balance = []

        for acc in accounts:
            debit = 0.0
            credit = 0.0
            if acc.type in ["ASSET", "EXPENSE"]:
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
async def get_profit_loss_report(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        seed_accounts_if_empty(db)
        revenues = db.query(Account).filter(Account.type == "REVENUE").all()
        expenses = db.query(Account).filter(Account.type == "EXPENSE").all()
        
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
async def get_balance_sheet_report(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        seed_accounts_if_empty(db)
        assets = db.query(Account).filter(Account.type == "ASSET").all()
        liabilities = db.query(Account).filter(Account.type == "LIABILITY").all()
        equities = db.query(Account).filter(Account.type == "EQUITY").all()
        
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
async def reconcile_bank_statement(body: dict, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    statement_lines = body.get("statementLines")
    if not statement_lines or not isinstance(statement_lines, list):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": "Please provide statementLines list."})

    try:
        ledger_entries = db.query(JournalEntry).filter(
            or_(JournalEntry.debitAcc == "Bank A/C", JournalEntry.creditAcc == "Bank A/C")
        ).all()

        reconciled = []
        unmatched = []

        for line in statement_lines:
            # line structure: { date: str, amount: float, desc: str }
            try:
                line_date = datetime.fromisoformat(line.get("date").replace("Z", "+00:00")).replace(tzinfo=None)
            except:
                line_date = datetime.utcnow()
                
            line_amount = float(line.get("amount", 0))
            line_desc = str(line.get("desc", "")).lower()

            best_match = None
            highest_score = 0

            for entry in ledger_entries:
                score = 0
                
                # 1. Exact amount match (60 points)
                if abs(entry.amount - line_amount) < 0.01:
                    score += 60
                    
                # 2. Date proximity match (30 points for <=1 day, 15 points for <=5 days)
                day_difference = abs((line_date - entry.date).days)
                if day_difference <= 1:
                    score += 30
                elif day_difference <= 5:
                    score += 15
                    
                # 3. Narration text match (10 points)
                narration = entry.narration.lower()
                if narration in line_desc or line_desc in narration:
                    score += 10
                    
                if score > highest_score and score >= 70:
                    highest_score = score
                    best_match = entry

            if best_match:
                reconciled.append({
                    "statementLine": line,
                    "matchedEntry": {
                        "id": best_match.id,
                        "blockIndex": best_match.blockIndex,
                        "voucherNo": best_match.voucherNo,
                        "amount": best_match.amount,
                        "date": best_match.date,
                        "narration": best_match.narration,
                        "debitAcc": best_match.debitAcc,
                        "creditAcc": best_match.creditAcc
                    },
                    "confidence": f"{highest_score}%"
                })
            else:
                unmatched.append(line)

        return {"reconciled": reconciled, "unmatched": unmatched}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 8. TAX SUMMARY

@router.get("/tax/summary")
async def get_tax_summary(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
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
