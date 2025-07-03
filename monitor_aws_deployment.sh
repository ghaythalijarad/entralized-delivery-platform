#!/bin/bash
# Monitor AWS App Runner deployment and auto-update frontend

AWS_URL="https://kwrtvgmnja.eu-west-1.awsapprunner.com"
WORKSPACE="/Users/ghaythallaheebi/centralized platform"

echo "🔍 Monitoring AWS App Runner deployment..."
echo "Service URL: $AWS_URL"
echo "Starting monitoring loop..."
echo ""

# Counter for attempts
attempts=0
max_attempts=30  # 15 minutes max

while [ $attempts -lt $max_attempts ]; do
    echo "Attempt $((attempts + 1))/$max_attempts - Testing service..."
    
    # Test health endpoint
    response=$(curl -s -w "HTTP_CODE:%{http_code}" "$AWS_URL/health" 2>/dev/null)
    http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
    
    if [ "$http_code" = "200" ]; then
        echo "🎉 SUCCESS! AWS backend is ready!"
        echo "Response: $(echo "$response" | sed 's/HTTP_CODE:[0-9]*//')"
        echo ""
        
        # Test login endpoint
        echo "🔐 Testing login endpoint..."
        login_response=$(curl -s -X POST "$AWS_URL/api/auth/login" \
            -H "Content-Type: application/json" \
            -d '{"username": "admin", "password": "admin123"}')
        
        if echo "$login_response" | grep -q '"success":true'; then
            echo "✅ Login endpoint working!"
            echo ""
            
            # Update frontend automatically
            echo "🔧 Updating frontend configuration..."
            cd "$WORKSPACE"
            ./update_frontend_api.sh "$AWS_URL"
            
            echo ""
            echo "🚀 DEPLOYMENT COMPLETE!"
            echo "✅ Backend: $AWS_URL"
            echo "✅ Login: admin/admin123"
            echo ""
            echo "📱 Next steps:"
            echo "1. Deploy frontend to AWS Amplify"
            echo "2. Test production login"
            echo "3. Update admin password"
            
            exit 0
        else
            echo "⚠️  Backend responding but login failed"
            echo "Response: $login_response"
        fi
    else
        echo "❌ Service not ready (HTTP: $http_code)"
    fi
    
    attempts=$((attempts + 1))
    
    if [ $attempts -lt $max_attempts ]; then
        echo "⏳ Waiting 30 seconds before next check..."
        sleep 30
    fi
done

echo ""
echo "🚫 Deployment monitoring timed out after $((max_attempts * 30 / 60)) minutes"
echo "Check AWS Console for deployment status:"
echo "https://eu-west-1.console.aws.amazon.com/apprunner/"
