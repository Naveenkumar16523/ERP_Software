from fastapi import APIRouter
from app.utils.base_router import create_module_router
from app.models.models import Lead, Deal, Contact
from app.schemas.crm import LeadCreate, LeadUpdate, DealCreate, DealUpdate, ContactCreate, ContactUpdate
from typing import Dict, Any

lead_router = create_module_router(
    module_name="leads",
    model=Lead,
    create_schema=LeadCreate,
    update_schema=LeadUpdate,
    response_schema=Dict[str, Any]
)

deal_router = create_module_router(
    module_name="deals",
    model=Deal,
    create_schema=DealCreate,
    update_schema=DealUpdate,
    response_schema=Dict[str, Any]
)

contact_router = create_module_router(
    module_name="contacts",
    model=Contact,
    create_schema=ContactCreate,
    update_schema=ContactUpdate,
    response_schema=Dict[str, Any]
)

router = APIRouter(prefix="/crm")
router.include_router(lead_router)
router.include_router(deal_router)
router.include_router(contact_router)
