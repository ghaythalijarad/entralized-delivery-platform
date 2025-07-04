import sys
import os

# Set up the path for the app module
sys.path.insert(0, os.path.dirname(__file__))

# Import the FastAPI app
from app.main import app
from mangum import Mangum

# AWS Lambda handler for FastAPI via Mangum
handler = Mangum(app)
