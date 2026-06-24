from fastapi import APIRouter

router = APIRouter(prefix="/inventory", tags=["Inventory"])

@router.get("/products")
async def get_products():
    return []

@router.get("/stock-transactions")
async def get_stock_transactions():
    return []

@router.get("/batches")
async def get_batches():
    return []

@router.get("/warehouses")
async def get_warehouses():
    return []

