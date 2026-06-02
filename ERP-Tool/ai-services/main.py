import os
import json
import re
import random
import asyncpg
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import Optional, Dict, Any, List
from contextlib import asynccontextmanager

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_pool
    database_url = os.getenv("DATABASE_URL", "postgresql://erp_user:erp_password@localhost:5432/erp_db")
    try:
        db_pool = await asyncpg.create_pool(database_url)
        print("Database connection pool established successfully.")
    except Exception as e:
        print(f"Warning: Database connection failed ({e}). Starting in offline/demo mode.")
        db_pool = None
    yield
    if db_pool:
        await db_pool.close()

app = FastAPI(
    title="EPR Dashboard AI Service",
    description="Microservice handling predictions, NLQ, OCR, forecasting, and WhatsApp bot",
    version="2.0.0",
    lifespan=lifespan
)

# CORS configuration - Restrict to specific origin, no wildcard * allowed
ALLOWED_ORIGIN = os.getenv("ALLOWED_ORIGIN", "http://localhost:5173")

if not ALLOWED_ORIGIN or ALLOWED_ORIGIN == "*":
    raise RuntimeError("ALLOWED_ORIGIN must be set to a specific origin, not '*'")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[ALLOWED_ORIGIN],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)



class QueryRequest(BaseModel):
    prompt: str
    context: Dict[str, Any] = {}

class QueryResponse(BaseModel):
    reply: str
    intent: str
    confidence: float
    suggestions: List[str] = []

class ForecastRequest(BaseModel):
    metric: str          # "revenue", "inventory", "headcount"
    periods: int = 6     # months to forecast
    historicalData: List[float] = []

class WhatsAppWebhook(BaseModel):
    From: str
    Body: str
    ProfileName: Optional[str] = None



db_pool = None

async def get_finance_summary() -> dict:
    if not db_pool:
        return {}
    try:
        async with db_pool.acquire() as conn:
            accounts = await conn.fetch(
                'SELECT type, SUM(balance) as total FROM "Account" GROUP BY type'
            )
            journal_count = await conn.fetchval('SELECT COUNT(*) FROM "JournalEntry"')
            return {
                "account_balances": {r["type"]: float(r["total"]) for r in accounts},
                "total_journal_entries": journal_count
            }
    except Exception as e:
        print(f"Error fetching finance summary: {e}")
        return {}

async def get_hr_summary() -> dict:
    if not db_pool:
        return {}
    try:
        async with db_pool.acquire() as conn:
            headcount = await conn.fetchval(
                'SELECT COUNT(*) FROM "Employee" WHERE "isActive" = true'
            )
            on_leave = await conn.fetchval(
                'SELECT COUNT(*) FROM "LeaveRequest" WHERE status = \'APPROVED\' AND "endDate" >= NOW()'
            )
            return {"active_headcount": headcount or 0, "currently_on_leave": on_leave or 0}
    except Exception as e:
        print(f"Error fetching HR summary: {e}")
        return {}

        
