from fastapi import APIRouter, Depends, HTTPException, status, Response
from typing import List, Dict, Any
from app.utils.export import generate_excel
from app.middlewares.auth_middleware import get_current_user

router = APIRouter(prefix="/export", tags=["Export"])

@router.post("/excel")
async def export_to_excel(payload: List[Dict[str, Any]], current_user=Depends(get_current_user)):
    """
    Accepts an array of JSON objects (the filtered data from frontend)
    and returns an Excel file.
    """
    try:
        excel_bytes = generate_excel(payload)
        return Response(
            content=excel_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=export.xlsx"}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate Excel: {str(e)}"
        )
