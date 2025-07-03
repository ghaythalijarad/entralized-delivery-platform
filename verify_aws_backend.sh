#!/bin/bash
# Final AWS Backend Verification Script

echo "🔍 AWS APP RUNNER FINAL VERIFICATION"
echo "===================================="
echo ""

AWS_URL="https://kwrtvgmnja.eu-west-1.awsapprunner.com"

echo "🌐 Testing AWS Backend: $AWS_URL"
echo ""

# Test health endpoint
echo "1. Health Check:"
HEALTH_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" $AWS_URL/health 2>/dev/null)
HTTP_STATUS=$(echo $HEALTH_RESPONSE | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)

if [ "$HTTP_STATUS" = "200" ]; then
    echo "   ✅ Health check passed"
    echo "   📊 Response: $(echo $HEALTH_RESPONSE | sed 's/HTTP_STATUS:.*//')"
else
    echo "   ❌ Health check failed (HTTP $HTTP_STATUS)"
fi
echo ""

# Test login endpoint
echo "2. Login Test:"
if [ "$HTTP_STATUS" = "200" ]; then
    LOGIN_RESPONSE=$(curl -s -X POST $AWS_URL/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"username": "admin", "password": "admin123"}' 2>/dev/null)
    
    if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
        echo "   ✅ Login successful"
        echo "   🔑 Admin user authenticated"
    else
        echo "   ❌ Login failed"
        echo "   📄 Response: $LOGIN_RESPONSE"
    fi
else
    echo "   ⏭️  Skipped (backend not ready)"
fi
echo ""

# Next steps
echo "📋 NEXT STEPS:"
echo "-------------"
if [ "$HTTP_STATUS" = "200" ]; then
    echo "🎉 AWS Backend is READY!"
    echo ""
    echo "1. Update frontend:"
    echo "   ./update_frontend_api.sh $AWS_URL"
    echo ""
    echo "2. Deploy to AWS Amplify:"
    echo "   - Visit: https://console.aws.amazon.com/amplify/"
    echo "   - Create new app from GitHub"
    echo "   - Select: entralized-delivery-platform"
    echo "   - Use amplify.yml configuration"
    echo ""
    echo "3. Test production login:"
    echo "   Username: admin"
    echo "   Password: admin123"
else
    echo "⏳ Backend still deploying..."
    echo "   - Click 'Rebuild' in AWS Console if needed"
    echo "   - Check logs in AWS App Runner console"
    echo "   - Re-run this script in 2-3 minutes"
fi
echo ""

echo "🔗 AWS Console: https://eu-west-1.console.aws.amazon.com/apprunner/"
