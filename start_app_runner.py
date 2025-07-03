#!/usr/bin/env python3
"""
Direct startup script for AWS App Runner - Fixed import paths
"""
import os
import sys
import uvicorn
from pathlib import Path

print("🚀 AWS App Runner - Fixed startup")
print(f"📂 Current directory: {os.getcwd()}")

# Set environment variables
os.environ.setdefault('ENVIRONMENT', 'production')
os.environ.setdefault('HOST', '0.0.0.0')
os.environ.setdefault('PORT', '8080')

# Add fastapi-template to Python path and change to that directory
fastapi_dir = Path(__file__).parent / "fastapi-template"
if fastapi_dir.exists():
    sys.path.insert(0, str(fastapi_dir))
    os.chdir(fastapi_dir)
    print(f"✅ Changed to: {os.getcwd()}")
    print(f"✅ Added {fastapi_dir} to Python path")
else:
    print("❌ FastAPI directory not found!")
    sys.exit(1)

# Simple database setup (optional - won't crash if it fails)
try:
    print("🗄️ Setting up database...")
    from app.database import engine
    from app.models import Base
    Base.metadata.create_all(bind=engine)
    print("✅ Database initialized")
    
    # Try to create admin user (optional)
    try:
        from app.database import get_db
        from app.auth import create_user, UserCreate, UserRole, get_user_by_username
        
        db = next(get_db())
        if not get_user_by_username(db, 'admin'):
            admin = UserCreate(
                username='admin',
                email='admin@platform.com',
                password='admin123',
                role=UserRole.ADMIN,
                full_name='Administrator'
            )
            create_user(db, admin)
            print("✅ Admin user created")
        db.close()
    except Exception as e:
        print(f"⚠️ Admin user setup warning: {e}")
        
except Exception as e:
    print(f"⚠️ Database setup warning: {e}")

# Import and start the FastAPI app
try:
    print("🚀 Importing FastAPI app...")
    from app.main import app
    print("✅ App imported successfully")
    
    print(f"🌐 Starting server on {os.environ.get('HOST')}:{os.environ.get('PORT')}")
    uvicorn.run(
        app,
        host=os.environ.get('HOST', '0.0.0.0'),
        port=int(os.environ.get('PORT', 8080)),
        log_level="info"
    )
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
