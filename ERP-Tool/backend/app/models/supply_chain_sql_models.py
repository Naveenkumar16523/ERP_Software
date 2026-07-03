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
    tripId = Column(String(36), ForeignKey('sc_trips.id'), nullable=True)
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


class Driver(Base):
    __tablename__ = "sc_drivers"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100))
    licenseNumber = Column(String(50), unique=True, index=True)
    licenseExpiryDate = Column(DateTime)
    phone = Column(String(20))
    assignedVehicleId = Column(String(36), ForeignKey('sc_fleet_vehicles.id'), nullable=True)
    status = Column(String(50), default="Available") # Available, On Duty, Inactive
    createdAt = Column(DateTime, default=datetime.utcnow)

class DriverDutyLog(Base):
    __tablename__ = "sc_driver_duty_logs"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    driverId = Column(String(36), ForeignKey('sc_drivers.id'))
    startTime = Column(DateTime)
    endTime = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)

class Trip(Base):
    __tablename__ = "sc_trips"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    vehicleId = Column(String(36), ForeignKey('sc_fleet_vehicles.id'))
    driverId = Column(String(36), ForeignKey('sc_drivers.id'))
    origin = Column(String(100))
    destination = Column(String(100))
    plannedRoute = Column(Text, nullable=True)
    startTime = Column(DateTime, nullable=True)
    endTime = Column(DateTime, nullable=True)
    distance = Column(String(50), nullable=True) # Storing as string to handle formats, or could be Float
    fuelCost = Column(String(50), nullable=True)
    status = Column(String(50), default="Planned") # Planned, In Progress, Completed, Cancelled
    createdAt = Column(DateTime, default=datetime.utcnow)

class LorryReceipt(Base):
    __tablename__ = "sc_lorry_receipts"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    lrNumber = Column(String(50), unique=True, index=True)
    consignor = Column(String(255))
    consignee = Column(String(255))
    goodsDescription = Column(Text)
    weight = Column(String(50))
    freightTerms = Column(String(50)) # e.g. TO PAY, PAID
    amount = Column(String(50), nullable=True)
    status = Column(String(50), default="ISSUED") # DRAFT, ISSUED, DELIVERED
    tripId = Column(String(36), ForeignKey('sc_trips.id'), nullable=True)
    shipmentId = Column(String(36), ForeignKey('sc_shipments.id'), nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
