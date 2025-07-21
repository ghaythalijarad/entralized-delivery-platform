#!/bin/bash

# Quick Deployment Status Checker
echo "🚀 Checking Git-based Deployment Status"
echo "======================================="

# Check current commit
echo "📝 Latest commit:"
git log --oneline -1

echo ""
echo "🌐 GitHub Repository:"
git remote get-url origin

echo ""
echo "📊 Deployment URLs to check:"
echo "1. Amplify Console: https://us-east-1.console.aws.amazon.com/amplify/home?region=us-east-1#/d2ina1trm0zag3"
echo "2. Live Site: https://d1ihimsuwuyezz.cloudfront.net"
echo "3. Test Suite: https://d1ihimsuwuyezz.cloudfront.net/auth-test-live.html"

echo ""
echo "✅ Next Steps:"
echo "1. Check Amplify Console for deployment progress"
echo "2. Monitor build logs for any errors"
echo "3. Test the live site once deployment completes"
echo "4. Verify authentication with test credentials:"
echo "   Email: g87_a@yahoo.com"
echo "   Password: Password123!"

echo ""
echo "🔄 Deployment should be processing now..."
