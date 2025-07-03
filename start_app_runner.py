#!/usr/bin/env python3
"""
Minimal production startup script for AWS App Runner with detailed debugging
"""
import os
import sys
import uvicorn
from pathlib import Path

print("🚀 AWS App Runner startup - Debugging mode")
print(f"🐍 Python version: {sys.version}")
print(f"📂 Current directory: {os.getcwd()}")
print(f"📝 Environment variables: PORT={os.environ.get('PORT', 'not set')}")

# Set environment variables
os.environ.setdefault('ENVIRONMENT', 'production')
os.environ.setdefault('HOST', '0.0.0.0') 
os.environ.setdefault('PORT', '8080')

# Check directory structure
print("📁 Directory structure:")
for item in os.listdir('.'):
    print(f"  - {item}")

# Add fastapi-template to path and change directory
fastapi_dir = Path(__file__).parent / "fastapi-template"
print(f"📁 FastAPI directory path: {fastapi_dir}")
print(f"📁 FastAPI directory exists: {fastapi_dir.exists()}")

if fastapi_dir.exists():
    print("📁 Contents of fastapi-template:")
    for item in os.listdir(fastapi_dir):
        print(f"  - {item}")
    
    sys.path.insert(0, str(fastapi_dir))
    os.chdir(fastapi_dir)
    print(f"✅ Changed working directory to: {os.getcwd()}")
    
    # Check app directory
    app_dir = Path("app")
    if app_dir.exists():
        print("📁 Contents of app directory:")
        for item in os.listdir(app_dir):
            print(f"  - {item}")
    else:
        print("❌ app directory not found!")
else:
    print("❌ FastAPI directory not found!")
    sys.exit(1)

# Simple database setup
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

# Try importing FastAPI app with detailed error reporting
print("🚀 Attempting to import FastAPI application...")
try:
    from app.main import app
    print("✅ Successfully imported FastAPI app")
    print(f"📱 App type: {type(app)}")
    
    # Check if app has routes
    if hasattr(app, 'routes'):
        print(f"🛣️ Number of routes: {len(app.routes)}")
        for route in app.routes[:5]:  # Show first 5 routes
            print(f"  - {route}")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("🔍 Checking available modules...")
    
    # Check what's available in app directory
    try:
        import app
        print(f"✅ app module found at: {app.__file__}")
        print(f"📂 app module contents: {dir(app)}")
    except ImportError:
        print("❌ Cannot import app module")
    
    # Check for main.py specifically
    if os.path.exists("app/main.py"):
        print("✅ app/main.py file exists")
        with open("app/main.py", "r") as f:
            content = f.read()[:500]  # First 500 chars
            print(f"📄 main.py content preview:\n{content}")
    else:
        print("❌ app/main.py file not found")
    
    sys.exit(1)
    
except Exception as e:
    print(f"❌ Unexpected error importing app: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Start the server
print(f"🌐 Starting uvicorn server on {os.environ.get('HOST')}:{os.environ.get('PORT')}")
try:
    uvicorn.run(
        app,
        host=os.environ.get('HOST', '0.0.0.0'),
        port=int(os.environ.get('PORT', 8080)),
        workers=1,
        log_level="info"
    )
except Exception as e:
    print(f"❌ Failed to start uvicorn server: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
