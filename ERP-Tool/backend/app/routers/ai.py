from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import time
from sqlalchemy import func

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
    
    if 'financ' in msg or 'revenue' in msg or 'income' in msg:
        total_rev = db.query(func.sum(Account.balance)).filter(Account.type == 'REVENUE').scalar() or 0
        total_exp = db.query(func.sum(Account.balance)).filter(Account.type == 'EXPENSE').scalar() or 0
        net_inc = total_rev - total_exp
        margin = ((net_inc / total_rev) * 100) if total_rev > 0 else 0
        status_emoji = '✅' if net_inc >= 0 else '⚠️'
        profit_text = 'profitable' if net_inc >= 0 else 'currently running at a loss'
        return f"📊 **Financial Summary**\n\n- **Total Revenue:** ₹{total_rev:,.2f}\n- **Total Expenses:** ₹{total_exp:,.2f}\n- **Net Income:** ₹{net_inc:,.2f} {status_emoji}\n\nThe business is {profit_text}. Margin is {margin:.1f}%."

    if 'leave' in msg or 'employee' in msg:
        total_emp = db.query(func.count(Employee.id)).scalar() or 0
        active_emp = db.query(func.count(Employee.id)).filter(Employee.status == 'Active').scalar() or 0
        pending_leaves = db.query(LeaveRequest).filter(LeaveRequest.status == 'PENDING').all()
        leave_text = "\n".join([f"  • {l.employeeId} (Type: {l.leaveType})" for l in pending_leaves]) if pending_leaves else "  ✅ No pending requests"
        return f"👥 **HR Summary**\n\n- **Total Employees:** {total_emp} ({active_emp} active)\n- **Pending Leave Requests:** {len(pending_leaves)}\n{leave_text}"

    if 'stock' in msg or 'inventory' in msg:
        # Simple query for low stock using exact column names in DB. Since reorderLevel/currentStock might be strings in SQLite, we should pull just what we need.
        # But this is MySQL now, assuming they are numeric. Actually, let's fetch products where currentStock <= reorderLevel.
        # To be safe against type issues, we just pull id, currentStock, reorderLevel.
        # It's better than fetching all products.
        products_subset = db.query(Product.productId, Product.currentStock, Product.reorderLevel).all()
        low_stock = []
        for p in products_subset:
            try:
                if float(p.currentStock) <= float(p.reorderLevel):
                    low_stock.append(p)
            except: pass
        total_skus = len(products_subset)
        stock_text = "\n".join([f"  • Product ID {p.productId}: {p.currentStock} units (reorder at {p.reorderLevel})" for p in low_stock]) if low_stock else "  ✅ All items adequately stocked"
        return f"📦 **Inventory Alert**\n\n- **Low Stock Items:** {len(low_stock)}\n{stock_text}\n\n- **Total SKUs:** {total_skus}"

    if 'customer' in msg or 'lead' in msg or 'crm' in msg:
        total_leads = db.query(func.count(Lead.id)).scalar() or 0
        won_leads_count = db.query(func.count(Lead.id)).filter(Lead.status == 'WON').scalar() or 0
        
        conv_rate = ((won_leads_count / total_leads) * 100) if total_leads > 0 else 0
        
        # Pull top 3 won leads manually to avoid sorting string columns in SQL
        won_leads = db.query(Lead.name, Lead.company, Lead.value).filter(Lead.status == 'WON').all()
        top_customers = sorted(won_leads, key=lambda x: float(x.value) if x.value else 0, reverse=True)[:3]
        
        top_text = "\n**Top Won Deals:**\n" + "\n".join([f"  • {c.name} ({c.company}): ₹{float(c.value or 0):,.2f}" for c in top_customers]) if top_customers else ""
        return f"🤝 **CRM Summary**\n\n- **Total Leads:** {total_leads}\n- **Won Deals:** {won_leads_count}\n- **Conversion Rate:** {conv_rate:.1f}%\n{top_text}"

    if 'shipment' in msg or 'transit' in msg or 'logistics' in msg:
        in_transit = db.query(Order).filter(Order.status.in_(['IN_TRANSIT', 'DISPATCHED'])).limit(3).all()
        transit_count = db.query(func.count(Order.id)).filter(Order.status.in_(['IN_TRANSIT', 'DISPATCHED'])).scalar() or 0
        transit_text = "\n".join([f"  • Order {s.orderNo} → {s.customerName}" for s in in_transit]) if in_transit else "  No shipments in transit"
        return f"🚚 **Supply Chain Status**\n\n- **In Transit:** {transit_count} shipments\n{transit_text}"

    return "🤖 **Rules-Based Assistant**\nI can help you with:\n\n- **Finance** — Revenue, expenses, and P&L\n- **HR** — Employee data and leave requests\n- **Inventory** — Stock levels and alerts\n- **CRM** — Lead pipeline and conversions\n- **Logistics** — Shipment tracking\n\nTry asking: *\"Summarize this month's financial performance\"*"

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
