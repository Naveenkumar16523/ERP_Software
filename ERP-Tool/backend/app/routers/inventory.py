from fastapi import APIRouter
from app.utils.base_router import create_module_router
from app.models.models import Product, StockTransaction
from app.schemas.inventory import ProductCreate, ProductUpdate, StockTransactionCreate, StockTransactionUpdate
from typing import Dict, Any

product_router = create_module_router(
    module_name="products",
    model=Product,
    create_schema=ProductCreate,
    update_schema=ProductUpdate,
    response_schema=Dict[str, Any]
)

stock_router = create_module_router(
    module_name="stock-transactions",
    model=StockTransaction,
    create_schema=StockTransactionCreate,
    update_schema=StockTransactionUpdate,
    response_schema=Dict[str, Any]
)

router = APIRouter(prefix="/inventory")
router.include_router(product_router)
router.include_router(stock_router)
