from fastapi import APIRouter, Depends
from app.utils.base_router import create_module_router
from app.models.models import Employee, Leave
from app.schemas.hr import EmployeeCreate, EmployeeUpdate, LeaveCreate, LeaveUpdate
from typing import Dict, Any

# Create the standard CRUD routers for Employee and Leave
employee_router = create_module_router(
    module_name="employees",
    model=Employee,
    create_schema=EmployeeCreate,
    update_schema=EmployeeUpdate,
    response_schema=Dict[str, Any]
)

leave_router = create_module_router(
    module_name="leaves",
    model=Leave,
    create_schema=LeaveCreate,
    update_schema=LeaveUpdate,
    response_schema=Dict[str, Any]
)

# Main HR Router
router = APIRouter(prefix="/hr")
router.include_router(employee_router)
router.include_router(leave_router)

# Add any custom HR endpoints below if necessary
