from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import json
import asyncio

from app.utils.db import get_db
from app.middlewares.rbac_middleware import get_current_rbac_user, require_module_access, RBACUser
from app.models.automation_sql_models import AutomationBot, BotRunLog
from app.schemas.automation_schemas import BotResponse, BotRunLogResponse, BotBase

router = APIRouter(prefix="/automation", tags=["Automation"])

# Initial bots seed
INITIAL_BOTS = [
    {
        "botId": "bot-1",
        "name": "Invoice Processor",
        "description": "Auto-posts AP invoices to the GL with 3-way PO matching",
        "icon": "🧾",
        "category": "Finance",
        "status": "Idle",
        "runsToday": 3,
        "successRate": 99.2
    },
    {
        "botId": "bot-2",
        "name": "Payroll Reconciler",
        "description": "Validates payroll, computes deductions & posts journal vouchers",
        "icon": "💰",
        "category": "HR",
        "status": "Idle",
        "runsToday": 1,
        "successRate": 100.0
    },
    {
        "botId": "bot-3",
        "name": "Lead Scraper",
        "description": "Enriches and imports high-intent B2B leads into the CRM pipeline",
        "icon": "🎯",
        "category": "Sales",
        "status": "Idle",
        "runsToday": 2,
        "successRate": 97.8
    },
    {
        "botId": "bot-4",
        "name": "Reorder Bot",
        "description": "Monitors stock levels and auto-raises purchase orders when low",
        "icon": "📦",
        "category": "Inventory",
        "status": "Idle",
        "runsToday": 5,
        "successRate": 98.5
    }
]

BOT_MOCK_SCRIPTS = {
  'bot-1': [
    'Connecting to ERP Financial gateway...',
    'Scanning incoming invoice queue... 124 documents pending.',
    'OCR extraction engine — processing Invoice INV-2026-041...',
    'Parsed: Vendor "Aether Industries LLC" • Amount: ₹4,800.00',
    'Validating against purchase order PO-2026-018 → MATCHED ✓',
    'Posting double-entry journal VCH-AUTO-041 to General Ledger...',
    'Dr: Accounts Payable ₹4,800 → Cr: Operating Cash Account ₹4,800',
    'Continuing batch... 123 invoices remaining.',
    'Processing Invoice INV-2026-042... Vendor "Boreas Energy Corp" • Amount: ₹12,500',
    '--- [COMPLETE] Invoice batch run finished. 124 invoices processed. 0 errors. ---'
  ],
  'bot-2': [
    'Initialising Payroll Reconciliation Agent v4.2...',
    'Fetching payroll run for May 2026 — 15 active employees detected.',
    'Validating gross salaries against HR records...',
    'EMP-001 Julian Vance → Base ₹18,500 → Deductions: ₹3,700 → Net: ₹14,800 ✓',
    'EMP-002 Seraphina Aria → Base ₹14,200 → Deductions: ₹2,840 → Net: ₹11,360 ✓',
    'EMP-003 Kaelen Ross → Base ₹11,000 → Deductions: ₹2,200 → Net: ₹8,800 ✓',
    'Processing statutory deductions: EPF 12%, ESI 0.75%, TDS 10%...',
    'Generating payroll vouchers for 15 employees...',
    'Posting disbursement batch VCH-PAY-MAY26 → Accrued Payroll: ₹1,25,000',
    '--- [COMPLETE] Payroll reconciliation finished. 15/15 processed. Zero errors. ---'
  ],
  'bot-3': [
    'Lead Scraping Bot v3.1 activated...',
    'Scanning LinkedIn Sales Navigator for ICP keyword matches...',
    'Query: "ERP Supply Chain Director" + "Head of Operations" (IN region)',
    'Found 847 matching profiles. Applying company size filter (500–5000 employees)...',
    'Filtered to 142 high-intent prospects. Enriching with email data via Hunter.io...',
    'Enriched 98 emails (69% match rate). Deduplicating against CRM...',
    '23 duplicates removed. 75 net new leads ready for outreach.',
    'Creating leads in CRM pipeline with tag: ICP-Q3-2026...',
    'Scheduling personalised email sequences via outreach automation...',
    '--- [COMPLETE] 75 new leads added to pipeline. Sequences activated. ---'
  ],
  'bot-4': [
    'Inventory Reorder Bot v2.0 starting...',
    'Scanning 20 active SKUs against safety stock thresholds...',
    'SKU: BATT-400W — Current Stock: 12 units | Reorder Level: 20 units → REORDER NEEDED',
    'SKU: CABLE-USB-C — Current Stock: 8 units | Reorder Level: 15 units → REORDER NEEDED',
    'Fetching preferred supplier for BATT-400W → Zenith Supplies (score: 94%)',
    'Generating Purchase Order PO-AUTO-2026-089 for BATT-400W × 100 units @ ₹850/unit',
    'Total PO Value: ₹85,000. Sending for manager approval...',
    'Approval workflow triggered. Expected delivery: 3–5 business days.',
    'Generating PO-AUTO-2026-090 for CABLE-USB-C × 200 units...',
    '--- [COMPLETE] 2 auto-POs raised. Approval notifications sent. ---'
  ]
}

def seed_bots_if_empty(db: Session):
    if db.query(AutomationBot).count() == 0:
        for b in INITIAL_BOTS:
            db.add(AutomationBot(**b))
        db.commit()

@router.get("/bots", response_model=List[BotResponse])
def get_bots(db: Session = Depends(get_db), current_user: RBACUser = Depends(require_module_access("automation"))):
    seed_bots_if_empty(db)
    return db.query(AutomationBot).all()

@router.get("/bots/{botId}/logs", response_model=List[BotRunLogResponse])
def get_bot_logs(botId: str, db: Session = Depends(get_db), current_user: RBACUser = Depends(require_module_access("automation"))):
    return db.query(BotRunLog).filter(BotRunLog.botId == botId).order_by(BotRunLog.createdAt.desc()).all()

def simulate_bot_run(botId: str, db: Session):
    bot = db.query(AutomationBot).filter(AutomationBot.botId == botId).first()
    if not bot:
        return
    
    bot.status = "Running"
    bot.lastRun = datetime.utcnow()
    db.commit()
    
    script = BOT_MOCK_SCRIPTS.get(botId, ["Bot logic missing..."])
    
    # Store complete execution log immediately (front-end can simulate stream if needed)
    new_log = BotRunLog(
        botId=botId,
        logOutput=json.dumps(script),
        status="Completed"
    )
    db.add(new_log)
    
    bot.status = "Idle"
    bot.runsToday += 1
    db.commit()

@router.post("/bots/{botId}/run")
def trigger_bot_run(botId: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: RBACUser = Depends(require_module_access("automation"))):
    bot = db.query(AutomationBot).filter(AutomationBot.botId == botId).first()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    if bot.status == "Running":
        raise HTTPException(status_code=400, detail="Bot is already running")
        
    # We run it synchronously here so UI immediately gets the updated run log, but normally we'd background it
    simulate_bot_run(botId, db)
    
    return {"message": "Bot executed successfully"}
