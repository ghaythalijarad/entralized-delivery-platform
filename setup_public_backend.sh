#!/bin/bash
# Quick Public Backend Setup using ngrok

echo "🌐 SETTING UP PUBLIC BACKEND ACCESS"
echo "=================================="
echo ""

# Check if local backend is running
echo "1. Checking local backend..."
if curl -s http://localhost:8000/health >/dev/null 2>&1; then
    echo "   ✅ Local backend is running"
else
    echo "   ❌ Local backend not running"
    echo "   Starting backend..."
    cd "/Users/ghaythallaheebi/centralized platform/fastapi-template"
    python start_production.py &
    sleep 3
    
    if curl -s http://localhost:8000/health >/dev/null 2>&1; then
        echo "   ✅ Backend started successfully"
    else
        echo "   ❌ Failed to start backend"
        exit 1
    fi
fi

echo ""
echo "2. Creating public tunnel with ngrok..."
echo "   💡 This will make your backend accessible from anywhere"
echo "   🔗 Perfect for testing frontend deployment"
echo ""

# Start ngrok tunnel
echo "   Starting ngrok tunnel..."
ngrok http 8000 --log=stdout --log-level=info > ngrok.log 2>&1 &
NGROK_PID=$!

# Wait for ngrok to start
sleep 5

# Get the public URL
PUBLIC_URL=$(curl -s http://localhost:4040/api/tunnels | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    tunnel = data['tunnels'][0]['public_url']
    print(tunnel)
except:
    print('ERROR')
")

if [ "$PUBLIC_URL" = "ERROR" ] || [ -z "$PUBLIC_URL" ]; then
    echo "   ❌ Failed to get ngrok URL"
    echo "   Check ngrok.log for details"
    exit 1
fi

echo "   ✅ Public tunnel created!"
echo "   🌐 Public URL: $PUBLIC_URL"
echo ""

# Test the public backend
echo "3. Testing public backend..."
HEALTH_RESPONSE=$(curl -s "$PUBLIC_URL/health" 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "   ✅ Public backend is working"
    echo "   📊 Health: $HEALTH_RESPONSE"
else
    echo "   ❌ Public backend test failed"
fi

echo ""
echo "4. Testing login..."
LOGIN_RESPONSE=$(curl -s -X POST "$PUBLIC_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username": "admin", "password": "admin123"}' 2>/dev/null)

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    echo "   ✅ Login working on public backend"
else
    echo "   ❌ Login test failed"
fi

echo ""
echo "🎯 NEXT STEPS:"
echo "============="
echo "1. Update frontend to use public backend:"
echo "   ./update_frontend_api.sh $PUBLIC_URL"
echo ""
echo "2. Deploy frontend to AWS Amplify or any static hosting"
echo ""
echo "3. Test your complete application!"
echo ""
echo "⚠️  IMPORTANT:"
echo "   - Keep this terminal open to maintain the tunnel"
echo "   - Public URL will change if you restart ngrok"
echo "   - For production, use the AWS App Runner service"
echo ""
echo "🔗 ngrok Web Interface: http://localhost:4040"
echo "🔗 Your Public Backend: $PUBLIC_URL"

# Save the URL for later use
echo "$PUBLIC_URL" > .ngrok_url

echo ""
echo "📝 Public URL saved to .ngrok_url"
echo "✅ Your backend is now publicly accessible!"
