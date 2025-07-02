# SQLAlchemy Models for Delivery Platform
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum

from .database import Base

# Enums for status fields
class OrderStatus(enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    CONFIRMED_BY_MERCHANT = "confirmed_by_merchant"
    SEARCHING_FOR_DRIVER = "searching_for_driver"
    DRIVER_ASSIGNED = "driver_assigned"
    PICKED_UP = "picked_up"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    REJECTED = "rejected"

class MerchantStatus(enum.Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    BUSY = "busy"

class DriverStatus(enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

class UserRole(enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    VIEWER = "viewer"

class VehicleType(enum.Enum):
    MOTORCYCLE = "motorcycle"
    CAR = "car"
    BICYCLE = "bicycle"

# Merchant Model
class Merchant(Base):
    __tablename__ = "merchants"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    owner = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False, unique=True)
    email = Column(String(255), nullable=True)
    category = Column(String(100), nullable=True)
    status = Column(Enum(MerchantStatus), default=MerchantStatus.OFFLINE)
    address = Column(Text, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    rating = Column(Float, default=0.0)
    total_orders = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    orders = relationship("Order", back_populates="merchant")

# Driver Model
class Driver(Base):
    __tablename__ = "drivers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    national_id = Column(String(20), nullable=False, unique=True)
    phone = Column(String(20), nullable=False, unique=True)
    email = Column(String(255), nullable=True)
    vehicle_type = Column(Enum(VehicleType), nullable=False)
    vehicle_plate = Column(String(20), nullable=True)
    status = Column(Enum(DriverStatus), default=DriverStatus.INACTIVE)
    current_latitude = Column(Float, nullable=True)
    current_longitude = Column(Float, nullable=True)
    rating = Column(Float, default=0.0)
    total_deliveries = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    orders = relationship("Order", back_populates="driver")

# Customer Model
class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False, unique=True)
    email = Column(String(255), nullable=True)
    default_address = Column(Text, nullable=True)
    default_latitude = Column(Float, nullable=True)
    default_longitude = Column(Float, nullable=True)
    total_orders = Column(Integer, default=0)
    loyalty_points = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    orders = relationship("Order", back_populates="customer")

# Order Model
class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), nullable=False, unique=True, index=True)
    
    # Foreign Keys
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    
    # Order Details
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING)
    total_amount = Column(Float, nullable=False)
    delivery_fee = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    final_amount = Column(Float, nullable=False)
    
    # Address Information
    delivery_address = Column(Text, nullable=False)
    delivery_latitude = Column(Float, nullable=True)
    delivery_longitude = Column(Float, nullable=True)
    
    # Timestamps
    order_time = Column(DateTime(timezone=True), server_default=func.now())
    estimated_delivery = Column(DateTime(timezone=True), nullable=True)
    confirmed_at = Column(DateTime(timezone=True), nullable=True)
    picked_up_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    
    # Additional Fields
    notes = Column(Text, nullable=True)
    priority = Column(String(20), default="normal")  # normal, urgent
    payment_method = Column(String(50), default="cash")
    payment_status = Column(String(50), default="pending")
    
    # Tracking
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    customer = relationship("Customer", back_populates="orders")
    merchant = relationship("Merchant", back_populates="orders")
    driver = relationship("Driver", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")

# Order Items Model
class OrderItem(Base):
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    
    # Item Details
    item_name = Column(String(255), nullable=False)
    item_description = Column(Text, nullable=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    
    # Additional Information
    category = Column(String(100), nullable=True)
    sku = Column(String(100), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    order = relationship("Order", back_populates="items")

# Order Status History (for tracking changes)
class OrderStatusHistory(Base):
    __tablename__ = "order_status_history"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    
    old_status = Column(Enum(OrderStatus), nullable=True)
    new_status = Column(Enum(OrderStatus), nullable=False)
    changed_by = Column(String(255), nullable=True)  # user who made the change
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# Rewards/Loyalty System
class Reward(Base):
    __tablename__ = "rewards"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    
    # Reward Details
    points_earned = Column(Integer, default=0)
    points_redeemed = Column(Integer, default=0)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    
    # Transaction Details
    transaction_type = Column(String(50), nullable=False)  # earned, redeemed
    description = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# Settings/Configuration
class SystemSetting(Base):
    __tablename__ = "system_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(255), nullable=False, unique=True)
    value = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), default="general")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

# Analytics/Reports (Optional for future use)
class DailyStats(Base):
    __tablename__ = "daily_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime(timezone=True), nullable=False, unique=True)
    
    # Order Statistics
    total_orders = Column(Integer, default=0)
    completed_orders = Column(Integer, default=0)
    cancelled_orders = Column(Integer, default=0)
    total_revenue = Column(Float, default=0.0)
    
    # User Statistics
    active_customers = Column(Integer, default=0)
    active_merchants = Column(Integer, default=0)
    active_drivers = Column(Integer, default=0)
    
    # Performance Metrics
    average_delivery_time = Column(Float, default=0.0)  # in minutes


# User Authentication and Authorization
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    
    # User Details
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.VIEWER)
    is_active = Column(Boolean, default=True)
    
    # Audit Trail
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Created by (for admin tracking)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_by = relationship("User", remote_side=[id], backref="created_users")


# User Session Management
class UserSession(Base):
    __tablename__ = "user_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token_jti = Column(String(255), nullable=False, index=True)  # JWT ID
    
    # Session Details
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_active = Column(Boolean, default=True)
    
    # Session Metadata
    ip_address = Column(String(45), nullable=True)  # IPv6 support
    user_agent = Column(Text, nullable=True)
    
    user = relationship("User", backref="sessions")
    average_order_value = Column(Float, default=0.0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
