from math import ceil
from fastapi import HTTPException

def success(data, message="Success", meta=None):
    response = {"success": True, "data": data, "message": message}
    if meta is not None:
        response["meta"] = meta
    return response

def paginated(items, total, page, limit):
    return {
        "success": True,
        "data": items,
        "meta": {
            "total": total,
            "page": page,
            "limit": limit,
            "pages": ceil(total / limit) if limit > 0 else 0
        }
    }

def error(code, message, status_code=400):
    raise HTTPException(
        status_code=status_code,
        detail={"success": False, "error": code, "message": message}
    )
