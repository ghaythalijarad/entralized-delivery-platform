from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

class Merchant(BaseModel):
    id: Optional[str]
    name: str
    owner: str
    phone: str
    email: Optional[str]
    category: Optional[str]
    status: Optional[str] = "offline"  # online, offline
    created_at: Optional[datetime] = None

class Driver(BaseModel):
    id: Optional[str]
    name: str
    nationalId: str
    phone: str
    vehicleType: str
    status: Optional[str] = "inactive"  # active, inactive, busy
    created_at: Optional[datetime] = None

class Customer(BaseModel):
    id: Optional[str]
    name: str
    phone: str
    email: Optional[str]
    created_at: Optional[datetime] = None

class Order(BaseModel):
    id: Optional[str]
    customerId: str
    merchantId: str
    items: List[Dict]
    total: float
    status: Optional[str] = "pending"
    created_at: Optional[datetime] = None

class DashboardStats(BaseModel):
    """Dashboard statistics response schema"""
    total_orders: int
    today_orders: int
    active_merchants: int
    active_drivers: int
    total_customers: int
    pending_orders: int
    revenue_today: float
    revenue_trend: float

class ActivityItem(BaseModel):
    """Recent activity item schema"""
    type: str
    message: str
    time: str
    status: str
    timestamp: str
