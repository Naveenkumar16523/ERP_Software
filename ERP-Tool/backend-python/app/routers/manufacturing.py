from fastapi import APIRouter

router = APIRouter(prefix="/manufacturing", tags=["Manufacturing"])

@router.get("/")
def get_manufacturing():
    return {"message": "Manufacturing module - under construction"}
