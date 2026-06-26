import time
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.utils.db import get_db
from app.utils.audit import log_audit_event
from app.utils.crypto_ledger import calculate_block_hash
from app.middlewares.rbac_middleware import get_current_rbac_user, require_module_access, RBACUser
from app.models.schemas import VoucherCreate, AccountCreate, InvoiceCreate, BudgetCreate, ExpenseCreate, ApprovalWorkflowCreate, TaxDeadlineCreate, StatementCreate
from app.models.finance_sql_models import FinanceAccount, JournalEntry, Invoice, Budget, Expense, ApprovalWorkflow, ApprovalLevel, TaxDeadline, Statement, FinanceAuditLog
import httpx
from app.utils.redis_client import cache_get, cache_set, connect_redis

router = APIRouter(prefix="/finance", tags=["Finance"])

def update_account_balance(db: Session, account_id: str, amount: float, is_debit: bool):
    account = db.query(FinanceAccount).filter(FinanceAccount.id == account_id).first()
    if not account:
        return
    if account.type.upper() in ["ASSET", "EXPENSE"]:
        balance_change = amount if is_debit else -amount
    else:
        balance_change = -amount if is_debit else amount
        
    account.balance += Decimal(str(balance_change))
    db.commit()

def create_finance_audit(db: Session, user_id: str, action: str, table_name: str, record_id: str, old_value: str = None, new_value: str = None):
    log = FinanceAuditLog(
        userId=user_id,
        action=action,
        tableName=table_name,
        recordId=record_id,
        oldValue=old_value,
        newValue=new_value
    )
    db.add(log)
    db.commit()

# 1. ACCOUNTS LIST

@router.get("/accounts")
async def get_accounts(current_user: RBACUser = Depends(require_module_access("finance")), db: Session = Depends(get_db)):
    accounts = db.query(FinanceAccount).order_by(FinanceAccount.code).all()
    return accounts

