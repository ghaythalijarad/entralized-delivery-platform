#!/usr/bin/env python3
"""
Simple production startup script for AWS App Runner
"""
import os
import sys
import uvicorn
from pathlib import Path

# Add the fastapi-template directory to Python path
fastapi_dir = Path(__file__).parent / "fastapi-template"
sys.path.insert(0, str(fastapi_dir))

# Change to the fastapi-template directory
os.chdir(fastapi_dir)

# Set production environment
os.environ.setdefault('ENVIRONMENT', 'production')
os.environ.setdefault('DEBUG', 'false')
os.environ.setdefault('HOST', '0.0.0.0')
os.environ.setdefault('PORT', '8080')

print("🚀 Starting Centralized Delivery Platform in PRODUCTION mode")
print(f"Working directory: {os.getcwd()}")
print(f"Port: {os.environ.get('PORT', '8080')}")

# Initialize database
try:
    from app.database import engine
    from app.models import Base
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created")
    
    # Create admin user
    from app.database import get_db
    from app.auth import create_user, UserCreate, UserRole, get_user_by_username
    
    db = next(get_db())
    if not get_user_by_username(db, 'admin'):
        admin = UserCreate(
            username='admin',
            email='admin@delivery-platform.com', 
            password='admin123',
            role=UserRole.ADMIN,
            full_name='System Administrator'
        )
        create_user(db, admin)
        print("✅ Admin user created")
    else:
        print("✅ Admin user already exists")
    db.close()
except Exception as e:
    print(f"Database setup error: {e}")

# Import and start the app
from app.main import app

if __name__ == "__main__":
    uvicorn.run(
        app,
        host=os.environ.get('HOST', '0.0.0.0'),
        port=int(os.environ.get('PORT', 8080)),
        workers=1,
        access_log=True,
        log_level="info"
    )
