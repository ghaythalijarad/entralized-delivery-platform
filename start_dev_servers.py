#!/usr/bin/env python3
"""
Simple HTTP server for serving static files
This serves the frontend files while the FastAPI backend runs separately
"""

import http.server
import socketserver
import os
import sys
import webbrowser
import threading
import time
from pathlib import Path

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

def start_static_server(port=3000):
    """Start the static file server"""
    print(f"🌐 Starting static file server on port {port}")
    print(f"📁 Serving files from: {os.getcwd()}")
    
    with socketserver.TCPServer(("", port), CORSHTTPRequestHandler) as httpd:
        print(f"✅ Static server running at http://localhost:{port}")
        httpd.serve_forever()

def main():
    print("🚀 Centralized Delivery Platform - Development Setup")
    print("=" * 55)
    print()
    print("This will start two servers:")
    print("1. 🌐 Static File Server (Frontend) - Port 3000")
    print("2. 🔧 FastAPI Backend Server - Port 8000")
    print()
    
    # Change to the project directory
    project_dir = Path(__file__).parent
    os.chdir(project_dir)
    
    print("📋 Available endpoints:")
    print("   ├── Frontend: http://localhost:3000")
    print("   ├── Login Page: http://localhost:3000/index.html")
    print("   ├── Dashboard: http://localhost:3000/dashboard.html")
    print("   ├── Backend API: http://localhost:8000")
    print("   ├── API Health: http://localhost:8000/health")
    print("   └── API Docs: http://localhost:8000/docs")
    print()
    
    try:
        # Start static server in a thread
        static_thread = threading.Thread(
            target=start_static_server, 
            args=(3000,), 
            daemon=True
        )
        static_thread.start()
        
        # Give the static server time to start
        time.sleep(1)
        
        print("🎯 Opening browser...")
        webbrowser.open("http://localhost:3000")
        
        print()
        print("Now start the backend server by running:")
        print("python run_local_server.py")
        print()
        print("🛑 Press Ctrl+C to stop the static server")
        print("=" * 55)
        
        # Keep the main thread alive
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n🛑 Static server stopped")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
