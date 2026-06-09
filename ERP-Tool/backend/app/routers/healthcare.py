from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.utils.db import get_db
from app.models.models import Patient, Appointment, Prescription

router = APIRouter(prefix="/healthcare", tags=["Healthcare"])

# ─── Patients ──────────────────────────────────────────────────────────────────

@router.get("/patients")
async def get_patients(db: Session = Depends(get_db)):
    try:
        return db.query(Patient).order_by(Patient.name.asc()).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/patients", status_code=201)
async def create_patient(body: dict, db: Session = Depends(get_db)):
    name = body.get("name")
    age = body.get("age")
    gender = body.get("gender", "OTHER")
    if not name or age is None:
        raise HTTPException(status_code=400, detail="name and age are required")
    try:
        patient = Patient(
            patientCode=f"PAT-{int(datetime.utcnow().timestamp())}",
            name=name,
            age=int(age),
            gender=gender,
            bloodGroup=body.get("bloodGroup"),
            phone=body.get("phone"),
            email=body.get("email"),
            diagnosis=body.get("diagnosis"),
            status=body.get("status", "ACTIVE")
        )
        db.add(patient)
        db.commit()
        db.refresh(patient)
        return patient
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ─── Appointments ──────────────────────────────────────────────────────────────

@router.get("/appointments")
async def get_appointments(db: Session = Depends(get_db)):
    try:
        return db.query(Appointment).order_by(desc(Appointment.createdAt)).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/appointments", status_code=201)
async def create_appointment(body: dict, db: Session = Depends(get_db)):
    patientId = body.get("patientId")
    doctor = body.get("doctor")
    department = body.get("department")
    date = body.get("date")
    if not patientId or not doctor or not date:
        raise HTTPException(status_code=400, detail="patientId, doctor, and date are required")
    try:
        appt = Appointment(
            patientId=patientId,
            doctor=doctor,
            department=department or "General",
            date=date,
            time=body.get("time"),
            type=body.get("type", "CONSULTATION"),
            status=body.get("status", "SCHEDULED"),
            notes=body.get("notes")
        )
        db.add(appt)
        db.commit()
        db.refresh(appt)
        return appt
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/appointments/{id}/status")
async def update_appointment_status(id: str, body: dict, db: Session = Depends(get_db)):
    appt = db.query(Appointment).filter(Appointment.id == id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    appt.status = body.get("status", appt.status)
    db.commit()
    db.refresh(appt)
    return appt

# ─── Prescriptions ─────────────────────────────────────────────────────────────

@router.get("/prescriptions")
async def get_prescriptions(db: Session = Depends(get_db)):
    try:
        return db.query(Prescription).order_by(desc(Prescription.createdAt)).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/prescriptions", status_code=201)
async def create_prescription(body: dict, db: Session = Depends(get_db)):
    patientId = body.get("patientId")
    doctor = body.get("doctor")
    medication = body.get("medication")
    dosage = body.get("dosage")
    duration = body.get("duration")
    if not patientId or not doctor or not medication:
        raise HTTPException(status_code=400, detail="patientId, doctor, and medication are required")
    try:
        rx = Prescription(
            patientId=patientId, doctor=doctor, medication=medication,
            dosage=dosage or "As directed", duration=duration or "7 days",
            notes=body.get("notes")
        )
        db.add(rx)
        db.commit()
        db.refresh(rx)
        return rx
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
