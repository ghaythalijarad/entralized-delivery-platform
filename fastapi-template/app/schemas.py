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
