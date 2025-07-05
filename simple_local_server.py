#!/usr/bin/env python3
"""
Simple Local Development Server for Testing
This bypasses complex imports and focuses on basic FastAPI functionality
"""
import os
import sys
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from datetime import datetime
import uvicorn

# Simple FastAPI app for local testing
app = FastAPI(title="Centralized Delivery Platform - Local Dev")

# Add CORS middleware for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "timestamp": datetime.now().isoformat(),
        "environment": "local_development",
        "message": "Local FastAPI server is running"
    }

# Simple login endpoint for local testing
@app.post("/auth/login")
async def login(request_data: dict):
    username = request_data.get("username")
    password = request_data.get("password")
    
    # Simple demo authentication
    if username == "admin" and password == "admin123":
        return {
            "success": True,
            "message": "Local login successful",
            "token": {
                "access_token": "local-demo-token",
                "id_token": "local-demo-id-token",
                "expires_in": 3600,
                "token_type": "Bearer",
                "user": {
                    "username": "admin",
                    "groups": ["admin"]
                }
            }
        }
    else:
        raise HTTPException(
            status_code=401, 
            detail="Invalid credentials (use admin/admin123 for local dev)"
        )

# Simple dashboard endpoint
@app.get("/dashboard")
async def dashboard():
    return {
        "message": "Dashboard endpoint working",
        "data": {
            "total_orders": 42,
            "active_drivers": 8,
            "total_merchants": 15
        }
    }

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Centralized Delivery Platform API - Local Development"}

# Mount static files from parent directory
static_path = os.path.join(os.path.dirname(__file__))
if os.path.exists(static_path):
    @app.get("/index.html")
    async def serve_index():
        return FileResponse(os.path.join(static_path, "index.html"))
    
    @app.get("/dashboard.html")
    async def serve_dashboard():
        return FileResponse(os.path.join(static_path, "dashboard.html"))

if __name__ == "__main__":
    print("🚀 Starting Local Development Server")
    print("=" * 50)
    print("📋 Server: http://localhost:8002")
    print("📋 Health: http://localhost:8002/health")
    print("📋 Login: POST http://localhost:8002/auth/login")
    print("📋 Demo credentials: admin / admin123")
    print("=" * 50)
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8002, 
        reload=True,
        log_level="info"
    )
