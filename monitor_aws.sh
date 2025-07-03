#!/bin/bash
# Monitor AWS App Runner deployment

URL="https://kwrtvgmnja.eu-west-1.awsapprunner.com"
echo "🔍 Monitoring AWS App Runner deployment..."
echo "URL: $URL"
echo ""

while true; do
    echo -n "$(date '+%H:%M:%S') - Testing... "
    
    RESPONSE=$(curl -s -w "HTTP_%{http_code}" "$URL/health" 2>/dev/null)
    HTTP_CODE=$(echo $RESPONSE | grep -o "HTTP_[0-9]*" | cut -d_ -f2)
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ SUCCESS!"
        echo ""
        echo "🎉 AWS Backend is LIVE!"
        echo "📊 Health: $(echo $RESPONSE | sed 's/HTTP_.*//')"
        echo ""
        
        # Test login
        echo "🔐 Testing login..."
        LOGIN_RESPONSE=$(curl -s -X POST "$URL/api/auth/login" \
            -H "Content-Type: application/json" \
            -d '{"username": "admin", "password": "admin123"}')
        
        if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
            echo "✅ Login working!"
            echo ""
            echo "🚀 READY FOR FRONTEND UPDATE!"
            echo "Run: ./update_frontend_api.sh $URL"
        else
            echo "❌ Login failed"
        fi
        break
    else
        echo "❌ Not ready (HTTP $HTTP_CODE)"
    fi
    
    sleep 30
done
