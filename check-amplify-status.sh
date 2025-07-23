#!/bin/bash

echo "🔍 Amplify Deployment Status Check"
echo "=================================="
echo ""

AMPLIFY_URL="https://main.d2ina1trm0zag3.amplifyapp.com"
echo "🌐 Checking Amplify deployment at: $AMPLIFY_URL"
echo ""

# Check if the main page is accessible
echo "📋 Testing main landing page..."
if curl -s --head "$AMPLIFY_URL" | head -n 1 | grep -q "200 OK"; then
    echo "✅ Main page is accessible"
else
    echo "❌ Main page is not accessible"
fi

echo ""

# Test key pages
PAGES=(
    "pages/platform-demo.html"
    "pages/customer-app.html" 
    "pages/merchant-app.html"
    "pages/order-management.html"
    "login-aws-native.html"
)

echo "📋 Testing key platform pages..."
for page in "${PAGES[@]}"; do
    echo -n "Testing $page... "
    if curl -s --head "$AMPLIFY_URL/$page" | head -n 1 | grep -q "200 OK"; then
        echo "✅"
    else
        echo "❌"
    fi
done

echo ""

# Check if CSS/JS resources load
echo "📋 Testing external resources..."
echo -n "Bootstrap CSS... "
if curl -s --head "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" | head -n 1 | grep -q "200 OK"; then
    echo "✅"
else
    echo "❌"
fi

echo -n "Font Awesome... "
if curl -s --head "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" | head -n 1 | grep -q "200 OK"; then
    echo "✅"
else
    echo "❌"
fi

echo ""

echo "🚀 Amplify Console Links:"
echo "Main Console: https://console.aws.amazon.com/amplify/home#/d2ina1trm0zag3"
echo "Build Logs: https://console.aws.amazon.com/amplify/home#/d2ina1trm0zag3/YnJhbmNoZXM/main"
echo ""

echo "🎯 Platform URLs:"
echo "Main: $AMPLIFY_URL"
echo "Platform Demo: $AMPLIFY_URL/pages/platform-demo.html"
echo "Customer App: $AMPLIFY_URL/pages/customer-app.html"
echo "Merchant App: $AMPLIFY_URL/pages/merchant-app.html"
echo "Admin Dashboard: $AMPLIFY_URL/pages/order-management.html"
echo ""

echo "⏰ Note: If pages return 404, wait 2-3 minutes for deployment to complete"
