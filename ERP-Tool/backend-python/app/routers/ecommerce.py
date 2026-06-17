from fastapi import APIRouter

router = APIRouter(prefix="/ecommerce", tags=["Ecommerce"])

@router.get("/")
def get_ecommerce():
    return {"message": "Ecommerce module - under construction"}
