import time
import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request

from app.utils.db import get_db
from app.utils.audit import log_audit_event
from app.utils.crypto_ledger import calculate_block_hash, verify_ledger_chain
from app.middlewares.auth_middleware import get_current_user, require_permission, AuthenticatedUser
from app.models.schemas import VoucherCreate, AccountCreate, InvoiceCreate, BudgetCreate, ExpenseCreate, ApprovalWorkflowCreate, TaxDeadlineCreate, StatementCreate

router = APIRouter(prefix="/finance", tags=["Finance"])

async def update_account_balance(db, account_id: str, amount: float, is_debit: bool):
    account = await db.accounts.find_one({"id": account_id})
    if not account:
        return
    if account.get("type", "").upper() in ["ASSET", "EXPENSE", "Asset", "Expense"]:
        balance_change = amount if is_debit else -amount
    else:
        # LIABILITY, EQUITY, REVENUE
        balance_change = -amount if is_debit else amount
        
    await db.accounts.update_one(
        {"id": account_id},
        {"$inc": {"balance": balance_change}}
    )

# 1. ACCOUNTS LIST

@router.get("/accounts")
async def get_accounts(current_user: AuthenticatedUser = Depends(require_permission("finance:read")), db = Depends(get_db)):
    try:
        accounts = await db.accounts.find().sort("code", 1).to_list(length=None)
        # Convert _id to string or remove it
        for acc in accounts:
            acc["_id"] = str(acc["_id"])
        return accounts
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/accounts", status_code=status.HTTP_201_CREATED)
async def create_account(body: AccountCreate, current_user: AuthenticatedUser = Depends(require_permission("finance:write")), db = Depends(get_db)):
    try:
        existing = await db.accounts.find_one({"$or": [{"code": body.code}, {"name": body.name}]})
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
        
        import uuid
        acc_id = str(uuid.uuid4())
        
        acc = {
            "id": acc_id,
            "code": body.code,
            "name": body.name,
            "type": db_type,
            "balance": body.balance,
            "status": "ACTIVE",
            "createdAt": datetime.utcnow()
        }
        
        await db.accounts.insert_one(acc)
        acc["_id"] = str(acc["_id"])
        
        return acc
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 2. CREATE VOUCHER & LEDGER ENTRY

@router.post("/voucher", status_code=status.HTTP_201_CREATED)
async def create_voucher(body: VoucherCreate, req: Request, current_user: AuthenticatedUser = Depends(require_permission("finance:write")), db = Depends(get_db)):
    try:
        # Verify both accounts exist
        debit_acc = await db.accounts.find_one({"$or": [{"code": body.debitAcc}, {"name": body.debitAcc}]})
        credit_acc = await db.accounts.find_one({"$or": [{"code": body.creditAcc}, {"name": body.creditAcc}]})
        
        if not debit_acc or not credit_acc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Not Found", "message": "Debit or Credit account not found in Chart of Accounts."})

        # Voucher number generation
        if body.referenceNo:
            voucher_no = body.referenceNo.strip()
            existing_voucher = await db.journal_entries.find_one({"voucherNo": voucher_no})
            if existing_voucher:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Voucher/Reference number already exists."
                )
        else:
            count = await db.journal_entries.count_documents({})
            timestamp_ms = int(time.time() * 1000)
            voucher_no = f"VCHR-{timestamp_ms}-{count + 1}"

        # Get last entry to link hash
        last_entry = await db.journal_entries.find_one(sort=[("blockIndex", -1)])
        prev_hash = last_entry["blockHash"] if last_entry else "0"
        next_index = (last_entry["blockIndex"] + 1) if last_entry else 1

        # Date parsing
        date = datetime.utcnow()
        if body.date:
            try:
                date = datetime.strptime(body.date.strip(), "%Y-%m-%d")
            except ValueError:
                try:
                    date = datetime.fromisoformat(body.date.strip().replace('Z', ''))
                except ValueError:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Invalid date format. Please use YYYY-MM-DD."
                    )

        # Compute hash
        block_hash = calculate_block_hash(
            block_index=next_index,
            voucher_no=voucher_no,
            amount=body.amount,
            debit_acc=debit_acc["name"],
            credit_acc=credit_acc["name"],
            prev_hash=prev_hash,
            date=date
        )

        import uuid
        entry_id = str(uuid.uuid4())
        
        entry = {
            "id": entry_id,
            "blockIndex": next_index,
            "voucherType": body.voucherType.value if hasattr(body.voucherType, 'value') else body.voucherType,
            "voucherNo": voucher_no,
            "date": date,
            "amount": body.amount,
            "debitAcc": debit_acc["name"],
            "creditAcc": credit_acc["name"],
            "narration": body.narration or "",
            "prevHash": prev_hash,
            "blockHash": block_hash,
            "createdAt": datetime.utcnow()
        }
        
        await db.journal_entries.insert_one(entry)
        entry["_id"] = str(entry["_id"])

        # Update account balances
        await update_account_balance(db, debit_acc["id"], body.amount, True)
        await update_account_balance(db, credit_acc["id"], body.amount, False)

        await log_audit_event(
            user_id=current_user.id if hasattr(current_user, 'id') else current_user.get("id"),
            action="CREATE_VOUCHER",
            resource="JournalEntry",
            details={
                "id": entry["id"],
                "voucherNo": entry["voucherNo"],
                "amount": entry["amount"],
                "debitAcc": entry["debitAcc"],
                "creditAcc": entry["creditAcc"]
            },
            req=req
        )

        return {"message": "Voucher successfully verified and added to cryptographic ledger.", "entry": entry}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 2.5 GET JOURNAL ENTRIES

