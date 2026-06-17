from fastapi import APIRouter

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/")
def get_admin():
    return {"message": "Admin module - under construction"}
