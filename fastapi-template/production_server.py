#!/usr/bin/env python3
"""
Production startup script for AWS deployment
"""
import os
import uvicorn
from app.main import app
from app.config import config

def main():
    # Set production environment
    os.environ["ENVIRONMENT"] = "production"
    
    # Production server configuration
    uvicorn_config = {
        "app": "app.main:app",
        "host": "0.0.0.0",
        "port": int(os.getenv("PORT", 8080)),
        "workers": int(os.getenv("WORKERS", 1)),
        "log_level": config.LOG_LEVEL.lower(),
        "access_log": True,
        "use_colors": False,
        "loop": "auto",
        "http": "auto",
    }
    
    # For development, add reload
    if config.ENVIRONMENT == "development":
        uvicorn_config["reload"] = True
        uvicorn_config["reload_dirs"] = ["app"]
    
    print(f"🚀 Starting {config.PROJECT_NAME} v{config.VERSION}")
    print(f"🌍 Environment: {config.ENVIRONMENT}")
    print(f"🔗 Host: {uvicorn_config['host']}:{uvicorn_config['port']}")
    print(f"👥 Workers: {uvicorn_config['workers']}")
    
    # Start the server
    uvicorn.run(**uvicorn_config)

if __name__ == "__main__":
    main()
