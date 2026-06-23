from pydantic import BaseModel
from typing import Optional

class ProductBase(BaseModel):
    sku: str
    name: str
    category: str
    quantity: int = 0
    reorderLevel: int = 10
    unitPrice: float

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[int] = None
    reorderLevel: Optional[int] = None
    unitPrice: Optional[float] = None
    isActive: Optional[bool] = None

class StockTransactionBase(BaseModel):
    productId: str
    transactionType: str
    quantity: int
    notes: Optional[str] = None

class StockTransactionCreate(StockTransactionBase):
    pass

class StockTransactionUpdate(BaseModel):
    notes: Optional[str] = None
    isActive: Optional[bool] = None
