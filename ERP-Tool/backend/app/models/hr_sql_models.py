"""
SQLAlchemy Models for the Human Resources Module
Covers: Employee Directory, Leave Management, Recruitment,
        Performance, Onboarding, Attendance
"""
from sqlalchemy import Column, String, Float, Boolean, Integer, DateTime, Date, ForeignKey, Text, Enum
from datetime import datetime
import uuid

from app.utils.db import Base


def generate_uuid():
    return str(uuid.uuid4())


# ─── 1. EMPLOYEE DIRECTORY ──────────────────────────────────────────────────

class Employee(Base):
    __tablename__ = "hr_employees"

    id              = Column(String(36), primary_key=True, default=generate_uuid)
    employeeId      = Column(String(50), unique=True, index=True)
    fullName        = Column(String(255), index=True)
    email           = Column(String(255), unique=True, index=True)
    phone           = Column(String(50), nullable=True)
    departmentId    = Column(String(36), nullable=True)
    departmentName  = Column(String(100), nullable=True)
    designation     = Column(String(100))
    employeeType    = Column(String(50), default="Full-Time")   # Full-Time, Part-Time, Contract
    status          = Column(String(50), default="Active")       # Active, Inactive, Terminated
    dateOfJoining   = Column(Date, nullable=True)
    dateOfBirth     = Column(Date, nullable=True)
    gender          = Column(String(20), nullable=True)
    address         = Column(Text, nullable=True)
    managerId       = Column(String(36), nullable=True)
    salary          = Column(Float, nullable=True)
    avatarUrl       = Column(String(500), nullable=True)
    createdAt       = Column(DateTime, default=datetime.utcnow)
    updatedAt       = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ─── 2. LEAVE MANAGEMENT ────────────────────────────────────────────────────

class LeaveType(Base):
    __tablename__ = "hr_leave_types"

    id              = Column(String(36), primary_key=True, default=generate_uuid)
    name            = Column(String(100))          # Annual, Sick, Maternity, etc.
    totalDays       = Column(Integer, default=0)
    description     = Column(Text, nullable=True)
    createdAt       = Column(DateTime, default=datetime.utcnow)


class LeaveRequest(Base):
    __tablename__ = "hr_leave_requests"

    id              = Column(String(36), primary_key=True, default=generate_uuid)
    employeeId      = Column(String(36), ForeignKey("hr_employees.id"))
    employeeName    = Column(String(255))
    leaveTypeId     = Column(String(36), ForeignKey("hr_leave_types.id"), nullable=True)
    leaveTypeName   = Column(String(100))
    startDate       = Column(Date)
    endDate         = Column(Date)
    totalDays       = Column(Integer)
    reason          = Column(Text, nullable=True)
    status          = Column(String(50), default="Pending")  # Pending, Approved, Rejected
    reviewedBy      = Column(String(255), nullable=True)
    reviewedAt      = Column(DateTime, nullable=True)
    reviewNote      = Column(Text, nullable=True)
    createdAt       = Column(DateTime, default=datetime.utcnow)


class LeaveBalance(Base):
    __tablename__ = "hr_leave_balances"

    id              = Column(String(36), primary_key=True, default=generate_uuid)
    employeeId      = Column(String(36), ForeignKey("hr_employees.id"))
    leaveTypeId     = Column(String(36), ForeignKey("hr_leave_types.id"))
    year            = Column(Integer)
    entitled        = Column(Integer, default=0)
    used            = Column(Integer, default=0)
    remaining       = Column(Integer, default=0)


# ─── 3. RECRUITMENT ─────────────────────────────────────────────────────────

class JobPosting(Base):
    __tablename__ = "hr_job_postings"

    id              = Column(String(36), primary_key=True, default=generate_uuid)
    title           = Column(String(255))
    departmentId    = Column(String(36), nullable=True)
    departmentName  = Column(String(100))
    location        = Column(String(255))
    jobType         = Column(String(50), default="Full-Time")
    experienceLevel = Column(String(50), nullable=True)
    description     = Column(Text, nullable=True)
    requirements    = Column(Text, nullable=True)
    salaryMin       = Column(Float, nullable=True)
    salaryMax       = Column(Float, nullable=True)
    status          = Column(String(50), default="Open")  # Open, Closed, On-Hold
    openings        = Column(Integer, default=1)
    deadline        = Column(Date, nullable=True)
    createdAt       = Column(DateTime, default=datetime.utcnow)


