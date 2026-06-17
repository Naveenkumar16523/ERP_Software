from fastapi import Query

def get_pagination(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page")
):
    return {
        "page": page,
        "limit": limit,
        "offset": (page - 1) * limit
    }
