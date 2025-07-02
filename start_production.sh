#!/bin/bash
# Production startup script for AWS Amplify
# This script starts the FastAPI server in production mode

set -e

echo "🚀 Starting Centralized Delivery Platform in Production"
echo "======================================================="

cd fastapi-template

# Set production environment
export ENVIRONMENT=production
export DEBUG=false
export HOST=0.0.0.0
export PORT=8080

# Show configuration
echo "📊 Production Configuration:"
echo "Environment: $ENVIRONMENT"
echo "Debug: $DEBUG" 
echo "Host: $HOST"
echo "Port: $PORT"
echo ""

# Start the FastAPI server
echo "🌟 Starting FastAPI server..."
python3 -m uvicorn app.main:app \
    --host $HOST \
    --port $PORT \
    --workers 1 \
    --access-log \
    --log-level info
