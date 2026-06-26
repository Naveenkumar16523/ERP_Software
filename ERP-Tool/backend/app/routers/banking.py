from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal
import math

from app.utils.db import get_db
from app.middlewares.rbac_middleware import get_current_rbac_user, require_module_access, RBACUser
from app.models.banking_sql_models import BankAccount, BankTransaction
from app.models.finance_sql_models import Invoice

router = APIRouter(prefix="/banking", tags=["Banking"])

class AccountCreate(BaseModel):
    accountName: str
    accountNumber: str
    bankName: str
    balance: Optional[int] = 0
    currency: Optional[str] = "USD"

class TransactionCreate(BaseModel):
    accountId: str
    description: str
    amount: int
    transactionDate: str

@router.get("/accounts")
async def get_accounts(
    current_user: RBACUser = Depends(require_module_access("banking")),
    db: Session = Depends(get_db)
):
    return db.query(BankAccount).order_by(BankAccount.createdAt.desc()).all()

@router.post("/accounts")
async def create_account(
    body: AccountCreate,
    current_user: RBACUser = Depends(require_module_access("banking")),
    db: Session = Depends(get_db)
):
    acc = BankAccount(
        accountName=body.accountName,
        accountNumber=body.accountNumber,
        bankName=body.bankName,
        balance=body.balance,
        currency=body.currency
    )
    db.add(acc)
    db.commit()
    db.refresh(acc)
    return acc

@router.get("/transactions")
async def get_transactions(
    current_user: RBACUser = Depends(require_module_access("banking")),
    db: Session = Depends(get_db)
):
    return db.query(BankTransaction).order_by(BankTransaction.transactionDate.desc()).all()

@router.post("/transactions")
async def create_transaction(
    body: TransactionCreate,
    current_user: RBACUser = Depends(require_module_access("banking")),
    db: Session = Depends(get_db)
):
    tx = BankTransaction(
        accountId=body.accountId,
        description=body.description,
        amount=body.amount,
        transactionDate=datetime.fromisoformat(body.transactionDate.replace("Z", ""))
    )
    db.add(tx)
    
    # Update balance
    acc = db.query(BankAccount).filter(BankAccount.id == body.accountId).first()
    if acc:
        acc.balance += Decimal(str(body.amount))
        
    db.commit()
    db.refresh(tx)
    return tx

@router.post("/reconcile")
async def auto_reconcile(
    current_user: RBACUser = Depends(require_module_access("banking")),
    db: Session = Depends(get_db)
):
    unreconciled_txs = db.query(BankTransaction).filter(
        BankTransaction.reconciled == False,
        BankTransaction.amount > 0
    ).all()
    
    pending_invoices = db.query(Invoice).filter(Invoice.status == "PENDING").all()
    
    matches_found = 0
    
    for tx in unreconciled_txs:
        # Simple fuzzy match based on exact amount
        for inv in pending_invoices:
            # Assume tx.amount is standard unit like invoice.totalAmount (e.g. integer vs numeric)
            try:
                tx_amt = float(tx.amount)
                inv_amt = float(inv.totalAmount)
                
                # Check if amounts match within 0.01 tolerance
                if abs(tx_amt - inv_amt) < 0.01:
                    # Match found!
                    tx.reconciled = True
                    tx.matchedInvoiceId = inv.id
                    inv.status = "PAID"
                    matches_found += 1
                    break
            except Exception:
                pass
                
    db.commit()
    return {"message": f"Auto-reconciliation complete. Matched {matches_found} transactions.", "matches": matches_found}
