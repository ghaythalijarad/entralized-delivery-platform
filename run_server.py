import http.server
import socketserver
import webbrowser
import os

# Change to the directory containing the static files
os.chdir("fastapi-template/static")

PORT = 8000
Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Server running at http://localhost:{PORT}")
    print(f"Admin panel: http://localhost:{PORT}/admin.html")
    
    # Automatically open browser
    webbrowser.open(f'http://localhost:{PORT}/admin.html')
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        httpd.shutdown()
