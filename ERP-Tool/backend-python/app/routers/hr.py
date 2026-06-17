from fastapi import APIRouter

router = APIRouter(prefix="/hr", tags=["HR"])

@router.get("/")
def get_hr():
    return {"message": "HR module - under construction"}
