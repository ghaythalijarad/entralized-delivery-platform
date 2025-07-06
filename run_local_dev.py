#!/usr/bin/env python3
"""
Local Development Server for Centralized Delivery Platform
This script runs the FastAPI application locally with simplified authentication
"""
import os
import sys
import subprocess
import time
from pathlib import Path

# Add the fastapi-template directory to Python path
fastapi_dir = Path(__file__).parent / "fastapi-template"
sys.path.insert(0, str(fastapi_dir))

def setup_local_env():
    """Setup local environment variables"""
    os.environ.setdefault("ENVIRONMENT", "development")
    os.environ.setdefault("DEBUG", "true")
    os.environ.setdefault("DATABASE_URL", "sqlite:///./delivery_platform_local.db")
    os.environ.setdefault("SECRET_KEY", "local-dev-secret-key-2025")
    os.environ.setdefault("PORT", "8000")
    os.environ.setdefault("HOST", "0.0.0.0")
    
    # Disable Cognito for local development
    os.environ.setdefault("USE_COGNITO", "false")
    
    print("🔧 Local environment configured:")
    print(f"   Environment: {os.getenv('ENVIRONMENT')}")
    print(f"   Database: {os.getenv('DATABASE_URL')}")
    print(f"   Port: {os.getenv('PORT')}")
    print(f"   Cognito: {os.getenv('USE_COGNITO')}")
    print()

def check_dependencies():
    """Check if required dependencies are installed"""
    try:
        import fastapi
        import uvicorn
        import sqlalchemy
        print("✅ FastAPI dependencies found")
        return True
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("Installing dependencies...")
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", "-r", "fastapi-template/requirements.txt"], check=True)
            print("✅ Dependencies installed")
            return True
        except subprocess.CalledProcessError:
            print("❌ Failed to install dependencies")
            return False

def start_server():
    """Start the FastAPI development server"""
    print("🚀 Starting FastAPI development server...")
    print("📋 Server will be available at: http://localhost:8000")
    print("📋 Health check: http://localhost:8000/health")
    print("📋 API docs: http://localhost:8000/docs")
    print()
    print("Press Ctrl+C to stop the server")
    print("=" * 50)
    
    try:
        # Change to fastapi-template directory
        os.chdir("fastapi-template")
        
        # Start uvicorn server
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "app.main:app", 
            "--host", "0.0.0.0",
            "--port", "8000",
            "--reload",
            "--log-level", "info"
        ])
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {e}")

if __name__ == "__main__":
    print("🚀 Centralized Delivery Platform - Local Development Server")
    print("=" * 60)
    
    setup_local_env()
    
    if check_dependencies():
        start_server()
    else:
        print("❌ Cannot start server due to missing dependencies")
        sys.exit(1)
