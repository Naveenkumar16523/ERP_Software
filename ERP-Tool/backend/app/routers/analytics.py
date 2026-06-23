import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.utils.db import get_db
from app.models.models import AnalyticsReport, KPISnapshot

router = APIRouter(prefix="/analytics", tags=["Analytics"])

# ─── Reports ───────────────────────────────────────────────────────────────────

@router.get("/reports")
async def get_reports(db: Session = Depends(get_db)):
    try:
        reports = db.query(AnalyticsReport).order_by(desc(AnalyticsReport.createdAt)).all()
        result = []
        for r in reports:
            result.append({
                "id": r.id,
                "title": r.title,
                "reportType": r.reportType,
                "period": r.period,
                "data": json.loads(r.data) if r.data else {},
                "status": r.status,
                "createdAt": r.createdAt,
                "updatedAt": r.updatedAt
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reports", status_code=201)
async def create_report(body: dict, db: Session = Depends(get_db)):
    title = body.get("title")
    report_type = body.get("reportType", "OPERATIONAL")
    period = body.get("period")
    if not title or not period:
        raise HTTPException(status_code=400, detail="title and period are required")
    try:
        data = body.get("data", {})
        report = AnalyticsReport(
            title=title,
            reportType=report_type,
            period=period,
            data=json.dumps(data) if isinstance(data, dict) else data,
            status=body.get("status", "DRAFT")
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        return {
            "id": report.id,
            "title": report.title,
            "reportType": report.reportType,
            "period": report.period,
            "data": data,
            "status": report.status,
            "createdAt": report.createdAt
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ─── KPI Snapshots ─────────────────────────────────────────────────────────────

@router.get("/kpis")
async def get_kpis(db: Session = Depends(get_db)):
    try:
        return db.query(KPISnapshot).order_by(desc(KPISnapshot.createdAt)).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/kpis", status_code=201)
async def create_kpi(body: dict, db: Session = Depends(get_db)):
    name = body.get("name")
    value = body.get("value")
    category = body.get("category")
    if not name or value is None or not category:
        raise HTTPException(status_code=400, detail="name, value, and category are required")
    try:
        kpi = KPISnapshot(
            name=name,
            value=float(value),
            unit=body.get("unit"),
            category=category,
            trend=body.get("trend"),
            snapshotDate=body.get("snapshotDate") or datetime.utcnow().strftime("%Y-%m-%d")
        )
        db.add(kpi)
        db.commit()
        db.refresh(kpi)
        return kpi
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