class JobApplication(Base):
    __tablename__ = "hr_job_applications"

    id              = Column(String(36), primary_key=True, default=generate_uuid)
    jobPostingId    = Column(String(36), ForeignKey("hr_job_postings.id"))
    applicantName   = Column(String(255))
    email           = Column(String(255))
    phone           = Column(String(50), nullable=True)
    resumeUrl       = Column(String(500), nullable=True)
    coverLetter     = Column(Text, nullable=True)
    currentStage    = Column(String(100), default="Applied")  # Applied, Screening, Interview, Offer, Hired, Rejected
    rating          = Column(Integer, nullable=True)       # 1-5 star rating
    notes           = Column(Text, nullable=True)
    createdAt       = Column(DateTime, default=datetime.utcnow)
    updatedAt       = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ─── 4. PERFORMANCE MANAGEMENT ──────────────────────────────────────────────

class PerformanceReview(Base):
    __tablename__ = "hr_performance_reviews"

    id              = Column(String(36), primary_key=True, default=generate_uuid)
    employeeId      = Column(String(36), ForeignKey("hr_employees.id"))
    employeeName    = Column(String(255))
    reviewerId      = Column(String(36), nullable=True)
    reviewerName    = Column(String(255), nullable=True)
    reviewPeriod    = Column(String(100))   # e.g. "Q1 2025", "Annual 2024"
    overallRating   = Column(Float, nullable=True)  # e.g. 4.2 out of 5
    strengths       = Column(Text, nullable=True)
    improvements    = Column(Text, nullable=True)
    goals           = Column(Text, nullable=True)
    comments        = Column(Text, nullable=True)
    status          = Column(String(50), default="Pending")  # Pending, In Progress, Completed
    dueDate         = Column(Date, nullable=True)
    submittedAt     = Column(DateTime, nullable=True)
    createdAt       = Column(DateTime, default=datetime.utcnow)


class PerformanceGoal(Base):
    __tablename__ = "hr_performance_goals"

    id              = Column(String(36), primary_key=True, default=generate_uuid)
    employeeId      = Column(String(36), ForeignKey("hr_employees.id"))
    title           = Column(String(255))
    description     = Column(Text, nullable=True)
    targetDate      = Column(Date, nullable=True)
    progress        = Column(Integer, default=0)    # 0-100 percent
    status          = Column(String(50), default="In Progress")   # Not Started, In Progress, Completed
    createdAt       = Column(DateTime, default=datetime.utcnow)


# ─── 5. ONBOARDING ──────────────────────────────────────────────────────────

class OnboardingTask(Base):
    __tablename__ = "hr_onboarding_tasks"

    id              = Column(String(36), primary_key=True, default=generate_uuid)
    employeeId      = Column(String(36), ForeignKey("hr_employees.id"))
    employeeName    = Column(String(255))
    taskName        = Column(String(255))
    category        = Column(String(100))   # Documentation, IT Setup, Training, etc.
    assignedTo      = Column(String(255), nullable=True)
    dueDate         = Column(Date, nullable=True)
    status          = Column(String(50), default="Pending")  # Pending, In Progress, Completed
    notes           = Column(Text, nullable=True)
    completedAt     = Column(DateTime, nullable=True)
    createdAt       = Column(DateTime, default=datetime.utcnow)


class OnboardingChecklist(Base):
    __tablename__ = "hr_onboarding_checklists"

    id              = Column(String(36), primary_key=True, default=generate_uuid)
    employeeId      = Column(String(36), ForeignKey("hr_employees.id"))
    totalTasks      = Column(Integer, default=0)
    completedTasks  = Column(Integer, default=0)
    progressPercent = Column(Float, default=0.0)
    status          = Column(String(50), default="In Progress")   # Not Started, In Progress, Completed
    startDate       = Column(Date, nullable=True)
    targetDate      = Column(Date, nullable=True)
    createdAt       = Column(DateTime, default=datetime.utcnow)


# ─── 6. ATTENDANCE ──────────────────────────────────────────────────────────

class AttendanceRecord(Base):
    __tablename__ = "hr_attendance"

    id              = Column(String(36), primary_key=True, default=generate_uuid)
    employeeId      = Column(String(36), ForeignKey("hr_employees.id"))
    employeeName    = Column(String(255))
    date            = Column(Date, index=True)
    checkIn         = Column(String(20), nullable=True)   # e.g. "09:05 AM"
    checkOut        = Column(String(20), nullable=True)
    hoursWorked     = Column(Float, nullable=True)
    status          = Column(String(50), default="Present")  # Present, Absent, Late, Half-Day, On-Leave
    notes           = Column(Text, nullable=True)
    createdAt       = Column(DateTime, default=datetime.utcnow)


class Shift(Base):
    __tablename__ = "hr_shifts"

    id              = Column(String(36), primary_key=True, default=generate_uuid)
    name            = Column(String(100))   # Morning, Evening, Night
    startTime       = Column(String(20))
    endTime         = Column(String(20))
    hoursPerDay     = Column(Float, default=8.0)
    createdAt       = Column(DateTime, default=datetime.utcnow)
