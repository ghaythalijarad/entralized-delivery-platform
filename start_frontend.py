#!/usr/bin/env python3
"""
Simple HTTP server to serve static files for local development
"""
import http.server
import socketserver
import os
import webbrowser
import threading
import time

PORT = 3000
DIRECTORY = "."

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # Add CORS headers for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

def open_browser():
    """Open browser after a short delay"""
    time.sleep(2)
    webbrowser.open(f'http://localhost:{PORT}')

if __name__ == "__main__":
    print(f"🌐 Starting static file server on port {PORT}")
    print(f"📁 Serving files from: {os.getcwd()}")
    print(f"🔗 Frontend will be available at: http://localhost:{PORT}")
    print(f"🔗 Login page: http://localhost:{PORT}/index.html")
    print()
    print("Press Ctrl+C to stop the server")
    print("=" * 50)
    
    # Start browser in a separate thread
    browser_thread = threading.Thread(target=open_browser)
    browser_thread.daemon = True
    browser_thread.start()
    
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Static server stopped by user")
    except Exception as e:
        print(f"❌ Error starting static server: {e}")