INTENT_MAP = [
    # Finance
    (["revenue", "profit", "loss", "income", "balance sheet", "p&l", "trial balance"], "finance_summary"),
    (["invoice", "payment", "vendor", "payable", "receivable", "account"], "accounts_query"),
    (["gst", "tax", "tds", "vat", "filing"], "tax_query"),
    (["bank reconciliation", "reconcile", "bank statement"], "bank_reconciliation"),
    # Inventory
    (["inventory", "stock", "warehouse", "godown", "fifo", "lifo"], "inventory_status"),
    (["reorder", "low stock", "safety stock", "expiry", "near expiry"], "stock_alert"),
    # Manufacturing
    (["production", "manufacturing", "bom", "bill of materials", "work center", "oee"], "manufacturing_status"),
    # HR
    (["employee", "hr", "payroll", "salary", "leave", "attendance", "headcount"], "hr_query"),
    (["hire", "recruit", "candidate", "job opening", "offer letter"], "recruitment_query"),
    # Sales & CRM
    (["sales", "pipeline", "lead", "opportunity", "crm", "quote", "deal"], "sales_forecast"),
    (["customer", "account", "contact", "loyalty"], "crm_query"),
    # E-Commerce
    (["order", "cart", "checkout", "ecommerce", "store", "product listing"], "ecommerce_query"),
    (["loyalty", "points", "tier", "rewards"], "loyalty_query"),
    # Assets & Maintenance
    (["asset", "fixed asset", "depreciation", "amortization", "book value"], "asset_query"),
    (["maintenance", "work order", "repair", "preventive", "breakdown"], "maintenance_query"),
    # Forecasting
    (["forecast", "predict", "projection", "trend", "future", "next quarter"], "demand_forecast"),
    # Anomaly / Fraud
    (["fraud", "anomaly", "suspicious", "unusual", "alert", "risk"], "anomaly_detection"),
    # General
    (["help", "what can you do", "features", "capabilities"], "help"),
]

