#!/usr/bin/env python3
"""
Production startup script for Centralized Delivery Platform
Handles both local SQLite and RDS PostgreSQL based on environment
"""

import os
import sys
import uvicorn
from pathlib import Path

# Add the parent directory to Python path
sys.path.append(str(Path(__file__).parent))

def setup_production_environment():
    """Configure production environment settings"""
    # Set production environment
    os.environ.setdefault('ENVIRONMENT', 'production')
    os.environ.setdefault('DEBUG', 'false')
    os.environ.setdefault('HOST', '0.0.0.0')
    os.environ.setdefault('PORT', '8080')
    
    print("🚀 Starting Centralized Delivery Platform in PRODUCTION mode")
    print("=" * 60)
    print(f"Environment: {os.environ.get('ENVIRONMENT', 'development')}")
    print(f"Debug mode: {os.environ.get('DEBUG', 'true')}")
    print(f"Host: {os.environ.get('HOST', '127.0.0.1')}")
    print(f"Port: {os.environ.get('PORT', '8080')}")
    print("=" * 60)

def setup_database():
    """Initialize database and create admin user"""
    try:
        from app.database import engine
        from app.models import Base
        
        # Create tables
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

def main():
    """Main startup function"""
    setup_production_environment()
    setup_database()
    
    # Import after environment setup
    from app.main import app
    
    # Production server configuration
    config = {
        "app": app,
        "host": os.environ.get('HOST', '0.0.0.0'),
        "port": int(os.environ.get('PORT', 8080)),
        "workers": int(os.environ.get('WORKERS', 1)),
        "access_log": True,
        "log_level": "info"
    }
    
    # Run with uvicorn
    uvicorn.run(**config)

if __name__ == "__main__":
    main()
