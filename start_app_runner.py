#!/usr/bin/env python3
"""
Simplified production startup script for AWS App Runner
"""
import os
import sys
import uvicorn
from pathlib import Path

print("🚀 Starting Centralized Delivery Platform")
print(f"Python version: {sys.version}")
print(f"Current directory: {os.getcwd()}")

# Add the fastapi-template directory to Python path
fastapi_dir = Path(__file__).parent / "fastapi-template"
sys.path.insert(0, str(fastapi_dir))

# Change to the fastapi-template directory
os.chdir(fastapi_dir)
print(f"Changed to directory: {os.getcwd()}")

# Set production environment
os.environ.setdefault('ENVIRONMENT', 'production')
os.environ.setdefault('HOST', '0.0.0.0')
os.environ.setdefault('PORT', '8080')

# Initialize database with error handling
try:
    print("📦 Importing database modules...")
    from app.database import engine
    from app.models import Base
    
    print("🗄️ Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created")
    
    # Create admin user with better error handling
    try:
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
        print(f"⚠️ Admin user creation error (continuing anyway): {e}")
        
except Exception as e:
    print(f"❌ Database setup error: {e}")
    print("Continuing with app startup...")

# Import and start the app
try:
    print("📱 Importing FastAPI app...")
    from app.main import app
    print("✅ FastAPI app imported successfully")
except Exception as e:
    print(f"❌ Failed to import app: {e}")
    sys.exit(1)

if __name__ == "__main__":
    print(f"🌐 Starting server on {os.environ.get('HOST', '0.0.0.0')}:{os.environ.get('PORT', '8080')}")
    uvicorn.run(
        app,
        host=os.environ.get('HOST', '0.0.0.0'),
        port=int(os.environ.get('PORT', 8080)),
        workers=1,
        access_log=True,
        log_level="info"
    )
