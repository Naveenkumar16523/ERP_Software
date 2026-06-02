import time
import json
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, func

from app.utils.db import get_db
from app.utils.audit import log_audit_event
from app.middlewares.auth_middleware import get_current_user, require_permission, AuthenticatedUser
from app.models.models import Lead, CustomerAccount, Opportunity, Quote
from app.models.schemas import LeadCreate, LeadStageUpdate, CustomerCreate

router = APIRouter(prefix="/crm", tags=["CRM"])

# 1. LEADS

@router.get("/leads")
async def get_leads(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        leads = db.query(Lead).order_by(desc(Lead.createdAt)).all()
        return leads
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/leads", status_code=status.HTTP_201_CREATED)
async def create_lead(body: LeadCreate, current_user: AuthenticatedUser = Depends(require_permission("crm:write")), db: Session = Depends(get_db)):
    try:
        lead = Lead(
            name=body.name,
            company=body.company,
            email=body.email,
            phone=body.phone,
            status=body.status or "NEW",
            source=body.source,
            value=float(body.value or 0.0)
        )
        db.add(lead)
        db.commit()
        db.refresh(lead)
        return lead
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.patch("/leads/{id}")
async def patch_lead(id: str, body: dict, current_user: AuthenticatedUser = Depends(require_permission("crm:write")), db: Session = Depends(get_db)):
    try:
        lead = db.query(Lead).filter(Lead.id == id).first()
        if not lead:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Not Found", "message": "Lead not found"})
            
        if "status" in body:
            lead.status = body["status"]
        if "value" in body and body["value"] is not None:
            lead.value = float(body["value"])
            
        db.commit()
        db.refresh(lead)
        return lead
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 2. CUSTOMER ACCOUNTS

@router.get("/customer-accounts")
async def get_customer_accounts(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        accounts = db.query(CustomerAccount).order_by(CustomerAccount.name.asc()).all()
        return accounts
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/customer-accounts", status_code=status.HTTP_201_CREATED)
async def create_customer_account(body: CustomerCreate, current_user: AuthenticatedUser = Depends(require_permission("crm:write")), db: Session = Depends(get_db)):
    try:
        existing = db.query(CustomerAccount).filter(CustomerAccount.name == body.name).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Conflict", "message": "Customer Account already exists"})
            
        account = CustomerAccount(
            name=body.name,
            industry=body.industry,
            phone=body.phone,
            billingAddress=body.billingAddress
        )
        db.add(account)
        db.commit()
        db.refresh(account)
        return account
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 3. OPPORTUNITIES

@router.get("/opportunities")
async def get_opportunities(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        opps = db.query(Opportunity).order_by(desc(Opportunity.createdAt)).all()
        result = []
        for o in opps:
            ld = db.query(Lead).filter(Lead.id == o.leadId).first() if o.leadId else None
            acc = db.query(CustomerAccount).filter(CustomerAccount.id == o.accountId).first() if o.accountId else None
            result.append({
                "id": o.id,
                "name": o.name,
                "stage": o.stage,
                "value": o.value,
                "closeDate": o.closeDate,
                "leadId": o.leadId,
                "accountId": o.accountId,
                "createdAt": o.createdAt,
                "updatedAt": o.updatedAt,
                "lead": {"id": ld.id, "name": ld.name, "company": ld.company} if ld else None,
                "account": {"id": acc.id, "name": acc.name, "industry": acc.industry} if acc else None
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/opportunities", status_code=status.HTTP_201_CREATED)
async def create_opportunity(body: dict, current_user: AuthenticatedUser = Depends(require_permission("crm:write")), db: Session = Depends(get_db)):
    name = body.get("name")
    stage = body.get("stage") or "QUALIFICATION"
    value = body.get("value")
    leadId = body.get("leadId")
    accountId = body.get("accountId")

    if not name or value is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": "Opportunity name and value are required."})

    try:
        opp = Opportunity(
            name=name,
            stage=stage,
            value=float(value),
            leadId=leadId or None,
            accountId=accountId or None
        )
        db.add(opp)
        db.commit()
        db.refresh(opp)
        return opp
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.patch("/opportunities/{id}")
async def patch_opportunity(id: str, body: dict, current_user: AuthenticatedUser = Depends(require_permission("crm:write")), db: Session = Depends(get_db)):
    try:
        opp = db.query(Opportunity).filter(Opportunity.id == id).first()
        if not opp:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Not Found", "message": "Opportunity not found"})

        if "stage" in body:
            opp.stage = body["stage"]
        if "value" in body and body["value"] is not None:
            opp.value = float(body["value"])

        db.commit()
        db.refresh(opp)
        return opp
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 4. QUOTE TO CASH - DISCOUNT SUGGESTION ENGINE

@router.post("/quote-to-cash/discount-suggest")
async def quote_discount_suggest(body: dict, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    opportunityId = body.get("opportunityId")
    accountId = body.get("accountId")

    if not opportunityId:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": "Opportunity ID is required."})

    try:
        opp = db.query(Opportunity).filter(Opportunity.id == opportunityId).first()
        if not opp:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Not Found", "message": "Opportunity not found."})

        is_returning = False
        client_name = "New Client"

        acc = None
        if opp.accountId:
            acc = db.query(CustomerAccount).filter(CustomerAccount.id == opp.accountId).first()
        elif accountId:
            acc = db.query(CustomerAccount).filter(CustomerAccount.id == accountId).first()

        if acc:
            is_returning = acc.isReturning
            client_name = acc.name

        val = opp.value
        suggested_discount = 5.0
        explanation = ""

        if is_returning:
            if val >= 100000.0:
                suggested_discount = 15.0
                explanation = f"Loyal client ({client_name}) presenting a high-value opportunity of ₹{val:,.2f}. Maximum discount tier of 15% recommended for retention."
            else:
                suggested_discount = 10.0
                explanation = f"Returning client ({client_name}) with transactional history. Recommended discount of 10% applied for relationship maintenance."
        else:
            if val >= 100000.0:
                suggested_discount = 8.0
                explanation = f"High-value prospective deal (₹{val:,.2f}) for new account. 8% strategic discount suggested to incentivize conversion."
            else:
                suggested_discount = 5.0
                explanation = "Standard baseline client acquisition discount of 5% suggested."

        return {
            "opportunityId": opportunityId,
            "value": val,
            "isReturning": is_returning,
            "clientName": client_name,
            "suggestedDiscount": suggested_discount,
            "explanation": explanation
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

# 5. QUOTES

@router.get("/quotes")
async def get_quotes(current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        quotes = db.query(Quote).order_by(desc(Quote.createdAt)).all()
        result = []
        for q in quotes:
            opp = db.query(Opportunity).filter(Opportunity.id == q.opportunityId).first()
            result.append({
                "id": q.id,
                "quoteNo": q.quoteNo,
                "opportunityId": q.opportunityId,
                "items": q.items,
                "subtotal": q.subtotal,
                "discount": q.discount,
                "taxAmount": q.taxAmount,
                "total": q.total,
                "status": q.status,
                "discountExplanation": q.discountExplanation,
                "createdAt": q.createdAt,
                "updatedAt": q.updatedAt,
                "opportunity": {"id": opp.id, "name": opp.name, "value": opp.value} if opp else None
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})

@router.post("/quote-to-cash/quotes", status_code=status.HTTP_201_CREATED)
async def create_quote(body: dict, req: Request, current_user: AuthenticatedUser = Depends(require_permission("crm:write")), db: Session = Depends(get_db)):
    opportunityId = body.get("opportunityId")
    items = body.get("items")
    subtotal = body.get("subtotal")
    discount = body.get("discount")
    taxAmount = body.get("taxAmount")
    total = body.get("total")
    status_val = body.get("status") or "DRAFT"

    if not opportunityId or items is None or subtotal is None or total is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": "Bad Request", "message": "Missing Quote requirements."})

    try:
        opp = db.query(Opportunity).filter(Opportunity.id == opportunityId).first()
        if not opp:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "Not Found", "message": "Opportunity not found."})

        count = db.query(func.count(Quote.id)).scalar()
        quote_no = f"QT-{int(time.time() * 1000)}-{count + 1}"

        items_str = items if isinstance(items, str) else json.dumps(items)

        discount_exp = ""
        discount_val = float(discount or 0.0)
        if discount_val > 0:
            discount_exp = f"Strategic quotation discount of {discount_val}% approved for conversion incentive."

        quote = Quote(
            quoteNo=quote_no,
            opportunityId=opportunityId,
            items=items_str,
            subtotal=float(subtotal),
            discount=discount_val,
            taxAmount=float(taxAmount or 0.0),
            total=float(total),
            status=status_val,
            discountExplanation=discount_exp
        )
        db.add(quote)

        # Advance opportunity stage
        opp.stage = "PROPOSAL"
        
        db.commit()
        db.refresh(quote)

        await log_audit_event(
            user_id=current_user.id,
            action="CREATE_QUOTE",
            resource="Quote",
            details={
                "id": quote.id,
                "quoteNo": quote.quoteNo,
                "total": quote.total
            },
            req=req
        )

        return quote
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": "Internal Server Error", "message": str(e)})
