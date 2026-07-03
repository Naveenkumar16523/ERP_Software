from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import time

from app.utils.db import get_db
from app.middlewares.rbac_middleware import get_current_rbac_user, require_module_access, RBACUser
from app.models.ai_sql_models import AIConversation, AIMessage
from app.models.finance_sql_models import FinanceAccount as Account
from app.models.crm_sql_models import Lead
from app.models.hr_sql_models import Employee, LeaveRequest
from app.models.inventory_sql_models import StoreInventory as Product
from app.models.ecommerce_sql_models import CustomerOrder as Order # Use Orders as Shipments fallback

router = APIRouter(prefix="/ai", tags=["AI Intelligence"])

class MessageCreate(BaseModel):
    content: str
    conversationId: Optional[str] = None

def generate_ai_response(content: str, db: Session) -> str:
    msg = content.lower()
    
    # Query database for summaries
    accounts = db.query(Account).all()
    leads = db.query(Lead).all()
    employees = db.query(Employee).all()
    leaves = db.query(LeaveRequest).all()
    products = db.query(Product).all()
    orders = db.query(Order).all()

    totalRev = sum([a.balance for a in accounts if a.type == 'REVENUE'])
    totalExp = sum([a.balance for a in accounts if a.type == 'EXPENSE'])
    netInc = totalRev - totalExp
    
    pendingLeaves = [l for l in leaves if l.status == 'PENDING']
    
    # Convert string stocks safely for checking
    lowStock = []
    for p in products:
        try:
            cStock = float(p.currentStock)
            rLevel = float(p.reorderLevel)
            if cStock <= rLevel:
                lowStock.append(p)
        except:
            pass

    wonLeads = [l for l in leads if l.status == 'WON']
    topCustomers = sorted(wonLeads, key=lambda x: float(x.value) if x.value else 0, reverse=True)[:3]

    inTransit = [o for o in orders if o.status in ['IN_TRANSIT', 'DISPATCHED']]

    if 'financ' in msg or 'revenue' in msg or 'income' in msg:
        margin = ((netInc / totalRev) * 100) if totalRev > 0 else 0
        status_emoji = '✅' if netInc >= 0 else '⚠️'
        profit_text = 'profitable' if netInc >= 0 else 'currently running at a loss'
        return f"📊 **Financial Summary**\n\n- **Total Revenue:** ₹{totalRev:,.2f}\n- **Total Expenses:** ₹{totalExp:,.2f}\n- **Net Income:** ₹{netInc:,.2f} {status_emoji}\n\nThe business is {profit_text}. Margin is {margin:.1f}%."

    if 'leave' in msg or 'employee' in msg:
        active_count = len([e for e in employees if e.status == 'Active'])
        leave_text = "\n".join([f"  • {l.employeeId} (Type: {l.leaveType})" for l in pendingLeaves]) if pendingLeaves else "  ✅ No pending requests"
        return f"👥 **HR Summary**\n\n- **Total Employees:** {len(employees)} ({active_count} active)\n- **Pending Leave Requests:** {len(pendingLeaves)}\n{leave_text}"

    if 'stock' in msg or 'inventory' in msg:
        stock_text = "\n".join([f"  • Product ID {p.productId}: {p.currentStock} units (reorder at {p.reorderLevel})" for p in lowStock]) if lowStock else "  ✅ All items adequately stocked"
        return f"📦 **Inventory Alert**\n\n- **Low Stock Items:** {len(lowStock)}\n{stock_text}\n\n- **Total SKUs:** {len(products)}"

    if 'customer' in msg or 'lead' in msg or 'crm' in msg:
        conv_rate = ((len(wonLeads) / len(leads)) * 100) if leads else 0
        top_text = "\n**Top Won Deals:**\n" + "\n".join([f"  • {c.name} ({c.company}): ₹{float(c.value or 0):,.2f}" for c in topCustomers]) if topCustomers else ""
        return f"🤝 **CRM Summary**\n\n- **Total Leads:** {len(leads)}\n- **Won Deals:** {len(wonLeads)}\n- **Conversion Rate:** {conv_rate:.1f}%\n{top_text}"

    if 'shipment' in msg or 'transit' in msg or 'logistics' in msg:
        transit_text = "\n".join([f"  • Order {s.orderNo} → {s.customerName}" for s in inTransit[:3]]) if inTransit else "  No shipments in transit"
        return f"🚚 **Supply Chain Status**\n\n- **In Transit:** {len(inTransit)} shipments\n{transit_text}"

    return "🤖 I can help you with:\n\n- **Finance** — Revenue, expenses, and P&L\n- **HR** — Employee data and leave requests\n- **Inventory** — Stock levels and alerts\n- **CRM** — Lead pipeline and conversions\n- **Logistics** — Shipment tracking\n\nTry asking: *\"Summarize this month's financial performance\"*"

@router.get("/conversations")
async def get_conversations(current_user: RBACUser = Depends(get_current_rbac_user), db: Session = Depends(get_db)):
    # In a real app, filter by current_user.email, but for demo we just get all or a default one
    convs = db.query(AIConversation).all()
    if not convs:
        default_conv = AIConversation(title="General AI Assistant", userId="admin")
        db.add(default_conv)
        db.commit()
        db.refresh(default_conv)
        convs = [default_conv]
    return convs

@router.get("/conversations/{conversation_id}/messages")
async def get_messages(conversation_id: str, current_user: RBACUser = Depends(get_current_rbac_user), db: Session = Depends(get_db)):
    return db.query(AIMessage).filter(AIMessage.conversationId == conversation_id).order_by(AIMessage.timestamp.asc()).all()

@router.post("/chat")
async def send_message(body: MessageCreate, current_user: RBACUser = Depends(get_current_rbac_user), db: Session = Depends(get_db)):
    conv_id = body.conversationId
    if not conv_id:
        conv = db.query(AIConversation).first()
        if not conv:
            conv = AIConversation(title="General AI Assistant", userId="admin")
            db.add(conv)
            db.commit()
            db.refresh(conv)
        conv_id = conv.id

    # Save user message
    user_msg = AIMessage(conversationId=conv_id, role="user", content=body.content)
    db.add(user_msg)
    
    # Generate and save AI response
    response_content = generate_ai_response(body.content, db)
    ai_msg = AIMessage(conversationId=conv_id, role="assistant", content=response_content)
    db.add(ai_msg)
    
    db.commit()
    db.refresh(ai_msg)
    
    # Simulate processing delay
    time.sleep(0.5)
    
    return {"userMessage": user_msg, "assistantMessage": ai_msg}
