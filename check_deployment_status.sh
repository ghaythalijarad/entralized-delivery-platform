#!/bin/bash
# Quick deployment status checker

echo "🚀 AWS DEPLOYMENT STATUS CHECKER"
echo "================================"
echo ""

echo "📋 Service Details:"
echo "   Service Name: entralized-delivery-api"
echo "   Region: eu-west-1 (Ireland)"
echo "   ARN: arn:aws:apprunner:eu-west-1:109804294167:service/entralized-delivery-api/ff201cf70ebb4a2085b0d8655f59798e"
echo ""

echo "🔍 Expected Service URL Format:"
echo "   https://ff201cf70ebb4a2085b0d8655f59798e.eu-west-1.awsapprunner.com"
echo ""

echo "📝 Next Steps:"
echo "   1. ✅ Backend: Wait for App Runner status = 'Running'"
echo "   2. 🔧 Update: Run update script with service URL"
echo "   3. 📱 Frontend: Deploy to AWS Amplify"
echo "   4. 🎯 Test: Login with admin/admin123"
echo ""

echo "💡 When your App Runner service is ready:"
echo "   ./update_frontend_api.sh https://YOUR_SERVICE_URL"
echo ""

echo "🌐 AWS Consoles:"
echo "   App Runner: https://eu-west-1.console.aws.amazon.com/apprunner/"
echo "   Amplify: https://console.aws.amazon.com/amplify/"
echo ""

if [ -n "$1" ]; then
    echo "🔧 Testing service URL: $1"
    curl -s "$1/health" | head -10
fi