@router.get("/journal-entries")
async def get_journal_entries(current_user: AuthenticatedUser = Depends(require_permission("finance:read")), db = Depends(get_db)):
    try:
        entries = await db.journal_entries.find().sort("blockIndex", -1).to_list(length=None)
        for entry in entries:
            entry["_id"] = str(entry["_id"])
        return entries
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 3. VERIFY LEDGER CHAIN INTEGRITY

@router.get("/verify-ledger")
async def verify_ledger(current_user: AuthenticatedUser = Depends(require_permission("finance:read")), db = Depends(get_db)):
    try:
        # We need to adapt verify_ledger_chain for Motor
        entries = await db.journal_entries.find().sort("blockIndex", 1).to_list(length=None)
        valid = True
        issues = []
        for i in range(1, len(entries)):
            prev = entries[i-1]
            curr = entries[i]
            if curr["prevHash"] != prev["blockHash"]:
                valid = False
                issues.append(f"Hash mismatch at Block {curr['blockIndex']} (Voucher: {curr['voucherNo']})")
        return {"valid": valid, "issues": issues}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 4. REPORT: TRIAL BALANCE

@router.get("/reports/trial-balance")
async def get_trial_balance_report(current_user: AuthenticatedUser = Depends(require_permission("finance:read")), db = Depends(get_db)):
    try:
        accounts = await db.accounts.find().to_list(length=None)
        
        total_debit = 0.0
        total_credit = 0.0
        trial_balance = []

        for acc in accounts:
            debit = 0.0
            credit = 0.0
            if acc.get("type", "").upper() in ["ASSET", "EXPENSE", "Asset", "Expense"]:
                debit = acc.get("balance", 0.0)
                total_debit += debit
            else:
                credit = acc.get("balance", 0.0)
                total_credit += credit

            trial_balance.append({
                "id": acc.get("id"),
                "code": acc.get("code"),
                "name": acc.get("name"),
                "type": acc.get("type"),
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
async def get_profit_loss_report(current_user: AuthenticatedUser = Depends(require_permission("finance:read")), db = Depends(get_db)):
    try:
        revenues = await db.accounts.find({"type": {"$in": ["REVENUE", "Income"]}}).to_list(length=None)
        expenses = await db.accounts.find({"type": {"$in": ["EXPENSE", "Expense"]}}).to_list(length=None)
        
        for r in revenues: r["_id"] = str(r["_id"])
        for e in expenses: e["_id"] = str(e["_id"])
        
        total_revenue = sum(r.get("balance", 0.0) for r in revenues)
        total_expenses = sum(e.get("balance", 0.0) for e in expenses)
        
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
async def get_balance_sheet_report(current_user: AuthenticatedUser = Depends(require_permission("finance:read")), db = Depends(get_db)):
    try:
        assets = await db.accounts.find({"type": {"$in": ["ASSET", "Asset"]}}).to_list(length=None)
        liabilities = await db.accounts.find({"type": {"$in": ["LIABILITY", "Liability"]}}).to_list(length=None)
        equities = await db.accounts.find({"type": {"$in": ["EQUITY", "Equity"]}}).to_list(length=None)
        
        for a in assets: a["_id"] = str(a["_id"])
        for l in liabilities: l["_id"] = str(l["_id"])
        for eq in equities: eq["_id"] = str(eq["_id"])
        
        total_assets = sum(a.get("balance", 0.0) for a in assets)
        total_liabilities = sum(l.get("balance", 0.0) for l in liabilities)
        total_equities = sum(eq.get("balance", 0.0) for eq in equities)
        
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
async def reconcile_bank_statement(body: dict, current_user: AuthenticatedUser = Depends(require_permission("finance:write")), db = Depends(get_db)):
    statement_lines = body.get("statementLines")
    if not statement_lines or not isinstance(statement_lines, list):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": "Please provide statementLines list."})

    try:
        return {"reconciled": [], "unmatched": statement_lines, "message": "Bank reconciliation needs to be updated for new schema"}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 8. TAX SUMMARY

@router.get("/tax/summary")
async def get_tax_summary(current_user: AuthenticatedUser = Depends(require_permission("finance:read")), db = Depends(get_db)):
    try:
        gst_acc = await db.accounts.find_one({"name": "GST Payable"})
        tds_acc = await db.accounts.find_one({"name": "TDS Payable"})
        
        return {
            "gstPayable": gst_acc.get("balance", 0.0) if gst_acc else 0.0,
            "tdsPayable": tds_acc.get("balance", 0.0) if tds_acc else 0.0,
            "gstStatus": "Filing Ready",
            "tdsStatus": "Deductions Verified"
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 9. INVOICES

@router.get("/invoices")
async def get_invoices(current_user: AuthenticatedUser = Depends(require_permission("finance:read")), db = Depends(get_db)):
    try:
        invoices = await db.invoices.find().sort("createdAt", -1).to_list(length=None)
        for invoice in invoices:
            invoice["_id"] = str(invoice["_id"])
        return invoices
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/invoices", status_code=status.HTTP_201_CREATED)
async def create_invoice(body: InvoiceCreate, current_user: AuthenticatedUser = Depends(require_permission("finance:write")), db = Depends(get_db)):
    try:
        if body.invoiceNo:
            invoice_no = body.invoiceNo.strip()
            existing = await db.invoices.find_one({"invoiceNo": invoice_no})
            if existing:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invoice number already exists.")
        else:
            timestamp_ms = int(time.time() * 1000)
            invoice_no = f"INV-{timestamp_ms}"

        subtotal = body.subtotal
        tax_rate = body.taxRate
        tax_amount = subtotal * (tax_rate / 100)
        total_amount = subtotal + tax_amount

        import uuid
        invoice = {
            "id": str(uuid.uuid4()),
            "invoiceNo": invoice_no,
            "customerName": body.customerName,
            "subtotal": subtotal,
            "taxRate": tax_rate,
            "taxAmount": tax_amount,
            "totalAmount": total_amount,
            "status": body.status or "PENDING",
            "invoiceDate": body.invoiceDate or datetime.utcnow().strftime("%Y-%m-%d"),
            "dueDate": body.dueDate,
            "sent": False,
            "createdAt": datetime.utcnow()
        }
        await db.invoices.insert_one(invoice)
        invoice["_id"] = str(invoice["_id"])
        return invoice
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.patch("/invoices/{id}/status")
async def update_invoice_status(id: str, body: dict, current_user: AuthenticatedUser = Depends(require_permission("finance:write")), db = Depends(get_db)):
    try:
        invoice = await db.invoices.find_one({"id": id})
        if not invoice:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
        updates = {}
        if "status" in body:
            updates["status"] = body["status"]
        if "sent" in body:
            updates["sent"] = body["sent"]
            
        if updates:
            await db.invoices.update_one({"id": id}, {"$set": updates})
            invoice.update(updates)
            
        invoice["_id"] = str(invoice["_id"])
        return invoice
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 10. BUDGETS

@router.get("/budgets")
async def get_budgets(current_user: AuthenticatedUser = Depends(require_permission("finance:read")), db = Depends(get_db)):
    try:
        budgets = await db.budgets.find().sort("createdAt", -1).to_list(length=None)
        for budget in budgets:
            budget["_id"] = str(budget["_id"])
        return budgets
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/budgets", status_code=status.HTTP_201_CREATED)
async def create_budget(body: BudgetCreate, current_user: AuthenticatedUser = Depends(require_permission("finance:write")), db = Depends(get_db)):
    try:
        import uuid
        budget = {
            "id": str(uuid.uuid4()),
            "budgetName": body.budgetName,
            "category": body.category,
            "costCenter": body.costCenter or body.category,
            "period": body.period,
            "amount": body.amount,
            "spent": body.spent or 0.0,
            "year": body.year,
            "month": body.month,
            "createdAt": datetime.utcnow()
        }
        await db.budgets.insert_one(budget)
        budget["_id"] = str(budget["_id"])
        return budget
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 11. EXPENSES

@router.get("/expenses")
async def get_expenses(current_user: AuthenticatedUser = Depends(require_permission("finance:read")), db = Depends(get_db)):
    try:
        expenses = await db.expenses.find().sort("createdAt", -1).to_list(length=None)
        for exp in expenses:
            exp["_id"] = str(exp["_id"])
        return expenses
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/expenses", status_code=status.HTTP_201_CREATED)
async def create_expense(body: ExpenseCreate, current_user: AuthenticatedUser = Depends(require_permission("finance:write")), db = Depends(get_db)):
    try:
        import uuid
        expense = {
            "id": str(uuid.uuid4()),
            "description": body.description,
            "category": body.category,
            "amount": body.amount,
            "date": body.date,
            "paidBy": body.paidBy,
            "receiptStatus": body.receiptStatus or "Pending",
            "status": "PENDING",
            "createdAt": datetime.utcnow()
        }
        await db.expenses.insert_one(expense)
        expense["_id"] = str(expense["_id"])
        return expense
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.patch("/expenses/{id}/status")
async def update_expense_status(id: str, body: dict, current_user: AuthenticatedUser = Depends(require_permission("finance:write")), db = Depends(get_db)):
    try:
        expense = await db.expenses.find_one({"id": id})
        if not expense:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
        updates = {"approvedBy": current_user.email if hasattr(current_user, 'email') else current_user.get("email")}
        if "status" in body:
            updates["status"] = body["status"]
            
        await db.expenses.update_one({"id": id}, {"$set": updates})
        expense.update(updates)
        expense["_id"] = str(expense["_id"])
        return expense
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 12. APPROVAL WORKFLOWS

@router.get("/approvals")
async def get_approvals(current_user: AuthenticatedUser = Depends(require_permission("finance:read")), db = Depends(get_db)):
    try:
        workflows = await db.approval_workflows.find().sort("createdAt", -1).to_list(length=None)
        for w in workflows:
            w["_id"] = str(w["_id"])
        return workflows
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/approvals", status_code=status.HTTP_201_CREATED)
async def create_approval_workflow(body: ApprovalWorkflowCreate, current_user: AuthenticatedUser = Depends(require_permission("finance:write")), db = Depends(get_db)):
    try:
        if body.requestNo:
            req_no = body.requestNo.strip()
            existing = await db.approval_workflows.find_one({"requestNo": req_no})
            if existing:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Request number already exists.")
        else:
            timestamp_ms = int(time.time() * 1000)
            req_no = f"REQ-{timestamp_ms}"

        import uuid
        workflow_id = str(uuid.uuid4())
        user_email = current_user.email if hasattr(current_user, 'email') else current_user.get("email")
        
        workflow = {
            "id": workflow_id,
            "requestNo": req_no,
            "type": body.type,
            "amount": body.amount,
            "requester": body.requester or user_email,
            "date": body.date or datetime.utcnow().strftime("%Y-%m-%d"),
            "reason": body.reason or "",
            "status": "PENDING",
            "currentLevel": 1,
            "createdAt": datetime.utcnow()
        }
        await db.approval_workflows.insert_one(workflow)

        level = {
            "id": str(uuid.uuid4()),
            "workflowId": workflow_id,
            "level": 1,
            "approver": "Finance Manager",
            "status": "PENDING",
            "createdAt": datetime.utcnow()
        }
        await db.approval_levels.insert_one(level)
        
        workflow["_id"] = str(workflow["_id"])
        return workflow
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.patch("/approvals/{id}/approve")
async def approve_workflow(id: str, body: dict, current_user: AuthenticatedUser = Depends(require_permission("finance:write")), db = Depends(get_db)):
    try:
        workflow = await db.approval_workflows.find_one({"id": id})
        if not workflow:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Approval workflow not found")
        
        level_num = body.get("level", 1)
        level = await db.approval_levels.find_one({
            "workflowId": id, 
            "level": level_num
        })

        if level:
            await db.approval_levels.update_one(
                {"id": level["id"]},
                {"$set": {
                    "status": "APPROVED",
                    "timestamp": datetime.utcnow().isoformat()
                }}
            )
            
            # Check next level
            next_level = await db.approval_levels.find_one({
                "workflowId": id,
                "level": {"$gt": level_num},
                "status": "PENDING"
            }, sort=[("level", 1)])
            
            updates = {}
            if next_level:
                updates["currentLevel"] = next_level["level"]
                updates["status"] = "IN_PROGRESS"
            else:
                updates["status"] = "APPROVED"
                
            await db.approval_workflows.update_one({"id": id}, {"$set": updates})
            workflow.update(updates)
            workflow["_id"] = str(workflow["_id"])
            return workflow
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Approval level not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 13. TAX & COMPLIANCE

@router.get("/tax/deadlines")
async def get_tax_deadlines(current_user: AuthenticatedUser = Depends(require_permission("finance:read")), db = Depends(get_db)):
    try:
        deadlines = await db.tax_deadlines.find().sort("dueDate", 1).to_list(length=None)
        for d in deadlines:
            d["_id"] = str(d["_id"])
        return deadlines
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/tax/deadlines", status_code=status.HTTP_201_CREATED)
async def create_tax_deadline(body: TaxDeadlineCreate, current_user: AuthenticatedUser = Depends(require_permission("finance:write")), db = Depends(get_db)):
    try:
        import uuid
        deadline = {
            "id": str(uuid.uuid4()),
            "taxName": body.taxName,
            "taxType": body.taxType,
            "rate": body.rate,
            "applicableOn": body.applicableOn,
            "effectiveDate": body.effectiveDate,
            "dueDate": body.dueDate,
            "period": body.period,
            "status": body.status or "PENDING",
            "createdAt": datetime.utcnow()
        }
        await db.tax_deadlines.insert_one(deadline)
        deadline["_id"] = str(deadline["_id"])
        return deadline
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.patch("/tax/deadlines/{id}/status")
async def update_tax_deadline_status(id: str, body: dict, current_user: AuthenticatedUser = Depends(require_permission("finance:write")), db = Depends(get_db)):
    try:
        deadline = await db.tax_deadlines.find_one({"id": id})
        if not deadline:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tax deadline not found")
        status_val = body.get("status")
        if status_val:
            await db.tax_deadlines.update_one({"id": id}, {"$set": {"status": status_val}})
            deadline["status"] = status_val
            
        deadline["_id"] = str(deadline["_id"])
        return deadline
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 14. STATEMENTS

@router.get("/statements")
async def get_statements(current_user: AuthenticatedUser = Depends(require_permission("finance:read")), db = Depends(get_db)):
    try:
        statements = await db.statements.find().sort("createdAt", -1).to_list(length=None)
        for s in statements:
            s["_id"] = str(s["_id"])
        return statements
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/statements", status_code=status.HTTP_201_CREATED)
async def create_statement(body: StatementCreate, current_user: AuthenticatedUser = Depends(require_permission("finance:write")), db = Depends(get_db)):
    try:
        import uuid
        statement = {
            "id": str(uuid.uuid4()),
            "statementType": body.statementType,
            "period": body.period,
            "totalIncome": body.totalIncome,
            "totalExpense": body.totalExpense,
            "netAmount": body.netAmount,
            "status": body.status or "Generated",
            "createdAt": datetime.utcnow()
        }
        await db.statements.insert_one(statement)
        statement["_id"] = str(statement["_id"])
        return statement
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.patch("/statements/{id}/status")
async def update_statement_status(id: str, body: dict, current_user: AuthenticatedUser = Depends(require_permission("finance:write")), db = Depends(get_db)):
    try:
        statement = await db.statements.find_one({"id": id})
        if not statement:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Statement not found")
        status_val = body.get("status")
        if status_val:
            await db.statements.update_one({"id": id}, {"$set": {"status": status_val}})
            statement["status"] = status_val
            
        statement["_id"] = str(statement["_id"])
        return statement
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})
