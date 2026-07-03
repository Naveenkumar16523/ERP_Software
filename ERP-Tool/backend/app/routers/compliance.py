from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.utils.db import get_db
from app.middlewares.rbac_middleware import get_current_rbac_user, require_module_access, RBACUser
from app.models.compliance_sql_models import EwayBill
from pydantic import BaseModel
from typing import Optional
from app.utils.export import generate_pdf
import uuid
import time
from fastapi.responses import Response

router = APIRouter(prefix="/compliance", tags=["Compliance"])

class EwayBillCreate(BaseModel):
    ewayBillNumber: Optional[str] = None
    shipmentId: Optional[str] = None
    invoiceId: Optional[str] = None
    vehicleNumber: Optional[str] = None
    fromGstin: str
    toGstin: str
    fromAddress: str
    toAddress: str
    goodsValue: float
    hsnCode: str
    distanceKm: int
    validUntil: Optional[str] = None

@router.get("/ewaybills")
async def get_ewaybills(current_user: RBACUser = Depends(require_module_access("compliance")), db: Session = Depends(get_db)):
    return db.query(EwayBill).order_by(EwayBill.createdAt.desc()).all()

@router.post("/ewaybills", status_code=status.HTTP_201_CREATED)
async def create_ewaybill(body: EwayBillCreate, current_user: RBACUser = Depends(require_module_access("compliance")), db: Session = Depends(get_db)):
    ewb_no = body.ewayBillNumber or f"EWB-{int(time.time())}"
    
    valid_until_dt = None
    if body.validUntil:
        try:
            valid_until_dt = datetime.fromisoformat(body.validUntil.replace("Z", "+00:00"))
        except Exception:
            pass

    ewb = EwayBill(
        ewayBillNumber=ewb_no,
        shipmentId=body.shipmentId,
        invoiceId=body.invoiceId,
        vehicleNumber=body.vehicleNumber,
        fromGstin=body.fromGstin,
        toGstin=body.toGstin,
        fromAddress=body.fromAddress,
        toAddress=body.toAddress,
        goodsValue=body.goodsValue,
        hsnCode=body.hsnCode,
        distanceKm=body.distanceKm,
        validUntil=valid_until_dt
    )
    db.add(ewb)
    db.commit()
    db.refresh(ewb)
    return ewb

@router.get("/ewaybills/{id}/pdf")
async def download_ewaybill_pdf(id: str, db: Session = Depends(get_db)):
    ewb = db.query(EwayBill).filter(EwayBill.id == id).first()
    if not ewb:
        raise HTTPException(status_code=404, detail="EwayBill not found")

    html_content = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Helvetica, Arial, sans-serif; font-size: 12px; color: #333; }}
            .header {{ text-align: center; margin-bottom: 20px; }}
            .header h1 {{ margin: 0; font-size: 20px; color: #1e3a8a; }}
            .header h2 {{ margin: 5px 0; font-size: 14px; color: #64748b; font-weight: normal; }}
            .content-table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
            .content-table th, .content-table td {{ border: 1px solid #cbd5e1; padding: 8px; text-align: left; }}
            .content-table th {{ background-color: #f8fafc; font-weight: bold; width: 40%; }}
            .section-title {{ font-size: 14px; font-weight: bold; margin-top: 20px; margin-bottom: 10px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }}
            .badge {{ display: inline-block; padding: 3px 8px; background-color: #dcfce7; color: #166534; border-radius: 12px; font-weight: bold; font-size: 10px; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>e-Way Bill</h1>
            <h2>Under rule 138 of the CGST Rules, 2017</h2>
            <div style="margin-top: 10px;">
                <strong>E-Way Bill No:</strong> {ewb.ewayBillNumber} &nbsp;&nbsp;&nbsp;
                <span class="badge">{ewb.status}</span>
            </div>
        </div>

        <div class="section-title">1. E-Way Bill Details</div>
        <table class="content-table">
            <tr><th>E-Way Bill No</th><td>{ewb.ewayBillNumber}</td></tr>
            <tr><th>Generated Date</th><td>{ewb.createdAt.strftime('%d-%m-%Y %H:%M') if ewb.createdAt else '-'}</td></tr>
            <tr><th>Valid Until</th><td>{ewb.validUntil.strftime('%d-%m-%Y %H:%M') if ewb.validUntil else 'Subject to Transport'}</td></tr>
        </table>

        <div class="section-title">2. Address Details</div>
        <table class="content-table">
            <tr><th>From GSTIN</th><td>{ewb.fromGstin}</td></tr>
            <tr><th>From Address</th><td>{ewb.fromAddress}</td></tr>
            <tr><th>To GSTIN</th><td>{ewb.toGstin}</td></tr>
            <tr><th>To Address</th><td>{ewb.toAddress}</td></tr>
        </table>

        <div class="section-title">3. Goods Details</div>
        <table class="content-table">
            <tr><th>HSN Code</th><td>{ewb.hsnCode}</td></tr>
            <tr><th>Total Assessable Value (Rs)</th><td>{ewb.goodsValue:,.2f}</td></tr>
        </table>

        <div class="section-title">4. Transportation Details</div>
        <table class="content-table">
            <tr><th>Vehicle Number</th><td>{ewb.vehicleNumber}</td></tr>
            <tr><th>Approx Distance (Km)</th><td>{ewb.distanceKm}</td></tr>
        </table>
        
        <div style="margin-top: 40px; font-size: 10px; text-align: center; color: #94a3b8;">
            <p>This is a computer generated document. No signature is required.</p>
        </div>
    </body>
    </html>
    """

    pdf_buffer = generate_pdf(html_content)
    
    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="EwayBill_{ewb.ewayBillNumber}.pdf"'
        }
    )
