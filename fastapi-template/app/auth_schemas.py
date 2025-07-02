"""
Authentication Schemas for API requests and responses
"""

from pydantic import BaseModel, EmailStr, validator
from datetime import datetime
from typing import Optional
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    VIEWER = "viewer"

# Authentication Requests
class UserLogin(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: UserRole
    full_name: str
    
    @validator('username')
    def username_alphanumeric(cls, v):
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Username must be alphanumeric (with optional - or _)')
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters')
        return v
    
    @validator('password')
    def password_strength(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str
    
    @validator('new_password')
    def password_strength(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v

# Authentication Responses
class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    full_name: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user: UserResponse

class LoginResponse(BaseModel):
    success: bool
    message: str
    token: Optional[Token] = None

# User Management
class UserListResponse(BaseModel):
    users: list[UserResponse]
    total: int
    page: int
    per_page: int

class CreateUserResponse(BaseModel):
    success: bool
    message: str
    user: Optional[UserResponse] = None

# Role permissions mapping
ROLE_PERMISSIONS = {
    UserRole.ADMIN: [
        "users:create",
        "users:read", 
        "users:update",
        "users:delete",
        "orders:read",
        "orders:update",
        "merchants:read",
        "merchants:update",
        "drivers:read", 
        "drivers:update",
        "customers:read",
        "analytics:read",
        "settings:read",
        "settings:update"
    ],
    UserRole.MANAGER: [
        "users:read",
        "orders:read",
        "orders:update", 
        "merchants:read",
        "merchants:update",
        "drivers:read",
        "drivers:update",
        "customers:read",
        "analytics:read"
    ],
    UserRole.VIEWER: [
        "orders:read",
        "merchants:read", 
        "drivers:read",
        "customers:read",
        "analytics:read"
    ]
}

def has_permission(user_role: str, permission: str) -> bool:
    """Check if a user role has a specific permission"""
    role_enum = UserRole(user_role)
    return permission in ROLE_PERMISSIONS.get(role_enum, [])
