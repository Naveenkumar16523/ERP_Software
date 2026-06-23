from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.utils.db import get_db
from app.models.models import BankAccount, BankTransaction, BankLoan

router = APIRouter(prefix="/banking", tags=["Banking"])

# ─── Bank Accounts ─────────────────────────────────────────────────────────────

@router.get("/accounts")
async def get_accounts(db: Session = Depends(get_db)):
    try:
        return db.query(BankAccount).order_by(BankAccount.name.asc()).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/accounts", status_code=201)
async def create_account(body: dict, db: Session = Depends(get_db)):
    name = body.get("name")
    bank = body.get("bank")
    accountNo = body.get("accountNo") or body.get("account_no") or f"ACC-{int(datetime.utcnow().timestamp())}"
    acc_type = body.get("type", "CURRENT")
    balance = float(body.get("balance", 0))
    if not name or not bank:
        raise HTTPException(status_code=400, detail="Name and bank are required")
    try:
        account = BankAccount(name=name, bank=bank, accountNo=accountNo, type=acc_type, balance=balance)
        db.add(account)
        db.commit()
        db.refresh(account)
        return account
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ─── Bank Transactions ─────────────────────────────────────────────────────────

@router.get("/transactions")
async def get_transactions(db: Session = Depends(get_db)):
    try:
        return db.query(BankTransaction).order_by(desc(BankTransaction.createdAt)).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/transactions", status_code=201)
async def create_transaction(body: dict, db: Session = Depends(get_db)):
    accountId = body.get("accountId")
    description = body.get("description")
    amount = body.get("amount")
    tx_type = body.get("type", "CREDIT")
    date = body.get("date") or datetime.utcnow().strftime("%Y-%m-%d")
    category = body.get("category", "General")
    if not accountId or not description or amount is None:
        raise HTTPException(status_code=400, detail="accountId, description, and amount are required")
    try:
        account = db.query(BankAccount).filter(BankAccount.id == accountId).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        tx = BankTransaction(
            accountId=accountId,
            description=description,
            category=category,
            amount=float(amount),
            type=tx_type,
            date=date
        )
        db.add(tx)
        if tx_type == "CREDIT":
            account.balance += float(amount)
        else:
            account.balance -= float(amount)
        db.commit()
        db.refresh(tx)
        return tx
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ─── Bank Loans ────────────────────────────────────────────────────────────────

@router.get("/loans")
async def get_loans(db: Session = Depends(get_db)):
    try:
        return db.query(BankLoan).order_by(desc(BankLoan.createdAt)).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/loans", status_code=201)
async def create_loan(body: dict, db: Session = Depends(get_db)):
    lender = body.get("lender")
    principal = body.get("principal")
    loan_type = body.get("type", "TERM")
    if not lender or principal is None:
        raise HTTPException(status_code=400, detail="lender and principal are required")
    try:
        p = float(principal)
        rate = float(body.get("interestRate", 8.5))
        emi = float(body.get("emi", round(p * 0.02, 2)))
        loan = BankLoan(
            loanNo=f"LN-{int(datetime.utcnow().timestamp())}",
            type=loan_type,
            lender=lender,
            principal=p,
            outstanding=float(body.get("outstanding", p)),
            interestRate=rate,
            emi=emi,
            nextDue=body.get("nextDue"),
            status=body.get("status", "ACTIVE")
        )
        db.add(loan)
        db.commit()
        db.refresh(loan)
        return loan
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