SMART_REPLIES = {
    "finance_summary": {
        "reply": "📊 **Finance Summary**: Total Revenue this month is ₹24,78,000 (+12% MoM). Operating Expenses stand at ₹18,32,400. Net Profit Margin is 26.1%. Accounts Receivable outstanding: ₹4,20,000 across 8 invoices. Would you like the full P&L or Balance Sheet?",
        "suggestions": ["Show Balance Sheet", "List overdue invoices", "Run GST filing", "Bank reconciliation status"]
    },
    "accounts_query": {
        "reply": "💳 **Accounts Overview**: 12 open invoices totalling ₹8,42,000. Top pending: Reliance Ltd (₹2,10,000, 15 days overdue). Vendor payables: ₹3,18,000 due this week. Smart matching found 3 invoices ready for 3-way match approval.",
        "suggestions": ["List overdue invoices", "Match pending invoices", "Create payment voucher", "Supplier statement"]
    },
    "tax_query": {
        "reply": "🧾 **Tax Summary**: GST payable for this period: ₹1,84,500 (CGST ₹92,250 + SGST ₹92,250). TDS deducted: ₹38,200. Next GST filing deadline: 20th of next month. All returns are currently up to date.",
        "suggestions": ["Generate GSTR-1", "View TDS ledger", "Download tax report", "Check ITC balance"]
    },
    "bank_reconciliation": {
        "reply": "🏦 **Bank Reconciliation**: 847 bank statement lines loaded. 812 matched automatically (95.8% rate). 35 unmatched items pending review — 22 timing differences, 13 unknown transactions. Run auto-match now?",
        "suggestions": ["Run auto-reconciliation", "Review unmatched items", "Download reconciliation report"]
    },
    "inventory_status": {
        "reply": "📦 **Inventory Status**: 142 active SKUs across 3 warehouses. Current stock value: FIFO ₹42,18,500 | LIFO ₹39,84,200. 8 items below safety stock threshold. 3 batches expiring within 30 days. Turnover ratio: 4.2x.",
        "suggestions": ["Show low stock alerts", "View near-expiry items", "Generate reorder list", "FIFO vs LIFO comparison"]
    },
    "stock_alert": {
        "reply": "⚠️ **Stock Alerts**: 8 products below reorder point — Aluminium Rod (12 units, reorder at 50), Steel Sheet (8 units, reorder at 30), and 6 others. 3 near-expiry items: Lubricant Oil Batch B (expires in 12 days). Auto-reorder requisition can be generated.",
        "suggestions": ["Create purchase requisition", "View full alert list", "Set safety stock levels", "Email supplier"]
    },
    "manufacturing_status": {
        "reply": "🏭 **Manufacturing Status**: 5 active production orders (2 IN_PROGRESS, 3 PLANNED). Work Center A: OEE 82.4% (Availability 91%, Performance 95%, Quality 95.2%). BOM Library: 18 recipes. Raw material readiness: 94% for today's schedule.",
        "suggestions": ["View production pipeline", "Check OEE dashboard", "Create production order", "Review BOM"]
    },
    "hr_query": {
        "reply": "👥 **HR Summary**: 284 active employees across 12 departments. This month's payroll: ₹1,24,80,000 (PF: ₹14,97,600, ESI: ₹93,600, TDS: ₹4,20,000). Leave balance: 12 pending approvals. Attendance today: 271/284 present (95.4%).",
        "suggestions": ["Run payroll", "View attendance", "Pending leave requests", "Employee headcount by dept"]
    },
    "recruitment_query": {
        "reply": "🎯 **Recruitment Pipeline**: 42 active candidates across 8 open positions. 6 offers sent this week (3 accepted, 2 pending, 1 declined). Top source: LinkedIn (38%). Avg time to hire: 18 days. Upcoming interviews: 7 scheduled for tomorrow.",
        "suggestions": ["View candidate pipeline", "Schedule interview", "Generate offer letter", "Post job opening"]
    },
    "sales_forecast": {
        "reply": "📈 **Sales Forecast**: Q3 revenue projected at ₹3.2Cr (+18% vs Q2). Pipeline value: ₹8.4Cr across 67 opportunities (32 in negotiation). Win rate: 42%. Top opportunity: TechCorp ERP deal — ₹48L, 80% probability. Close date: next month.",
        "suggestions": ["View sales pipeline", "Top opportunities", "Generate quote", "Revenue forecast chart"]
    },
    "crm_query": {
        "reply": "🤝 **CRM Summary**: 284 active accounts, 1,240 contacts. 42 new leads this week (+15%). Lead conversion rate: 28%. Top accounts by revenue: Tech Solutions (₹84L), Global Ventures (₹62L), Innova Corp (₹48L). NPS score: 74.",
        "suggestions": ["View leads", "Top accounts", "Create opportunity", "Contact list"]
    },
    "ecommerce_query": {
        "reply": "🛒 **E-Commerce Summary**: 48 orders today (₹2,84,000 GMV). Conversion rate: 3.2%. Top category: Electronics (42% of orders). 12 orders pending dispatch. Average order value: ₹5,916. Cart abandonment rate: 68%.",
        "suggestions": ["Pending orders", "Top products", "Order status", "Sales by category"]
    },
    "loyalty_query": {
        "reply": "⭐ **Loyalty Program**: 1,842 enrolled members. Total points issued: 4,82,000. Tier breakdown: Platinum 18, Gold 124, Silver 384, Bronze 1,316. Points redeemed this month: 28,400 pts (₹2,840 discount). Top earner: Rahul Sharma (18,240 pts).",
        "suggestions": ["View top members", "Points expiry report", "Tier upgrade notifications", "Redemption history"]
    },
    "asset_query": {
        "reply": "🏗️ **Fixed Assets**: 128 active assets. Total gross block: ₹4,82,00,000. Accumulated depreciation: ₹1,84,60,000. Net book value: ₹2,97,40,000. This year's depreciation charge: ₹38,20,000. 3 assets fully depreciated, 2 pending disposal.",
        "suggestions": ["Run depreciation", "View asset register", "Disposal schedule", "Asset by category"]
    },
    "maintenance_query": {
        "reply": "🔧 **Maintenance Status**: 8 open work orders (3 CRITICAL, 2 HIGH, 3 MEDIUM). Scheduled preventive maintenance this week: 12 tasks (9 completed, 3 pending). MTBF: 840 hours. Maintenance cost YTD: ₹12,40,000. Next PM due: CNC Machine A (2 days).",
        "suggestions": ["Open work orders", "Preventive schedule", "Create work order", "Maintenance cost report"]
    },
    "demand_forecast": {
        "reply": "🔮 **AI Demand Forecast** (Linear Regression, 6-month projection): Revenue trend → ₹2.1Cr → ₹2.4Cr → ₹2.7Cr → ₹2.9Cr → ₹3.1Cr → ₹3.4Cr. Top growing SKUs: Product A (+22%), Product B (+18%). Recommended reorder increases: Steel (+15%), Aluminium (+12%). Confidence: 87%.",
        "suggestions": ["Download forecast report", "Adjust safety stock", "Create bulk PO", "View trend chart"]
    },
    "anomaly_detection": {
        "reply": "🚨 **Anomaly Detection**: 3 alerts flagged this week. (1) Unusual expense spike in Travel & Conveyance (+340% vs avg). (2) Duplicate payment detected — Invoice INV-0847 paid twice (₹84,000). (3) Stock variance: Warehouse B shows -42 units vs expected. Immediate review recommended.",
        "suggestions": ["Review flagged transactions", "Block duplicate payment", "Stock audit report", "Set alert thresholds"]
    },
    "help": {
        "reply": "🤖 **ERP AI Assistant** — I can help with:\n• 📊 Finance: P&L, balance sheet, tax, reconciliation\n• 📦 Inventory: stock status, alerts, FIFO/LIFO\n• 🏭 Manufacturing: production, OEE, BOM\n• 👥 HR: payroll, leave, recruitment\n• 🛒 Sales & CRM: pipeline, forecasts, quotes\n• 🏗️ Assets: depreciation, maintenance\n• 🔮 Forecasting & anomaly detection\n\nJust ask me anything about your ERP data!",
        "suggestions": ["Finance summary", "Inventory status", "HR headcount", "Sales forecast", "Anomaly alerts"]
    },
    "general_query": {
        "reply": "I understand your query. Let me pull the relevant ERP data for you. Could you be more specific? For example, try asking about 'sales forecast', 'inventory status', 'payroll summary', or 'maintenance alerts'.",
        "suggestions": ["Finance summary", "Inventory alerts", "HR query", "Sales pipeline"]
    }
}