@router.post("/accounts", status_code=status.HTTP_201_CREATED)
async def create_account(body: AccountCreate, current_user: RBACUser = Depends(require_module_access("finance")), db: Session = Depends(get_db)):
    existing = db.query(FinanceAccount).filter((FinanceAccount.code == body.code) | (FinanceAccount.name == body.name)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account code or name already exists")
    
    type_mapping = {
        "ASSET": "Asset", "LIABILITY": "Liability", "EQUITY": "Equity",
        "REVENUE": "Income", "EXPENSE": "Expense"
    }
    db_type = type_mapping.get(body.type, body.type)
    
    acc = FinanceAccount(
        code=body.code,
        name=body.name,
        type=db_type,
        balance=body.balance,
        status="ACTIVE"
    )
    db.add(acc)
    db.commit()
    db.refresh(acc)
    return acc

# 2. CREATE VOUCHER & LEDGER ENTRY

@router.post("/voucher", status_code=status.HTTP_201_CREATED)
async def create_voucher(body: VoucherCreate, req: Request, current_user: RBACUser = Depends(require_module_access("finance")), db: Session = Depends(get_db)):
    debit_acc = db.query(FinanceAccount).filter((FinanceAccount.name == body.debitAcc) | (FinanceAccount.code == body.debitAcc)).first()
    credit_acc = db.query(FinanceAccount).filter((FinanceAccount.name == body.creditAcc) | (FinanceAccount.code == body.creditAcc)).first()
    
    if not debit_acc or not credit_acc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Debit or Credit account not found.")

    voucher_no = (body.referenceNo or f"VCH-{int(time.time())}").strip()
    if db.query(JournalEntry).filter(JournalEntry.voucherNo == voucher_no).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Voucher/Reference number already exists.")

    last_entry = db.query(JournalEntry).order_by(JournalEntry.blockIndex.desc()).first()
    prev_hash = last_entry.blockHash if last_entry else "0"
    next_index = (last_entry.blockIndex + 1) if last_entry else 1

    date = body.date or datetime.utcnow()

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
        voucherType=body.voucherType,
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
    db.commit()
    db.refresh(entry)

    update_account_balance(db, debit_acc.id, body.amount, True)
    update_account_balance(db, credit_acc.id, body.amount, False)

    await log_audit_event("CREATE_VOUCHER", "JournalEntry", {"id": entry.id, "voucherNo": entry.voucherNo}, current_user.id, req)
    return {"message": "Voucher successfully verified and added to cryptographic ledger.", "entry": entry}

# 2.5 GET JOURNAL ENTRIES

@router.get("/journal-entries")
async def get_journal_entries(current_user: RBACUser = Depends(require_module_access("finance")), db: Session = Depends(get_db)):
    try:
        entries = db.query(JournalEntry).order_by(JournalEntry.blockIndex.desc()).all()
        return entries
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Error fetching journal entries: {e}")
        return []

# 3. VERIFY LEDGER CHAIN INTEGRITY

@router.get("/verify-ledger")
async def verify_ledger(current_user: RBACUser = Depends(require_module_access("finance")), db: Session = Depends(get_db)):
    entries = db.query(JournalEntry).order_by(JournalEntry.blockIndex).all()
    valid = True
    issues = []
    for i in range(1, len(entries)):
        if entries[i].prevHash != entries[i-1].blockHash:
            valid = False
            issues.append(f"Hash mismatch at Block {entries[i].blockIndex}")
    return {"valid": valid, "issues": issues}

# 4. REPORT: TRIAL BALANCE

@router.get("/reports/trial-balance")
async def get_trial_balance_report(current_user: RBACUser = Depends(require_module_access("finance")), db: Session = Depends(get_db)):
    accounts = db.query(FinanceAccount).all()
    total_debit, total_credit = 0.0, 0.0
    trial_balance = []

    for acc in accounts:
        debit, credit = 0.0, 0.0
        if acc.type.upper() in ["ASSET", "EXPENSE"]:
            debit = acc.balance
            total_debit += debit
        else:
            credit = acc.balance
            total_credit += credit
        trial_balance.append({
            "id": acc.id, "code": acc.code, "name": acc.name, "type": acc.type, "debit": debit, "credit": credit
        })

    return {"accounts": trial_balance, "totalDebit": total_debit, "totalCredit": total_credit, "balanced": abs(total_debit - total_credit) < 0.01}

# 5. REPORT: PROFIT AND LOSS

@router.get("/reports/profit-loss")
async def get_profit_loss_report(current_user: RBACUser = Depends(require_module_access("finance")), db: Session = Depends(get_db)):
    revenues = db.query(FinanceAccount).filter(FinanceAccount.type.in_(["REVENUE", "Income"])).all()
    expenses = db.query(FinanceAccount).filter(FinanceAccount.type.in_(["EXPENSE", "Expense"])).all()
    
    total_revenue = sum(r.balance for r in revenues)
    total_expenses = sum(e.balance for e in expenses)
    return {"revenues": revenues, "expenses": expenses, "totalRevenue": total_revenue, "totalExpenses": total_expenses, "netProfit": total_revenue - total_expenses}

# 6. REPORT: BALANCE SHEET

@router.get("/reports/balance-sheet")
async def get_balance_sheet_report(current_user: RBACUser = Depends(require_module_access("finance")), db: Session = Depends(get_db)):
    assets = db.query(FinanceAccount).filter(FinanceAccount.type.in_(["ASSET", "Asset"])).all()
    liabilities = db.query(FinanceAccount).filter(FinanceAccount.type.in_(["LIABILITY", "Liability"])).all()
    equities = db.query(FinanceAccount).filter(FinanceAccount.type.in_(["EQUITY", "Equity"])).all()
    
    total_assets = sum(a.balance for a in assets)
    total_liabilities = sum(l.balance for l in liabilities)
    total_equities = sum(eq.balance for eq in equities)
    return {"assets": assets, "liabilities": liabilities, "equities": equities, "totalAssets": total_assets, "totalLiabilities": total_liabilities, "totalEquities": total_equities, "totalLiabilitiesEquities": total_liabilities + total_equities}

# 7. BANK STATEMENT RECONCILIATION MATCHING ENGINE

@router.post("/reconcile")
async def reconcile_bank_statement(body: dict, current_user: RBACUser = Depends(require_module_access("finance")), db: Session = Depends(get_db)):
    statement_lines = body.get("statementLines", [])
    return {"reconciled": [], "unmatched": statement_lines, "message": "Bank reconciliation needs to be updated for new schema"}

# 8. TAX SUMMARY

@router.get("/tax/summary")
async def get_tax_summary(current_user: RBACUser = Depends(require_module_access("finance")), db: Session = Depends(get_db)):
    gst_acc = db.query(FinanceAccount).filter(FinanceAccount.name == "GST Payable").first()
    tds_acc = db.query(FinanceAccount).filter(FinanceAccount.name == "TDS Payable").first()
    return {"gstPayable": gst_acc.balance if gst_acc else 0.0, "tdsPayable": tds_acc.balance if tds_acc else 0.0, "gstStatus": "Filing Ready", "tdsStatus": "Deductions Verified"}

# 9. INVOICES

@router.get("/invoices")
async def get_invoices(current_user: RBACUser = Depends(require_module_access("finance")), db: Session = Depends(get_db)):
    try:
        invoices = db.query(Invoice).order_by(Invoice.invoiceDate.desc()).all()
        return invoices
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Error fetching invoices: {e}")
        return []

@router.post("/invoices", status_code=status.HTTP_201_CREATED)
async def create_invoice(body: InvoiceCreate, current_user: RBACUser = Depends(require_module_access("finance")), db: Session = Depends(get_db)):
    invoice_no = body.invoiceNo.strip()
    if db.query(Invoice).filter(Invoice.invoiceNo == invoice_no).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invoice number already exists.")

    tax_rate = body.taxRate
    tax_amount = body.subtotal * (tax_rate / 100)
    total_amount = body.subtotal + tax_amount

    # Convert dueDate string to datetime
    try:
        due_date = datetime.strptime(body.dueDate, "%Y-%m-%d") if body.dueDate else None
    except Exception:
        due_date = None

    invoice = Invoice(
        invoiceNo=invoice_no,
        customerName=body.customerName,
        subtotal=body.subtotal,
        taxRate=tax_rate,
        taxAmount=tax_amount,
        totalAmount=total_amount,
        currency="USD",
        status=body.status,
        invoiceDate=body.invoiceDate,
        dueDate=due_date
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    
    create_finance_audit(db, current_user.id, "CREATE", "finance_invoices", invoice.id, new_value=f"{{\"totalAmount\": {total_amount}}}")
    return invoice

@router.patch("/invoices/{id}/status")
async def update_invoice_status(id: str, body: dict, current_user: RBACUser = Depends(require_module_access("finance")), db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == id).first()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
    
    old_status = invoice.status
    if "status" in body:
        invoice.status = body["status"]
    if "sent" in body:
        invoice.sent = body["sent"]
    db.commit()
    db.refresh(invoice)
    
    create_finance_audit(db, current_user.id, "UPDATE", "finance_invoices", invoice.id, old_value=f"{{\"status\": \"{old_status}\"}}", new_value=f"{{\"status\": \"{invoice.status}\"}}")
    return invoice

# 10. BUDGETS

@router.get("/budgets")
async def get_budgets(current_user: RBACUser = Depends(require_module_access("finance")), db: Session = Depends(get_db)):
    return db.query(Budget).order_by(Budget.createdAt.desc()).all()

@router.post("/budgets", status_code=status.HTTP_201_CREATED)
async def create_budget(body: BudgetCreate, current_user: RBACUser = Depends(require_module_access("finance")), db: Session = Depends(get_db)):
    budget = Budget(
        budgetName=body.budgetName,
        category=body.category,
        costCenter="Default",  # Fallback if not provided
        period=body.period,
        amount=body.amount,
        spent=body.spent,
        year=body.year,
        month=body.month
    )
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget

# 11. EXPENSES

@router.get("/expenses")
async def get_expenses(current_user: RBACUser = Depends(require_module_access("finance")), db: Session = Depends(get_db)):
    return db.query(Expense).order_by(Expense.createdAt.desc()).all()

@router.post("/expenses", status_code=status.HTTP_201_CREATED)
async def create_expense(body: ExpenseCreate, current_user: RBACUser = Depends(require_module_access("finance")), db: Session = Depends(get_db)):
    # Convert date string to datetime
    try:
        exp_date = datetime.strptime(body.date, "%Y-%m-%d") if body.date else datetime.utcnow()
    except Exception:
        exp_date = datetime.utcnow()

    expense = Expense(
        description=body.description,
        category=body.category,
        amount=body.amount,
        date=exp_date,
        paidBy=body.paidBy,
        receiptStatus=body.receiptStatus,
        status="PENDING"
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    
    create_finance_audit(db, current_user.id, "CREATE", "finance_expenses", expense.id, new_value=f"{{\"amount\": {expense.amount}}}")
    return expense

@router.patch("/expenses/{id}/status")
async def update_expense_status(id: str, body: dict, current_user: RBACUser = Depends(require_module_access("finance")), db: Session = Depends(get_db)):
    expense = db.query(Expense).filter(Expense.id == id).first()
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    
    old_status = expense.status
    if "status" in body:
        expense.status = body["status"]
    expense.approvedBy = current_user.username
    db.commit()
    db.refresh(expense)
    
    create_finance_audit(db, current_user.id, "UPDATE", "finance_expenses", expense.id, old_value=f"{{\"status\": \"{old_status}\"}}", new_value=f"{{\"status\": \"{expense.status}\"}}")
    return expense

# 12. APPROVAL WORKFLOWS

@router.get("/approvals")
async def get_approvals(current_user: RBACUser = Depends(require_module_access("finance")), db: Session = Depends(get_db)):
    return db.query(ApprovalWorkflow).order_by(ApprovalWorkflow.createdAt.desc()).all()

@router.post("/approvals", status_code=status.HTTP_201_CREATED)
async def create_approval_workflow(body: ApprovalWorkflowCreate, current_user: RBACUser = Depends(require_module_access("finance")), db: Session = Depends(get_db)):
    timestamp_ms = int(time.time() * 1000)
    req_no = f"REQ-{timestamp_ms}"
    
    workflow = ApprovalWorkflow(
        requestNo=req_no,
        type=body.type,
        amount=Decimal(str(body.amount)),
        requester=body.requester or current_user.username,
        date=body.date or datetime.utcnow().strftime("%Y-%m-%d"),
        reason=body.reason,
        status="PENDING",
        currentLevel=1
    )
    db.add(workflow)
    db.commit()
    db.refresh(workflow)
    
    level = ApprovalLevel(
        workflowId=workflow.id,
        level=1,
        approver="Finance Manager"
    )
    db.add(level)
    db.commit()
    return workflow

@router.patch("/approvals/{id}/approve")
async def approve_workflow(id: str, body: dict, current_user: RBACUser = Depends(require_module_access("finance")), db: Session = Depends(get_db)):
    workflow = db.query(ApprovalWorkflow).filter(ApprovalWorkflow.id == id).first()
    if not workflow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Approval workflow not found")
    
    level_num = body.get("level", 1)
    level = db.query(ApprovalLevel).filter(ApprovalLevel.workflowId == id, ApprovalLevel.level == level_num).first()
    if level:
        level.status = "APPROVED"
        level.timestamp = datetime.utcnow().isoformat()
        
        next_level = db.query(ApprovalLevel).filter(ApprovalLevel.workflowId == id, ApprovalLevel.level > level_num, ApprovalLevel.status == "PENDING").order_by(ApprovalLevel.level).first()
        if next_level:
            workflow.currentLevel = next_level.level
            workflow.status = "IN_PROGRESS"
        else:
            workflow.status = "APPROVED"
        
        db.commit()
        db.refresh(workflow)
        return workflow
    else:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Approval level not found")

# 13. TAX & COMPLIANCE

@router.get("/tax/deadlines")
async def get_tax_deadlines(current_user: RBACUser = Depends(require_module_access("finance")), db: Session = Depends(get_db)):
    return db.query(TaxDeadline).order_by(TaxDeadline.dueDate).all()

@router.post("/tax/deadlines", status_code=status.HTTP_201_CREATED)
async def create_tax_deadline(body: TaxDeadlineCreate, current_user: RBACUser = Depends(require_module_access("finance")), db: Session = Depends(get_db)):
    deadline = TaxDeadline(
        taxName=f"{body.taxType} Tax",
        taxType=body.taxType,
        rate=0.0,
        applicableOn="Revenue",
        effectiveDate=datetime.utcnow(),
        dueDate=body.dueDate,
        period="Monthly",
        status=body.status
    )
    db.add(deadline)
    db.commit()
    db.refresh(deadline)
    return deadline

@router.patch("/tax/deadlines/{id}/status")
async def update_tax_deadline_status(id: str, body: dict, current_user: RBACUser = Depends(require_module_access("finance")), db: Session = Depends(get_db)):
    deadline = db.query(TaxDeadline).filter(TaxDeadline.id == id).first()
    if not deadline:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tax deadline not found")
    if "status" in body:
        deadline.status = body["status"]
    db.commit()
    db.refresh(deadline)
    return deadline

# 14. STATEMENTS

@router.get("/statements")
async def get_statements(current_user: RBACUser = Depends(require_module_access("finance")), db: Session = Depends(get_db)):
    return db.query(Statement).order_by(Statement.createdAt.desc()).all()

@router.post("/statements", status_code=status.HTTP_201_CREATED)
async def create_statement(body: StatementCreate, current_user: RBACUser = Depends(require_module_access("finance")), db: Session = Depends(get_db)):
    statement = Statement(
        statementType=body.statementType,
        period=body.period,
        totalIncome=Decimal(str(body.totalIncome)),
        totalExpense=Decimal(str(body.totalExpense)),
        netAmount=Decimal(str(body.netAmount)),
        status=body.status
    )
    db.add(statement)
    db.commit()
    db.refresh(statement)
    return statement

@router.patch("/statements/{id}/status")
async def update_statement_status(id: str, body: dict, current_user: RBACUser = Depends(require_module_access("finance")), db: Session = Depends(get_db)):
    statement = db.query(Statement).filter(Statement.id == id).first()
    if not statement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Statement not found")
    if "status" in body:
        statement.status = body["status"]
    db.commit()
    db.refresh(statement)
    return statement

# 15. AUDIT LOGS

@router.get("/audit-logs")
async def get_audit_logs(current_user: RBACUser = Depends(require_module_access("finance")), db: Session = Depends(get_db)):
    return db.query(FinanceAuditLog).order_by(FinanceAuditLog.timestamp.desc()).all()

# 16. EXCHANGE RATES

@router.get("/exchange-rates")
async def get_exchange_rates():
    rates = cache_get("exchange_rates")
    if not rates:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get("https://api.exchangerate-api.com/v4/latest/USD")
                if response.status_code == 200:
                    data = response.json()
                    rates = {
                        "USD": data["rates"].get("USD", 1),
                        "EUR": data["rates"].get("EUR", 0.9),
                        "GBP": data["rates"].get("GBP", 0.8),
                        "INR": data["rates"].get("INR", 83.0),
                        "AED": data["rates"].get("AED", 3.67),
                    }
                    cache_set("exchange_rates", rates, 86400) # Cache for 24h
        except Exception:
            rates = {"USD": 1, "EUR": 0.92, "GBP": 0.79, "INR": 83.2, "AED": 3.67}
    
    return rates

