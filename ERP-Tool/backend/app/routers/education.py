from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.utils.db import get_db
from app.models.models import Course, Enrollment, Assessment

router = APIRouter(prefix="/education", tags=["Education"])

# ─── Courses ───────────────────────────────────────────────────────────────────

@router.get("/courses")
async def get_courses(db: Session = Depends(get_db)):
    try:
        return db.query(Course).order_by(Course.title.asc()).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/courses", status_code=201)
async def create_course(body: dict, db: Session = Depends(get_db)):
    title = body.get("title")
    instructor = body.get("instructor")
    department = body.get("department")
    if not title or not instructor:
        raise HTTPException(status_code=400, detail="title and instructor are required")
    try:
        course = Course(
            courseCode=f"CRS-{int(datetime.utcnow().timestamp())}",
            title=title,
            instructor=instructor,
            department=department or "General",
            duration=body.get("duration", "8 weeks"),
            capacity=int(body.get("capacity", 30)),
            enrolled=int(body.get("enrolled", 0)),
            status=body.get("status", "ACTIVE"),
            startDate=body.get("startDate"),
            endDate=body.get("endDate")
        )
        db.add(course)
        db.commit()
        db.refresh(course)
        return course
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ─── Enrollments ───────────────────────────────────────────────────────────────

@router.get("/enrollments")
async def get_enrollments(db: Session = Depends(get_db)):
    try:
        return db.query(Enrollment).order_by(desc(Enrollment.createdAt)).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/enrollments", status_code=201)
async def create_enrollment(body: dict, db: Session = Depends(get_db)):
    courseId = body.get("courseId")
    studentName = body.get("studentName")
    studentEmail = body.get("studentEmail")
    if not courseId or not studentName or not studentEmail:
        raise HTTPException(status_code=400, detail="courseId, studentName, and studentEmail are required")
    try:
        enrollment = Enrollment(
            courseId=courseId,
            studentName=studentName,
            studentEmail=studentEmail,
            enrollDate=body.get("enrollDate") or datetime.utcnow().strftime("%Y-%m-%d"),
            progress=float(body.get("progress", 0)),
            grade=body.get("grade"),
            status=body.get("status", "ENROLLED")
        )
        db.add(enrollment)
        # Increment enrolled count on course
        course = db.query(Course).filter(Course.id == courseId).first()
        if course:
            course.enrolled += 1
        db.commit()
        db.refresh(enrollment)
        return enrollment
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ─── Assessments ───────────────────────────────────────────────────────────────

@router.get("/assessments")
async def get_assessments(db: Session = Depends(get_db)):
    try:
        return db.query(Assessment).order_by(desc(Assessment.createdAt)).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/assessments", status_code=201)
async def create_assessment(body: dict, db: Session = Depends(get_db)):
    title = body.get("title")
    assess_type = body.get("type", "QUIZ")
    if not title:
        raise HTTPException(status_code=400, detail="title is required")
    try:
        assessment = Assessment(
            courseId=body.get("courseId"),
            title=title,
            type=assess_type,
            maxScore=float(body.get("maxScore", 100)),
            dueDate=body.get("dueDate")
        )
        db.add(assessment)
        db.commit()
        db.refresh(assessment)
        return assessment
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
