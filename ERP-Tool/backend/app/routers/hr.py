"""
HR Router — Employee Directory, Leave, Recruitment, Performance, Onboarding, Attendance
"""
from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.utils.db import get_db
from app.middlewares.rbac_middleware import get_current_rbac_user, require_module_access, RBACUser
from app.models.hr_sql_models import (
    Employee, LeaveType, LeaveRequest, LeaveBalance,
    JobPosting, JobApplication,
    PerformanceReview, PerformanceGoal,
    OnboardingTask, OnboardingChecklist,
    AttendanceRecord, Shift
)

router = APIRouter(prefix="/hr", tags=["Human Resources"])


# ═══════════════════════════════════════════════════════════
# SCHEMAS
# ═══════════════════════════════════════════════════════════

class EmployeeCreate(BaseModel):
    fullName: str
    email: EmailStr
    phone: Optional[str] = None
    departmentName: Optional[str] = None
    designation: str
    employeeType: Optional[str] = "Full-Time"
    dateOfJoining: Optional[date] = None
    dateOfBirth: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    salary: Optional[float] = None

class EmployeeUpdate(BaseModel):
    fullName: Optional[str] = None
    phone: Optional[str] = None
    departmentName: Optional[str] = None
    designation: Optional[str] = None
    status: Optional[str] = None
    salary: Optional[float] = None

class LeaveRequestCreate(BaseModel):
    employeeId: str
    leaveTypeName: str
    startDate: date
    endDate: date
    totalDays: int
    reason: Optional[str] = None

class LeaveAction(BaseModel):
    action: str  # "approve" or "reject"
    reviewNote: Optional[str] = None

class JobPostingCreate(BaseModel):
    title: str
    departmentName: str
    location: str
    jobType: Optional[str] = "Full-Time"
    experienceLevel: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    salaryMin: Optional[float] = None
    salaryMax: Optional[float] = None
    openings: Optional[int] = 1
    deadline: Optional[date] = None

class JobApplicationCreate(BaseModel):
    jobPostingId: str
    applicantName: str
    email: EmailStr
    phone: Optional[str] = None
    coverLetter: Optional[str] = None

class ApplicationStageUpdate(BaseModel):
    currentStage: str
    rating: Optional[int] = None
    notes: Optional[str] = None

class PerformanceReviewCreate(BaseModel):
    employeeId: str
    reviewPeriod: str
    goals: Optional[str] = None
    dueDate: Optional[date] = None

class PerformanceReviewSubmit(BaseModel):
    overallRating: float
    strengths: Optional[str] = None
    improvements: Optional[str] = None
    goals: Optional[str] = None
    comments: Optional[str] = None

class PerformanceGoalCreate(BaseModel):
    employeeId: str
    title: str
    description: Optional[str] = None
    targetDate: Optional[date] = None

class GoalProgressUpdate(BaseModel):
    progress: int
    status: Optional[str] = None

class OnboardingTaskCreate(BaseModel):
    employeeId: str
    taskName: str
    category: str
    assignedTo: Optional[str] = None
    dueDate: Optional[date] = None

class AttendanceCreate(BaseModel):
    employeeId: str
    date: date
    checkIn: Optional[str] = None
    checkOut: Optional[str] = None
    hoursWorked: Optional[float] = None
    status: Optional[str] = "Present"
    notes: Optional[str] = None

class ShiftCreate(BaseModel):
    name: str
    startTime: str
    endTime: str
    hoursPerDay: Optional[float] = 8.0


# ═══════════════════════════════════════════════════════════
# 1. EMPLOYEE DIRECTORY
# ═══════════════════════════════════════════════════════════

@router.get("/employees")
async def list_employees(
    status: Optional[str] = None,
    department: Optional[str] = None,
    current_user: RBACUser = Depends(require_module_access("hr")),
    db: Session = Depends(get_db)
):
    query = db.query(Employee)
    if status:
        query = query.filter(Employee.status == status)
    if department:
        query = query.filter(Employee.departmentName == department)
    return query.order_by(Employee.fullName).all()


