#!/usr/bin/env python3
"""
Simplified startup script for AWS App Runner
"""
import os
import sys
import subprocess
from pathlib import Path

print("🚀 AWS App Runner - Simple startup")
print(f"📂 Current directory: {os.getcwd()}")
print(f"🐍 Python executable: {sys.executable}")
print(f"📦 Python path: {sys.path[:3]}")

# Set environment variables
os.environ.setdefault('ENVIRONMENT', 'production')
os.environ.setdefault('HOST', '0.0.0.0')
os.environ.setdefault('PORT', '8080')

# Navigate to fastapi-template directory
fastapi_dir = Path(__file__).parent / "fastapi-template"
if not fastapi_dir.exists():
    print("❌ FastAPI directory not found!")
    sys.exit(1)

os.chdir(fastapi_dir)
print(f"✅ Changed to: {os.getcwd()}")

# List directory contents for debugging
print(f"📁 Directory contents: {list(Path('.').iterdir())}")
if Path('app').exists():
    print(f"📁 App directory contents: {list(Path('app').iterdir())}")

# Start the server using uvicorn command line
try:
    print("🚀 Starting uvicorn server...")
    cmd = [
        sys.executable, "-m", "uvicorn", 
        "app.main:app",
        "--host", "0.0.0.0",
        "--port", "8080",
        "--log-level", "info"
    ]
    print(f"🔧 Command: {' '.join(cmd)}")
    subprocess.run(cmd, check=True)
except Exception as e:
    print(f"❌ Error starting server: {e}")
    sys.exit(1)