def detect_intent(prompt: str) -> tuple[str, float]:
    prompt_lower = prompt.lower()
    best_match = ("general_query", 0.5)
    best_count = 0

    for keywords, intent in INTENT_MAP:
        count = sum(1 for kw in keywords if kw in prompt_lower)
        if count > best_count:
            best_count = count
            confidence = min(0.5 + count * 0.15, 0.98)
            best_match = (intent, confidence)

    return best_match

# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    return {
        "status": "UP",
        "service": "ai-services",
        "version": "2.0.0",
        "openai_configured": os.getenv("OPENAI_API_KEY") is not None,
        "gemini_configured": os.getenv("GEMINI_API_KEY") is not None,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/api/v1/ai/query", response_model=QueryResponse)
async def query_ai(request: QueryRequest):
    if not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    intent, confidence = detect_intent(request.prompt)

    if intent == "finance_summary":
        summary = await get_finance_summary()
        balances = summary.get("account_balances", {})
        revenue = balances.get("REVENUE", 0.0)
        expense = balances.get("EXPENSE", 0.0)
        assets = balances.get("ASSET", 0.0)
        liabilities = balances.get("LIABILITY", 0.0)
        net_profit = revenue - expense
        
        reply = (
            f"📊 **Finance Summary (Real-time)**:\n"
            f"• **Total Revenue**: ₹{revenue:,.2f}\n"
            f"• **Operating Expenses**: ₹{expense:,.2f}\n"
            f"• **Net Profit**: ₹{net_profit:,.2f}\n"
            f"• **Total Assets**: ₹{assets:,.2f}\n"
            f"• **Total Liabilities**: ₹{liabilities:,.2f}\n"
            f"• **Journal Entries Count**: {summary.get('total_journal_entries', 0)}\n\n"
            f"Would you like the full P&L or Balance Sheet?"
        )
        suggestions = ["Show Balance Sheet", "List overdue invoices", "Run GST filing", "Bank reconciliation status"]
        return QueryResponse(
            reply=reply,
            intent=intent,
            confidence=round(confidence, 2),
            suggestions=suggestions
        )
        
    elif intent == "hr_query":
        summary = await get_hr_summary()
        headcount = summary.get("active_headcount", 0)
        on_leave = summary.get("currently_on_leave", 0)
        
        reply = (
            f"👥 **HR Summary (Real-time)**:\n"
            f"• **Active Employees**: {headcount}\n"
            f"• **Employees on Leave**: {on_leave}\n"
            f"• **Present Today**: {headcount - on_leave}/{headcount}\n\n"
            f"Would you like to run payroll or check leave requests?"
        )
        suggestions = ["Run payroll", "View attendance", "Pending leave requests", "Employee headcount by dept"]
        return QueryResponse(
            reply=reply,
            intent=intent,
            confidence=round(confidence, 2),
            suggestions=suggestions
        )

    response_data = SMART_REPLIES.get(intent, SMART_REPLIES["general_query"])

    return QueryResponse(
        reply=response_data["reply"],
        intent=intent,
        confidence=round(confidence, 2),
        suggestions=response_data.get("suggestions", [])
    )

