from fastapi import APIRouter

router = APIRouter(prefix="/crm", tags=["CRM"])

@router.get("/")
def get_crm():
    return {"message": "CRM module - under construction"}
