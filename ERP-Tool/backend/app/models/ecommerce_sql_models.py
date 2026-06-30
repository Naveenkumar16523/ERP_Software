from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, JSON
from datetime import datetime
from app.utils.db import Base

class StoreProduct(Base):
    __tablename__ = "store_products"

    id = Column(String(50), primary_key=True)
    sku = Column(String(50), unique=True, index=True)
    name = Column(String(100), index=True)
    description = Column(String(255))
    category = Column(String(50))
    price = Column(Float, default=0.0)
    salePrice = Column(Float, nullable=True)
    stock = Column(Integer, default=0)
    loyaltyPts = Column(Integer, default=0)
    isPublished = Column(Boolean, default=True)
    createdAt = Column(DateTime, default=datetime.utcnow)


class CustomerOrder(Base):
    __tablename__ = "customer_orders"

    id = Column(String(50), primary_key=True)
    orderNo = Column(String(50), unique=True, index=True)
    customerName = Column(String(100))
    customerEmail = Column(String(100))
    totalAmount = Column(Float, default=0.0)
    discountAmount = Column(Float, default=0.0)
    loyaltyRedeemed = Column(Integer, default=0)
    shippingAddress = Column(JSON, nullable=True)
    status = Column(String(50), default="PLACED")
    createdAt = Column(DateTime, default=datetime.utcnow)


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(String(50), primary_key=True)
    orderId = Column(String(50), ForeignKey("customer_orders.id"))
    productId = Column(String(50), ForeignKey("store_products.id"))
    quantity = Column(Integer, default=1)
    unitPrice = Column(Float, default=0.0)
    totalPrice = Column(Float, default=0.0)
    createdAt = Column(DateTime, default=datetime.utcnow)


class LoyaltyAccount(Base):
    __tablename__ = "loyalty_accounts"

    id = Column(String(50), primary_key=True)
    customerEmail = Column(String(100), unique=True, index=True)
    customerName = Column(String(100))
    points = Column(Integer, default=0)
    tier = Column(String(50), default="BRONZE")
    createdAt = Column(DateTime, default=datetime.utcnow)
