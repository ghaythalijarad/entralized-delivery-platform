from pydantic import BaseModel
from typing import Optional, List, Dict

class Merchant(BaseModel):
    id: Optional[str]
    name: str
    owner: str
    phone: str
    email: Optional[str]
    category: Optional[str]

class Driver(BaseModel):
    id: Optional[str]
    name: str
    nationalId: str
    phone: str
    vehicleType: str

class Customer(BaseModel):
    id: Optional[str]
    name: str
    phone: str
    email: Optional[str]

class Order(BaseModel):
    id: Optional[str]
    customerId: str
    merchantId: str
    items: List[Dict]
    total: float
    status: Optional[str] = "pending"
