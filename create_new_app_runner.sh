#!/bin/bash
# Quick script to create a new AWS App Runner service

echo "🚀 AWS App Runner - Quick Deployment Script"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "apprunner.yaml" ]; then
    echo "❌ apprunner.yaml not found in current directory"
    echo "   Make sure you're in the project root directory"
    exit 1
fi

echo "✅ Found apprunner.yaml"

# Check if all required files exist
REQUIRED_FILES=("start_app_runner.py" "requirements.txt" "fastapi-template/app/main.py")

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Required file missing: $file"
        exit 1
    fi
    echo "✅ Found $file"
done

echo ""
echo "📋 Pre-deployment Checklist:"
echo "1. AWS CLI configured with appropriate permissions"
echo "2. GitHub repository updated with latest code"
echo "3. apprunner.yaml configuration reviewed"
echo "4. Local testing completed"

echo ""
read -p "Continue with deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 1
fi

echo ""
echo "🔧 Step 1: Committing latest changes to GitHub..."
git add .
git commit -m "Prepare for new App Runner deployment - $(date)"
git push origin main

echo ""
echo "📱 Step 2: Now go to AWS Console and:"
echo "   1. Navigate to AWS App Runner service"
echo "   2. Click 'Create service'"
echo "   3. Choose 'Source code repository'"
echo "   4. Connect your GitHub repository"
echo "   5. Select this repository and main branch"
echo "   6. Choose 'Use configuration file' (apprunner.yaml)"
echo "   7. Service name: centralized-delivery-platform-v2"
echo "   8. Click 'Create & deploy'"

echo ""
echo "⏱️  Deployment will take 5-15 minutes"
echo "📊 Monitor progress in AWS Console > App Runner > Services"

echo ""
echo "🎯 After deployment completes:"
echo "   1. Test health endpoint: https://your-new-url.awsapprunner.com/health"
echo "   2. Update frontend: ./update_frontend_api.sh https://your-new-url.awsapprunner.com"
echo "   3. Test login with admin/admin123"

echo ""
echo "🔗 Useful AWS CLI commands (optional):"
echo "   aws apprunner list-services"
echo "   aws apprunner describe-service --service-arn YOUR_SERVICE_ARN"

echo ""
echo "✅ Ready for deployment!"
