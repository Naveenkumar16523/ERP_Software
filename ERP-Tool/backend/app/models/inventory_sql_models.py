from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, Text
from datetime import datetime
import uuid

from app.utils.db import Base

def generate_uuid():
    return str(uuid.uuid4())

class Warehouse(Base):
    __tablename__ = "inv_warehouses"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100))
    location = Column(String(255))
    createdAt = Column(DateTime, default=datetime.utcnow)

class StoreInventory(Base):
    __tablename__ = "inv_store_inventory"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    productId = Column(String(50), ForeignKey('store_products.id'))
    warehouseId = Column(String(36), ForeignKey('inv_warehouses.id'))
    currentStock = Column(Integer, default=0)
    reorderLevel = Column(Integer, default=10)
    barcode = Column(String(100), unique=True, index=True, nullable=True)
    costPrice = Column(Float, default=0.0)
    createdAt = Column(DateTime, default=datetime.utcnow)

class StockTransaction(Base):
    __tablename__ = "inv_stock_transactions"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    inventoryId = Column(String(36), ForeignKey('inv_store_inventory.id'))
    type = Column(String(10)) # IN or OUT
    quantity = Column(Integer)
    referenceId = Column(String(50), nullable=True) # e.g. Order ID
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class InventoryBatch(Base):
    __tablename__ = "inv_batches"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    inventoryId = Column(String(36), ForeignKey('inv_store_inventory.id'))
    batchNumber = Column(String(50), index=True)
    expiryDate = Column(DateTime, nullable=True)
    currentStock = Column(Integer)
    createdAt = Column(DateTime, default=datetime.utcnow)
