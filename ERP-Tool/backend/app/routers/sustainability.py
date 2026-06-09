from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.utils.db import get_db
from app.models.models import CarbonEntry, ESGReport, GreenInitiative

router = APIRouter(prefix="/sustainability", tags=["Sustainability"])

# ─── Carbon Entries ────────────────────────────────────────────────────────────

@router.get("/carbon")
async def get_carbon_entries(db: Session = Depends(get_db)):
    try:
        return db.query(CarbonEntry).order_by(desc(CarbonEntry.createdAt)).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/carbon", status_code=201)
async def create_carbon_entry(body: dict, db: Session = Depends(get_db)):
    category = body.get("category")
    description = body.get("description")
    amount = body.get("amount")
    if not category or amount is None:
        raise HTTPException(status_code=400, detail="category and amount are required")
    try:
        entry = CarbonEntry(
            category=category,
            description=description or category,
            amount=float(amount),
            unit=body.get("unit", "tCO2e"),
            date=body.get("date") or datetime.utcnow().strftime("%Y-%m-%d"),
            scope=str(body.get("scope", "1"))
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ─── ESG Reports ───────────────────────────────────────────────────────────────

@router.get("/esg-reports")
async def get_esg_reports(db: Session = Depends(get_db)):
    try:
        return db.query(ESGReport).order_by(desc(ESGReport.createdAt)).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/esg-reports", status_code=201)
async def create_esg_report(body: dict, db: Session = Depends(get_db)):
    title = body.get("title")
    period = body.get("period")
    if not title or not period:
        raise HTTPException(status_code=400, detail="title and period are required")
    try:
        env = float(body.get("envScore", 0))
        social = float(body.get("socialScore", 0))
        gov = float(body.get("govScore", 0))
        overall = round((env + social + gov) / 3, 1) if (env + social + gov) > 0 else 0
        report = ESGReport(
            title=title, period=period,
            envScore=env, socialScore=social, govScore=gov,
            overallScore=float(body.get("overallScore", overall)),
            status=body.get("status", "DRAFT")
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        return report
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ─── Green Initiatives ─────────────────────────────────────────────────────────

@router.get("/initiatives")
async def get_initiatives(db: Session = Depends(get_db)):
    try:
        return db.query(GreenInitiative).order_by(desc(GreenInitiative.createdAt)).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/initiatives", status_code=201)
async def create_initiative(body: dict, db: Session = Depends(get_db)):
    title = body.get("title")
    category = body.get("category")
    if not title or not category:
        raise HTTPException(status_code=400, detail="title and category are required")
    try:
        initiative = GreenInitiative(
            title=title,
            description=body.get("description"),
            category=category,
            targetReduction=float(body.get("targetReduction", 0)),
            actualReduction=float(body.get("actualReduction", 0)),
            status=body.get("status", "PLANNED"),
            startDate=body.get("startDate"),
            endDate=body.get("endDate")
        )
        db.add(initiative)
        db.commit()
        db.refresh(initiative)
        return initiative
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
