#!/usr/bin/env python3
"""
Ultra-simple startup script for AWS App Runner - Enhanced debugging
"""
import os
import sys
from pathlib import Path

print("🚀 Ultra-simple AWS App Runner startup with debugging")
print(f"📂 Working directory: {os.getcwd()}")
print(f"🐍 Python: {sys.executable}")

# List root directory contents
print(f"📁 Root contents: {list(Path('.').iterdir())}")

# Set environment
os.environ['HOST'] = '0.0.0.0'
os.environ['PORT'] = '8080'

# Navigate to fastapi-template
fastapi_dir = Path(__file__).parent / "fastapi-template"
print(f"📁 FastAPI dir path: {fastapi_dir}")
print(f"📁 FastAPI dir exists: {fastapi_dir.exists()}")

if fastapi_dir.exists():
    print(f"📁 FastAPI dir contents: {list(fastapi_dir.iterdir())}")
    
    os.chdir(fastapi_dir)
    print(f"✅ Changed to: {os.getcwd()}")
    
    # List contents for debugging
    current_contents = list(Path('.').iterdir())
    print(f"📁 Current dir contents: {current_contents}")
    
    # Check if app directory exists
    app_dir = Path('app')
    print(f"📁 App dir exists: {app_dir.exists()}")
    
    if app_dir.exists():
        print(f"📁 App dir contents: {list(app_dir.iterdir())}")
        
        # Check if main.py exists
        main_file = app_dir / "main.py"
        print(f"📄 main.py exists: {main_file.exists()}")
        
        if main_file.exists():
            # Start using os.system (most basic approach)
            cmd = f"{sys.executable} -m uvicorn app.main:app --host 0.0.0.0 --port 8080"
            print(f"🔧 Running: {cmd}")
            exit_code = os.system(cmd)
            print(f"❌ Exit code: {exit_code}")
            sys.exit(exit_code)
        else:
            print("❌ main.py not found!")
            sys.exit(1)
    else:
        print("❌ App directory not found!")
        print("🔍 Trying alternative approach...")
        
        # Try to find main.py in current directory
        if Path('main.py').exists():
            cmd = f"{sys.executable} -m uvicorn main:app --host 0.0.0.0 --port 8080"
            print(f"🔧 Running alternative: {cmd}")
            exit_code = os.system(cmd)
            sys.exit(exit_code)
        else:
            print("❌ No main.py found anywhere!")
            sys.exit(1)
else:
    print("❌ FastAPI directory not found!")
    print(f"📁 Available directories: {[d for d in Path('.').iterdir() if d.is_dir()]}")
    sys.exit(1)
