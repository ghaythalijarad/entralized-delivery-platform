#!/usr/bin/env python3
"""
Simple server starter for testing Cognito secure session handling
Handles Python version compatibility issues
"""

import subprocess
import sys
import os

def find_python_with_packages():
    """Find a Python interpreter that has the required packages"""
    interpreters = [
        'python3.9',
        'python3.8', 
        'python3.10',
        'python3.11',
        'python3.12',
        'python',
        'python3'
    ]
    
    for interpreter in interpreters:
        try:
            # Try to import fastapi with this interpreter
            result = subprocess.run([
                interpreter, '-c', 
                'import fastapi, uvicorn, boto3, dotenv; print("OK")'
            ], capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0 and 'OK' in result.stdout:
                print(f"✅ Found working Python interpreter: {interpreter}")
                return interpreter
        except (subprocess.TimeoutExpired, FileNotFoundError):
            continue
    
    return None

def start_server():
    """Start the FastAPI server with the correct Python interpreter"""
    
    # Change to the FastAPI project directory
    project_dir = "/Users/ghaythallaheebi/centralized platform/fastapi-template"
    if not os.path.exists(project_dir):
        print(f"❌ Project directory not found: {project_dir}")
        return False
    
    os.chdir(project_dir)
    
    # Find working Python interpreter
    python_cmd = find_python_with_packages()
    if not python_cmd:
        print("❌ No Python interpreter found with required packages")
        print("Please install packages with: pip3 install fastapi uvicorn boto3 python-dotenv requests python-jose passlib")
        return False
    
    # Start the server
    print(f"🚀 Starting FastAPI server with {python_cmd}...")
    print("Server will be available at: http://localhost:8000")
    print("Test page available at: file:///Users/ghaythallaheebi/centralized%20platform/test_secure_session.html")
    print("\nPress Ctrl+C to stop the server")
    
    try:
        subprocess.run([
            python_cmd, '-m', 'uvicorn', 
            'app.main:app', 
            '--reload', 
            '--host', '0.0.0.0', 
            '--port', '8000'
        ])
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("🔧 FastAPI Server Starter for Cognito Testing")
    print("=" * 50)
    
    success = start_server()
    if not success:
        sys.exit(1)
