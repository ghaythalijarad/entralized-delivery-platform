#!/bin/bash

# AWS Production Deployment Script
# Centralized Delivery Platform

echo "🚀 Starting production deployment to AWS..."

# Environment setup
export ENVIRONMENT=production
export DEBUG=false

# Check if we're in the right directory
if [ ! -f "amplify.yml" ]; then
    echo "❌ Error: amplify.yml not found. Please run from project root."
    exit 1
fi

echo "📋 Pre-deployment checklist:"

# 1. Check Python version
PYTHON_VERSION=$(python3 --version)
echo "✅ Python version: $PYTHON_VERSION"

# 2. Check if virtual environment exists
if [ -d "delivery_env" ]; then
    echo "✅ Virtual environment found"
    source delivery_env/bin/activate
else
    echo "⚠️ Virtual environment not found, creating..."
    python3 -m venv delivery_env
    source delivery_env/bin/activate
fi

# 3. Install production dependencies
echo "📦 Installing production dependencies..."
pip install -r requirements_production.txt

# 4. Test local build
echo "🧪 Testing local production build..."
cd fastapi-template

# Run database initialization
python3 -c "
import sys
sys.path.append('.')
from app.database import init_database, check_database_connection
init_database()
print('✅ Database initialized')
"

# Test server start
echo "🌐 Testing server startup..."
timeout 10s python3 production_server.py &
SERVER_PID=$!
sleep 5

# Test endpoints
curl -f http://localhost:8080/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Health endpoint working"
else
    echo "⚠️ Health endpoint test failed"
fi

# Stop test server
kill $SERVER_PID 2>/dev/null

cd ..

echo ""
echo "🎯 Ready for AWS deployment!"
echo ""
echo "Next steps:"
echo "1. 📂 Push to GitHub:"
echo "   git add ."
echo "   git commit -m 'Production-ready AWS deployment'"
echo "   git push origin main"
echo ""
echo "2. 🌐 Configure AWS Amplify:"
echo "   - Go to https://console.aws.amazon.com/amplify/"
echo "   - Connect your GitHub repository"
echo "   - Use the amplify.yml configuration"
echo "   - Deploy!"
echo ""
echo "3. 🔗 Your app will be available at:"
echo "   https://[your-app-id].amplifyapp.com"
echo ""
echo "✨ Deployment script completed successfully!"
