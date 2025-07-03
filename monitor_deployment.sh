#!/bin/bash
# Monitor AWS App Runner deployment status

echo "🚀 MONITORING AWS APP RUNNER DEPLOYMENT"
echo "========================================"
echo ""

AWS_URL="https://ff201cf70ebb4a2085b0d8655f59798e.eu-west-1.awsapprunner.com"
TIMEOUT=300  # 5 minutes timeout
INTERVAL=10  # Check every 10 seconds
elapsed=0

echo "📍 Service URL: $AWS_URL"
echo "⏱️  Checking every $INTERVAL seconds (timeout: ${TIMEOUT}s)"
echo ""

while [ $elapsed -lt $TIMEOUT ]; do
    echo -n "[$elapsed/${TIMEOUT}s] Testing connection... "
    
    # Test the health endpoint
    response=$(curl -s -w "HTTP_STATUS:%{http_code}" "$AWS_URL/health" 2>/dev/null)
    http_status=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
    
    if [ "$http_status" = "200" ]; then
        echo "✅ SUCCESS!"
        echo ""
        echo "🎉 AWS App Runner service is now running!"
        echo "📱 Testing login endpoint..."
        
        # Test login
        login_response=$(curl -s -X POST "$AWS_URL/api/auth/login" \
            -H "Content-Type: application/json" \
            -d '{"username": "admin", "password": "admin123"}')
        
        if echo "$login_response" | grep -q '"success":true'; then
            echo "✅ Login endpoint working!"
            echo ""
            echo "🚀 DEPLOYMENT SUCCESSFUL!"
            echo "================================"
            echo "Service URL: $AWS_URL"
            echo "Status: Running"
            echo "Login: admin / admin123"
            echo ""
            echo "📋 Next steps:"
            echo "1. Update frontend API configuration:"
            echo "   ./update_frontend_api.sh $AWS_URL"
            echo ""
            echo "2. Deploy frontend to AWS Amplify"
            break
        else
            echo "⚠️  Service running but login not working yet"
        fi
    elif [ "$http_status" = "000" ]; then
        echo "⏳ Still deploying..."
    else
        echo "❌ HTTP $http_status"
    fi
    
    sleep $INTERVAL
    elapsed=$((elapsed + INTERVAL))
done

if [ $elapsed -ge $TIMEOUT ]; then
    echo ""
    echo "⏰ Timeout reached after ${TIMEOUT} seconds"
    echo "🔍 Check AWS Console for deployment logs:"
    echo "   https://eu-west-1.console.aws.amazon.com/apprunner/"
fi
