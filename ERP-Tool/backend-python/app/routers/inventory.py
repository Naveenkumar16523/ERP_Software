from fastapi import APIRouter

router = APIRouter(prefix="/inventory", tags=["Inventory"])

@router.get("/")
def get_inventory():
    return {"message": "Inventory module - under construction"}
