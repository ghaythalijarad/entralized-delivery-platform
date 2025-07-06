#!/usr/bin/env python3
"""
Local development server for the Centralized Delivery Platform
Run this script to start the FastAPI server locally
"""

import os
import sys
import uvicorn
from pathlib import Path

# Add the app directory to Python path
current_dir = Path(__file__).parent
app_dir = current_dir / "fastapi-template"
sys.path.insert(0, str(app_dir))

def main():
    print("🚀 Starting Centralized Delivery Platform - Local Development Server")
    print("=" * 60)
    
    # Set environment variables for local development
    os.environ["ENVIRONMENT"] = "development"
    os.environ["DEBUG"] = "true"
    os.environ["SECRET_KEY"] = "dev-secret-key-local-testing"
    
    # Database configuration - Use local SQLite for development
    os.environ["DATABASE_URL"] = "sqlite:///./delivery_platform_local.db"
    
    # For testing purposes, we'll use mock Cognito if not configured
    if not os.getenv("COGNITO_USER_POOL_ID"):
        print("⚠️  Cognito not configured - using local authentication")
        os.environ["USE_LOCAL_AUTH"] = "true"
    
    print(f"🌐 Environment: {os.getenv('ENVIRONMENT')}")
    print(f"🗄️  Database: {os.getenv('DATABASE_URL')}")
    print(f"🔐 Authentication: {'Local' if os.getenv('USE_LOCAL_AUTH') else 'AWS Cognito'}")
    print("=" * 60)
    print()
    print("📋 Server will be available at:")
    print("   ├── Main App: http://localhost:8000")
    print("   ├── Health Check: http://localhost:8000/health")
    print("   ├── API Docs: http://localhost:8000/docs")
    print("   └── Login: http://localhost:8000/index.html")
    print()
    print("📱 Demo Credentials:")
    print("   ├── Username: admin")
    print("   └── Password: admin123")
    print()
    print("🛑 Press Ctrl+C to stop the server")
    print("=" * 60)
    
    try:
        # Import the FastAPI app
        from app.main import app
        
        # Configure uvicorn to serve static files
        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info",
            access_log=True
        )
        
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
