from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.utils.db import get_db
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
        ]
        for acc_data in default_accounts:
            acc = Account(**acc_data)
            db.add(acc)
        db.commit()

@router.get("/accounts")
def get_accounts(current_user: AuthenticatedUser = Depends(require_permission("finance:read")), db: Session = Depends(get_db)):
    try:
        seed_accounts_if_empty(db)
        accounts = db.query(Account).all()
        return [{"id": acc.id, "code": acc.code, "name": acc.name, "type": acc.type, "balance": acc.balance} for acc in accounts]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/accounts", status_code=status.HTTP_201_CREATED)
def create_account(body: AccountCreate, current_user: AuthenticatedUser = Depends(require_permission("finance:write")), db: Session = Depends(get_db)):
    try:
        acc = Account(
            code=body.accountCode,
            name=body.accountName,
            type=body.accountType,
            balance=body.balance
        )
        db.add(acc)
        db.commit()
        return {"id": acc.id, "code": acc.code, "name": acc.name, "type": acc.type, "balance": acc.balance}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/journal-entries")
def get_journal_entries(current_user: AuthenticatedUser = Depends(require_permission("finance:read")), db: Session = Depends(get_db)):
    try:
        entries = db.query(JournalEntry).order_by(JournalEntry.blockIndex.desc()).all()
        return [
            {
                "id": entry.id,
                "blockIndex": entry.blockIndex,
                "voucherNo": entry.voucherNo,
                "date": entry.date,
                "amount": entry.amount,
                "debitAcc": entry.debitAcc,
                "creditAcc": entry.creditAcc,
                "blockHash": entry.blockHash
            }
            for entry in entries
        ]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
