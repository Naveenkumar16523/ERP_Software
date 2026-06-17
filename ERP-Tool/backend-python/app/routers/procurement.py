from fastapi import APIRouter

router = APIRouter(prefix="/procurement", tags=["Procurement"])

@router.get("/")
def get_procurement():
    return {"message": "Procurement module - under construction"}
