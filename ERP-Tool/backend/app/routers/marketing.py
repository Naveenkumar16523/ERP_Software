from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.utils.db import get_db
from app.models.models import MarketingCampaign, MarketingLead, SocialPost

router = APIRouter(prefix="/marketing", tags=["Marketing"])

# ─── Campaigns ─────────────────────────────────────────────────────────────────

@router.get("/campaigns")
async def get_campaigns(db: Session = Depends(get_db)):
    try:
        return db.query(MarketingCampaign).order_by(desc(MarketingCampaign.createdAt)).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/campaigns", status_code=201)
async def create_campaign(body: dict, db: Session = Depends(get_db)):
    name = body.get("name")
    camp_type = body.get("type", "EMAIL")
    if not name:
        raise HTTPException(status_code=400, detail="name is required")
    try:
        campaign = MarketingCampaign(
            name=name,
            type=camp_type,
            budget=float(body.get("budget", 0)),
            spent=float(body.get("spent", 0)),
            leads=int(body.get("leads", 0)),
            conversions=int(body.get("conversions", 0)),
            status=body.get("status", "DRAFT"),
            startDate=body.get("startDate"),
            endDate=body.get("endDate")
        )
        db.add(campaign)
        db.commit()
        db.refresh(campaign)
        return campaign
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ─── Marketing Leads ───────────────────────────────────────────────────────────

@router.get("/leads")
async def get_marketing_leads(db: Session = Depends(get_db)):
    try:
        return db.query(MarketingLead).order_by(desc(MarketingLead.createdAt)).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/leads", status_code=201)
async def create_marketing_lead(body: dict, db: Session = Depends(get_db)):
    name = body.get("name")
    email = body.get("email")
    if not name or not email:
        raise HTTPException(status_code=400, detail="name and email are required")
    try:
        lead = MarketingLead(
            name=name,
            email=email,
            source=body.get("source"),
            score=int(body.get("score", 50)),
            status=body.get("status", "NEW"),
            assignedTo=body.get("assignedTo")
        )
        db.add(lead)
        db.commit()
        db.refresh(lead)
        return lead
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/leads/{id}/status")
async def update_lead_status(id: str, body: dict, db: Session = Depends(get_db)):
    lead = db.query(MarketingLead).filter(MarketingLead.id == id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    lead.status = body.get("status", lead.status)
    db.commit()
    db.refresh(lead)
    return lead

# ─── Social Posts ──────────────────────────────────────────────────────────────

@router.get("/social-posts")
async def get_social_posts(db: Session = Depends(get_db)):
    try:
        return db.query(SocialPost).order_by(desc(SocialPost.createdAt)).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/social-posts", status_code=201)
async def create_social_post(body: dict, db: Session = Depends(get_db)):
    platform = body.get("platform")
    content = body.get("content")
    if not platform or not content:
        raise HTTPException(status_code=400, detail="platform and content are required")
    try:
        post = SocialPost(
            platform=platform,
            content=content,
            status=body.get("status", "DRAFT"),
            publishedDate=body.get("publishedDate"),
            likes=int(body.get("likes", 0)),
            shares=int(body.get("shares", 0)),
            comments=int(body.get("comments", 0))
        )
        db.add(post)
        db.commit()
        db.refresh(post)
        return post
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
