"""
Minimal Lambda handler for FastAPI application
This handler delays FastAPI initialization until first request
"""
import json
import os
from typing import Dict, Any

# Global variable to store the FastAPI app once initialized
_app = None
_handler = None

def get_app():
    """Lazy initialization of FastAPI app"""
    global _app, _handler
    if _app is None:
        # Import FastAPI app only when needed
        from app.main import app
        from mangum import Mangum
        
        # Configure Mangum with the API base path to match the /api prefix
        base_path = os.environ.get("ROOT_PATH", "")
        _handler = Mangum(app, lifespan="off", api_gateway_base_path=base_path)
        _app = app
    
    return _handler

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    AWS Lambda handler that lazily initializes FastAPI
    """
    try:
        # Get the FastAPI handler (initializes on first call)
        handler = get_app()
        
        # Process the request
        return handler(event, context)
    
    except Exception as e:
        # Return a proper error response
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": json.dumps({
                "error": "Internal Server Error",
                "message": str(e)
            })
        }