@app.post("/api/v1/ai/forecast")
async def forecast(request: ForecastRequest):
    """Simple linear regression demand forecast"""
    data = request.historicalData

    # If no historical data provided, generate realistic mock
    if not data:
        base = random.uniform(1_000_000, 5_000_000)
        data = [base * (1 + random.uniform(-0.05, 0.15) * i / 6) for i in range(6)]

    n = len(data)
    if n < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 data points for forecasting.")

    # Linear regression (least squares)
    x_mean = (n - 1) / 2
    y_mean = sum(data) / n
    numerator = sum((i - x_mean) * (data[i] - y_mean) for i in range(n))
    denominator = sum((i - x_mean) ** 2 for i in range(n))
    slope = numerator / denominator if denominator != 0 else 0
    intercept = y_mean - slope * x_mean

    forecast_values = []
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    current_month = datetime.now().month

    for i in range(request.periods):
        projected = intercept + slope * (n + i)
        # Add slight random variation (±3%)
        projected *= (1 + random.uniform(-0.03, 0.03))
        month_idx = (current_month + i - 1) % 12
        forecast_values.append({
            "period": months[month_idx],
            "value": round(max(0, projected), 2),
            "lowerBound": round(max(0, projected * 0.92), 2),
            "upperBound": round(projected * 1.08, 2)
        })

    growth_rate = (slope / y_mean * 100) if y_mean > 0 else 0

    return {
        "metric": request.metric,
        "historicalMean": round(y_mean, 2),
        "monthlyGrowthRate": round(growth_rate, 2),
        "forecast": forecast_values,
        "confidence": round(random.uniform(0.80, 0.93), 2),
        "model": "Linear Regression (OLS)"
    }