@router.post("/employees", status_code=status.HTTP_201_CREATED)
async def create_employee(
    body: EmployeeCreate,
    current_user: RBACUser = Depends(require_module_access("hr")),
    db: Session = Depends(get_db)
):
    if db.query(Employee).filter(Employee.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Generate employee ID
    count = db.query(Employee).count()
    emp_id = f"EMP-{str(count + 1).zfill(4)}"

    employee = Employee(
        employeeId=emp_id,
        fullName=body.fullName,
        email=body.email,
        phone=body.phone,
        departmentName=body.departmentName,
        designation=body.designation,
        employeeType=body.employeeType,
        dateOfJoining=body.dateOfJoining,
        dateOfBirth=body.dateOfBirth,
        gender=body.gender,
        address=body.address,
        salary=body.salary,
        status="Active"
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee


@router.get("/employees/{employee_id}")
async def get_employee(
    employee_id: str,
    current_user: RBACUser = Depends(require_module_access("hr")),
    db: Session = Depends(get_db)
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp


@router.put("/employees/{employee_id}")
async def update_employee(
    employee_id: str,
    body: EmployeeUpdate,
    current_user: RBACUser = Depends(require_module_access("hr")),
    db: Session = Depends(get_db)
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(emp, field, value)

    db.commit()
    db.refresh(emp)
    return emp


# ═══════════════════════════════════════════════════════════
# 2. LEAVE MANAGEMENT
# ═══════════════════════════════════════════════════════════

@router.get("/leave/types")
async def list_leave_types(
    current_user: RBACUser = Depends(require_module_access("hr")),
    db: Session = Depends(get_db)
):
    return db.query(LeaveType).all()


@router.post("/leave/types", status_code=status.HTTP_201_CREATED)
async def create_leave_type(
    body: dict,
    current_user: RBACUser = Depends(require_module_access("hr")),
    db: Session = Depends(get_db)
):
    lt = LeaveType(
        name=body.get("name"),
        totalDays=body.get("totalDays", 0),
        description=body.get("description")
    )
    db.add(lt)
    db.commit()
    db.refresh(lt)
    return lt


@router.get("/leave/requests")
async def list_leave_requests(
    status_filter: Optional[str] = None,
    employee_id: Optional[str] = None,
    current_user: RBACUser = Depends(require_module_access("hr")),
    db: Session = Depends(get_db)
):
    query = db.query(LeaveRequest)
    if status_filter:
        query = query.filter(LeaveRequest.status == status_filter)
    if employee_id:
        query = query.filter(LeaveRequest.employeeId == employee_id)
    return query.order_by(LeaveRequest.createdAt.desc()).all()


@router.post("/leave/requests", status_code=status.HTTP_201_CREATED)
async def create_leave_request(
    body: LeaveRequestCreate,
    current_user: RBACUser = Depends(require_module_access("hr")),
    db: Session = Depends(get_db)
):
    emp = db.query(Employee).filter(Employee.id == body.employeeId).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    leave_req = LeaveRequest(
        employeeId=body.employeeId,
        employeeName=emp.fullName,
        leaveTypeName=body.leaveTypeName,
        startDate=body.startDate,
        endDate=body.endDate,
        totalDays=body.totalDays,
        reason=body.reason,
        status="Pending"
    )
    db.add(leave_req)
    db.commit()
    db.refresh(leave_req)
    return leave_req


@router.patch("/leave/requests/{request_id}/action")
async def action_leave_request(
    request_id: str,
    body: LeaveAction,
    current_user: RBACUser = Depends(require_module_access("hr")),
    db: Session = Depends(get_db)
):
    leave_req = db.query(LeaveRequest).filter(LeaveRequest.id == request_id).first()
    if not leave_req:
        raise HTTPException(status_code=404, detail="Leave request not found")
    if leave_req.status != "Pending":
        raise HTTPException(status_code=400, detail="This request has already been processed")

    leave_req.status = "Approved" if body.action == "approve" else "Rejected"
    leave_req.reviewedBy = current_user.username
    leave_req.reviewedAt = datetime.utcnow()
    leave_req.reviewNote = body.reviewNote

    db.commit()
    db.refresh(leave_req)
    return leave_req


# ═══════════════════════════════════════════════════════════
# 3. RECRUITMENT
# ═══════════════════════════════════════════════════════════

@router.get("/recruitment/jobs")
async def list_job_postings(
    status_filter: Optional[str] = None,
    current_user: RBACUser = Depends(require_module_access("hr")),
    db: Session = Depends(get_db)
):
    query = db.query(JobPosting)
    if status_filter:
        query = query.filter(JobPosting.status == status_filter)
    return query.order_by(JobPosting.createdAt.desc()).all()


@router.post("/recruitment/jobs", status_code=status.HTTP_201_CREATED)
async def create_job_posting(
    body: JobPostingCreate,
    current_user: RBACUser = Depends(require_module_access("hr")),
    db: Session = Depends(get_db)
):
    job = JobPosting(**body.model_dump())
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@router.get("/recruitment/jobs/{job_id}/applications")
async def list_applications(
    job_id: str,
    current_user: RBACUser = Depends(require_module_access("hr")),
    db: Session = Depends(get_db)
):
    return db.query(JobApplication).filter(JobApplication.jobPostingId == job_id).order_by(JobApplication.createdAt.desc()).all()


@router.post("/recruitment/applications", status_code=status.HTTP_201_CREATED)
async def submit_application(
    body: JobApplicationCreate,
    db: Session = Depends(get_db)
):
    """Public endpoint — no auth required to apply"""
    job = db.query(JobPosting).filter(JobPosting.id == body.jobPostingId).first()
    if not job or job.status != "Open":
        raise HTTPException(status_code=404, detail="Job posting not found or closed")

    application = JobApplication(
        jobPostingId=body.jobPostingId,
        applicantName=body.applicantName,
        email=body.email,
        phone=body.phone,
        coverLetter=body.coverLetter,
        currentStage="Applied"
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


@router.patch("/recruitment/applications/{app_id}/stage")
async def update_application_stage(
    app_id: str,
    body: ApplicationStageUpdate,
    current_user: RBACUser = Depends(require_module_access("hr")),
    db: Session = Depends(get_db)
):
    application = db.query(JobApplication).filter(JobApplication.id == app_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    application.currentStage = body.currentStage
    if body.rating is not None:
        application.rating = body.rating
    if body.notes:
        application.notes = body.notes
    application.updatedAt = datetime.utcnow()

    db.commit()
    db.refresh(application)
    return application


# ═══════════════════════════════════════════════════════════
# 4. PERFORMANCE
# ═══════════════════════════════════════════════════════════

@router.get("/performance/reviews")
async def list_performance_reviews(
    employee_id: Optional[str] = None,
    current_user: RBACUser = Depends(require_module_access("hr")),
    db: Session = Depends(get_db)
):
    query = db.query(PerformanceReview)
    if employee_id:
        query = query.filter(PerformanceReview.employeeId == employee_id)
    return query.order_by(PerformanceReview.createdAt.desc()).all()


@router.post("/performance/reviews", status_code=status.HTTP_201_CREATED)
async def create_performance_review(
    body: PerformanceReviewCreate,
    current_user: RBACUser = Depends(require_module_access("hr")),
    db: Session = Depends(get_db)
):
    emp = db.query(Employee).filter(Employee.id == body.employeeId).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    review = PerformanceReview(
        employeeId=body.employeeId,
        employeeName=emp.fullName,
        reviewerName=current_user.username,
        reviewPeriod=body.reviewPeriod,
        goals=body.goals,
        dueDate=body.dueDate,
        status="Pending"
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


@router.patch("/performance/reviews/{review_id}/submit")
async def submit_performance_review(
    review_id: str,
    body: PerformanceReviewSubmit,
    current_user: RBACUser = Depends(require_module_access("hr")),
    db: Session = Depends(get_db)
):
    review = db.query(PerformanceReview).filter(PerformanceReview.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    review.overallRating  = body.overallRating
    review.strengths      = body.strengths
    review.improvements   = body.improvements
    review.goals          = body.goals
    review.comments       = body.comments
    review.status         = "Completed"
    review.submittedAt    = datetime.utcnow()

    db.commit()
    db.refresh(review)
    return review


@router.get("/performance/goals")
async def list_goals(
    employee_id: Optional[str] = None,
    current_user: RBACUser = Depends(require_module_access("hr")),
    db: Session = Depends(get_db)
):
    query = db.query(PerformanceGoal)
    if employee_id:
        query = query.filter(PerformanceGoal.employeeId == employee_id)
    return query.order_by(PerformanceGoal.createdAt.desc()).all()


@router.post("/performance/goals", status_code=status.HTTP_201_CREATED)
async def create_goal(
    body: PerformanceGoalCreate,
    current_user: RBACUser = Depends(require_module_access("hr")),
    db: Session = Depends(get_db)
):
    goal = PerformanceGoal(**body.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@router.patch("/performance/goals/{goal_id}/progress")
async def update_goal_progress(
    goal_id: str,
    body: GoalProgressUpdate,
    current_user: RBACUser = Depends(require_module_access("hr")),
    db: Session = Depends(get_db)
):
    goal = db.query(PerformanceGoal).filter(PerformanceGoal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    goal.progress = body.progress
    if body.status:
        goal.status = body.status
    db.commit()
    db.refresh(goal)
    return goal


# ═══════════════════════════════════════════════════════════
# 5. ONBOARDING
# ═══════════════════════════════════════════════════════════

@router.get("/onboarding/tasks")
async def list_onboarding_tasks(
    employee_id: Optional[str] = None,
    current_user: RBACUser = Depends(require_module_access("hr")),
    db: Session = Depends(get_db)
):
    query = db.query(OnboardingTask)
    if employee_id:
        query = query.filter(OnboardingTask.employeeId == employee_id)
    return query.order_by(OnboardingTask.createdAt).all()


@router.post("/onboarding/tasks", status_code=status.HTTP_201_CREATED)
async def create_onboarding_task(
    body: OnboardingTaskCreate,
    current_user: RBACUser = Depends(require_module_access("hr")),
    db: Session = Depends(get_db)
):
    emp = db.query(Employee).filter(Employee.id == body.employeeId).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    task = OnboardingTask(
        employeeId=body.employeeId,
        employeeName=emp.fullName,
        taskName=body.taskName,
        category=body.category,
        assignedTo=body.assignedTo,
        dueDate=body.dueDate,
        status="Pending"
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    # Update checklist
    _refresh_checklist(db, body.employeeId)
    return task


@router.patch("/onboarding/tasks/{task_id}/complete")
async def complete_onboarding_task(
    task_id: str,
    current_user: RBACUser = Depends(require_module_access("hr")),
    db: Session = Depends(get_db)
):
    task = db.query(OnboardingTask).filter(OnboardingTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.status = "Completed"
    task.completedAt = datetime.utcnow()
    db.commit()

    _refresh_checklist(db, task.employeeId)
    db.refresh(task)
    return task


@router.get("/onboarding/checklists/{employee_id}")
async def get_onboarding_checklist(
    employee_id: str,
    current_user: RBACUser = Depends(require_module_access("hr")),
    db: Session = Depends(get_db)
):
    _refresh_checklist(db, employee_id)
    checklist = db.query(OnboardingChecklist).filter(OnboardingChecklist.employeeId == employee_id).first()
    tasks = db.query(OnboardingTask).filter(OnboardingTask.employeeId == employee_id).all()
    return {"checklist": checklist, "tasks": tasks}


def _refresh_checklist(db: Session, employee_id: str):
    """Recalculate onboarding checklist progress"""
    tasks = db.query(OnboardingTask).filter(OnboardingTask.employeeId == employee_id).all()
    total = len(tasks)
    completed = sum(1 for t in tasks if t.status == "Completed")
    progress = round((completed / total) * 100, 1) if total > 0 else 0.0
    overall_status = "Completed" if total > 0 and completed == total else ("In Progress" if completed > 0 else "Not Started")

    checklist = db.query(OnboardingChecklist).filter(OnboardingChecklist.employeeId == employee_id).first()
    if checklist:
        checklist.totalTasks = total
        checklist.completedTasks = completed
        checklist.progressPercent = progress
        checklist.status = overall_status
    else:
        checklist = OnboardingChecklist(
            employeeId=employee_id,
            totalTasks=total,
            completedTasks=completed,
            progressPercent=progress,
            status=overall_status
        )
        db.add(checklist)
    db.commit()


# ═══════════════════════════════════════════════════════════
# 6. ATTENDANCE
# ═══════════════════════════════════════════════════════════

@router.get("/attendance")
async def list_attendance(
    employee_id: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    current_user: RBACUser = Depends(require_module_access("hr")),
    db: Session = Depends(get_db)
):
    query = db.query(AttendanceRecord)
    if employee_id:
        query = query.filter(AttendanceRecord.employeeId == employee_id)
    if date_from:
        query = query.filter(AttendanceRecord.date >= date_from)
    if date_to:
        query = query.filter(AttendanceRecord.date <= date_to)
    return query.order_by(AttendanceRecord.date.desc()).all()


@router.post("/attendance", status_code=status.HTTP_201_CREATED)
async def mark_attendance(
    body: AttendanceCreate,
    current_user: RBACUser = Depends(require_module_access("hr")),
    db: Session = Depends(get_db)
):
    emp = db.query(Employee).filter(Employee.id == body.employeeId).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Check if already marked for this date
    existing = db.query(AttendanceRecord).filter(
        AttendanceRecord.employeeId == body.employeeId,
        AttendanceRecord.date == body.date
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Attendance already marked for this date")

    record = AttendanceRecord(
        employeeId=body.employeeId,
        employeeName=emp.fullName,
        date=body.date,
        checkIn=body.checkIn,
        checkOut=body.checkOut,
        hoursWorked=body.hoursWorked,
        status=body.status,
        notes=body.notes
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.patch("/attendance/{record_id}")
async def update_attendance(
    record_id: str,
    body: dict,
    current_user: RBACUser = Depends(require_module_access("hr")),
    db: Session = Depends(get_db)
):
    record = db.query(AttendanceRecord).filter(AttendanceRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    for field in ["checkIn", "checkOut", "hoursWorked", "status", "notes"]:
        if field in body:
            setattr(record, field, body[field])

    db.commit()
    db.refresh(record)
    return record


@router.get("/attendance/summary/{employee_id}")
async def attendance_summary(
    employee_id: str,
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: RBACUser = Depends(require_module_access("hr")),
    db: Session = Depends(get_db)
):
    now = datetime.utcnow()
    month = month or now.month
    year = year or now.year

    records = db.query(AttendanceRecord).filter(
        AttendanceRecord.employeeId == employee_id
    ).all()
    month_records = [r for r in records if r.date.month == month and r.date.year == year]

    summary = {
        "employeeId": employee_id,
        "month": month,
        "year": year,
        "totalDays": len(month_records),
        "present": sum(1 for r in month_records if r.status == "Present"),
        "absent": sum(1 for r in month_records if r.status == "Absent"),
        "late": sum(1 for r in month_records if r.status == "Late"),
        "halfDay": sum(1 for r in month_records if r.status == "Half-Day"),
        "onLeave": sum(1 for r in month_records if r.status == "On-Leave"),
        "totalHours": round(sum(r.hoursWorked or 0 for r in month_records), 2)
    }
    return summary


@router.get("/shifts")
async def list_shifts(db: Session = Depends(get_db)):
    return db.query(Shift).all()


@router.post("/shifts", status_code=status.HTTP_201_CREATED)
async def create_shift(
    body: ShiftCreate,
    current_user: RBACUser = Depends(require_module_access("hr")),
    db: Session = Depends(get_db)
):
    shift = Shift(**body.model_dump())
    db.add(shift)
    db.commit()
    db.refresh(shift)
    return shift
