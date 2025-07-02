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

def main():
    """Main startup function"""
    setup_production_environment()
    
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