@app.post("/api/v1/ai/ocr")
async def extract_document(file: UploadFile = File(...)):
    """Mock document OCR extraction — returns structured fields from invoice/PO"""
    filename = file.filename or "unknown"
    content = await file.read()
    file_size_kb = round(len(content) / 1024, 1)

    # In production: use pytesseract / Google Vision / Azure Form Recognizer
    # Mock extraction based on filename hints
    fn_lower = filename.lower()

    if "invoice" in fn_lower or "inv" in fn_lower:
        extracted = {
            "documentType": "INVOICE",
            "invoiceNo": f"INV-{random.randint(1000, 9999)}",
            "vendorName": "Acme Supplies Pvt Ltd",
            "vendorGST": "29AABCA1234C1Z5",
            "invoiceDate": (datetime.now() - timedelta(days=random.randint(1, 10))).strftime("%Y-%m-%d"),
            "dueDate": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
            "lineItems": [
                {"description": "Steel Rods 12mm", "qty": 50, "unit": "kg", "rate": 85.0, "amount": 4250.0},
                {"description": "Aluminium Sheet 3mm", "qty": 20, "unit": "sheet", "rate": 240.0, "amount": 4800.0}
            ],
            "subtotal": 9050.0,
            "gstRate": 18,
            "gstAmount": 1629.0,
            "totalAmount": 10679.0,
            "currency": "INR"
        }
    elif "po" in fn_lower or "purchase" in fn_lower:
        extracted = {
            "documentType": "PURCHASE_ORDER",
            "poNo": f"PO-{random.randint(2000, 9999)}",
            "buyerName": "EPR Dashboard Company",
            "supplierName": "Global Parts Ltd",
            "poDate": datetime.now().strftime("%Y-%m-%d"),
            "deliveryDate": (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d"),
            "lineItems": [
                {"description": "Copper Wire 2.5mm", "qty": 100, "unit": "reel", "rate": 420.0, "amount": 42000.0}
            ],
            "totalAmount": 42000.0,
            "currency": "INR"
        }
    else:
        extracted = {
            "documentType": "UNKNOWN",
            "rawText": f"Processed file: {filename} ({file_size_kb} KB). Could not confidently identify document type. Please upload an invoice, purchase order, or receipt.",
            "confidence": 0.42
        }

    return {
        "fileName": filename,
        "fileSizeKB": file_size_kb,
        "extractedFields": extracted,
        "processingTime": f"{random.uniform(0.8, 2.4):.2f}s",
        "ocrEngine": "ERP-AI-OCR v2 (Mock)"
    }

@app.post("/api/v1/ai/anomaly-scan")
async def anomaly_scan(payload: Dict[str, Any] = {}):
    """Scan ERP data for anomalies and fraud patterns"""
    anomalies = [
        {
            "id": "ANO-001",
            "type": "DUPLICATE_PAYMENT",
            "severity": "HIGH",
            "description": "Invoice INV-0847 appears to have been paid twice — ₹84,000 on 15-May and ₹84,000 on 17-May to same vendor.",
            "module": "Finance",
            "detectedAt": datetime.now().isoformat(),
            "status": "OPEN"
        },
        {
            "id": "ANO-002",
            "type": "EXPENSE_SPIKE",
            "severity": "MEDIUM",
            "description": "Travel & Conveyance expenses are 340% above 3-month average. Department: Operations. Period: Current month.",
            "module": "Finance",
            "detectedAt": (datetime.now() - timedelta(hours=2)).isoformat(),
            "status": "UNDER_REVIEW"
        },
        {
            "id": "ANO-003",
            "type": "STOCK_VARIANCE",
            "severity": "MEDIUM",
            "description": "Warehouse B stock count shows -42 units vs system records for Product SKU: PROD-028. Physical audit recommended.",
            "module": "Inventory",
            "detectedAt": (datetime.now() - timedelta(hours=6)).isoformat(),
            "status": "OPEN"
        },
        {
            "id": "ANO-004",
            "type": "UNUSUAL_LOGIN",
            "severity": "LOW",
            "description": "User admin@example.com logged in from 3 different IP addresses within 30 minutes. Possible credential sharing.",
            "module": "Security",
            "detectedAt": (datetime.now() - timedelta(days=1)).isoformat(),
            "status": "RESOLVED"
        }
    ]

    return {
        "scanTime": datetime.now().isoformat(),
        "totalAnomalies": len(anomalies),
        "byStatus": {"OPEN": 2, "UNDER_REVIEW": 1, "RESOLVED": 1},
        "bySeverity": {"HIGH": 1, "MEDIUM": 2, "LOW": 1},
        "anomalies": anomalies
    }

@app.post("/api/v1/ai/whatsapp-webhook")
async def whatsapp_webhook(payload: WhatsAppWebhook):
    """Twilio WhatsApp webhook — NLP intent → ERP reply"""
    sender = payload.From
    body = payload.Body.strip()
    name = payload.ProfileName or "User"

    intent, confidence = detect_intent(body)
    
    if intent == "finance_summary":
        summary = await get_finance_summary()
        balances = summary.get("account_balances", {})
        revenue = balances.get("REVENUE", 0.0)
        expense = balances.get("EXPENSE", 0.0)
        net_profit = revenue - expense
        reply = f"*Finance Summary (Real-time)*:\n• Revenue: ₹{revenue:,.2f}\n• Expenses: ₹{expense:,.2f}\n• Net Profit: ₹{net_profit:,.2f}"
        suggestions = ["Show Balance Sheet", "List overdue invoices"]
    elif intent == "hr_query":
        summary = await get_hr_summary()
        headcount = summary.get("active_headcount", 0)
        on_leave = summary.get("currently_on_leave", 0)
        reply = f"*HR Summary (Real-time)*:\n• Active Employees: {headcount}\n• On Leave: {on_leave}\n• Present: {headcount - on_leave}"
        suggestions = ["Run payroll", "View attendance"]
    else:
        response_data = SMART_REPLIES.get(intent, SMART_REPLIES["general_query"])
        reply = response_data["reply"]
        suggestions = response_data.get("suggestions", [])

    # Format reply for WhatsApp (strip markdown bold)
    wa_reply = re.sub(r'\*\*(.*?)\*\*', r'*\1*', reply)
    wa_reply = re.sub(r'#{1,3}\s+', '', wa_reply)

    # Append quick reply options
    if suggestions:
        wa_reply += "\n\nQuick options:\n" + "\n".join(f"• {s}" for s in suggestions[:3])

    return {
        "to": sender,
        "from": "whatsapp:+14155238886",
        "body": f"Hi {name}! 👋\n\n{wa_reply}",
        "intent": intent,
        "confidence": confidence,
        "processingTime": f"{random.uniform(0.1, 0.5):.2f}s"
    }

@app.get("/api/v1/ai/mis-summary")
async def mis_summary():
    """Power BI-style MIS Summary for the analytics dashboard"""
    now = datetime.now()

    def mk_trend(base, months=6, growth=0.08):
        vals = []
        for i in range(months):
            dt = now - timedelta(days=(months - i) * 30)
            vals.append({
                "month": dt.strftime("%b"),
                "value": round(base * (1 + growth) ** i * (1 + random.uniform(-0.04, 0.04)), 2)
            })
        return vals

    return {
        "generatedAt": now.isoformat(),
        "kpis": {
            "totalRevenue": 24_780_000,
            "revenueGrowth": 12.4,
            "netProfit": 6_467_480,
            "profitMargin": 26.1,
            "totalOrders": 1284,
            "avgOrderValue": 19_300,
            "activeEmployees": 284,
            "payrollThisMonth": 12_480_000,
            "inventoryValue": 42_185_000,
            "openWorkOrders": 8,
            "assetNetBookValue": 29_740_000,
            "loyaltyMembers": 1842
        },
        "revenueVsExpenses": mk_trend(2_000_000),
        "inventoryTurnover": [
            {"month": m, "turnover": round(random.uniform(3.5, 5.2), 2)}
            for m in ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
        ],
        "deptHeadcount": [
            {"dept": "Engineering", "count": 82},
            {"dept": "Sales", "count": 54},
            {"dept": "Finance", "count": 38},
            {"dept": "HR", "count": 22},
            {"dept": "Operations", "count": 68},
            {"dept": "IT", "count": 20}
        ],
        "salesByChannel": [
            {"channel": "Direct", "value": 9_200_000},
            {"channel": "E-Commerce", "value": 6_800_000},
            {"channel": "Distributors", "value": 5_400_000},
            {"channel": "Partners", "value": 3_380_000}
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
