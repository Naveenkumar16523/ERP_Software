from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

def generate_uuid():
    return str(uuid.uuid4())

from app.utils.db import Base

class FleetVehicle(Base):
    __tablename__ = "sc_fleet_vehicles"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    registrationNumber = Column(String(50), unique=True, index=True)
    vehicleType = Column(String(50)) # e.g. Truck, Van
    status = Column(String(50), default="Available") # Available, In Transit, Maintenance
    currentLocation = Column(String(100), nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)

class Shipment(Base):
    __tablename__ = "sc_shipments"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    trackingNumber = Column(String(100), unique=True, index=True)
    origin = Column(String(100))
    destination = Column(String(100))
    status = Column(String(50), default="Pending") # Pending, In Transit, Delivered
    eta = Column(DateTime, nullable=True)
    podSignature = Column(Text, nullable=True) # Base64 signature image
    vehicleId = Column(String(36), ForeignKey('sc_fleet_vehicles.id'), nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)

class VehicleLocation(Base):
    __tablename__ = "sc_vehicle_locations"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    vehicleId = Column(String(36), ForeignKey('sc_fleet_vehicles.id'))
    latitude = Column(String(50))
    longitude = Column(String(50))
    timestamp = Column(DateTime, default=datetime.utcnow)

class CustomsDocument(Base):
    __tablename__ = "sc_customs_documents"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    shipmentId = Column(String(36), ForeignKey('sc_shipments.id'))
    documentType = Column(String(50))
    status = Column(String(50), default="Pending") # Pending, Cleared, Rejected
    createdAt = Column(DateTime, default=datetime.utcnow)

class VehicleMaintenance(Base):
    __tablename__ = "sc_vehicle_maintenance"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    vehicleId = Column(String(36), ForeignKey('sc_fleet_vehicles.id'))
    description = Column(String(255))
    cost = Column(String(50))
    status = Column(String(50), default="Scheduled") # Scheduled, Completed
    scheduledDate = Column(DateTime)
    createdAt = Column(DateTime, default=datetime.utcnow)

