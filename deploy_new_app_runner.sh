#!/bin/bash
# AWS CLI-based App Runner deployment

echo "🚀 AWS App Runner - CLI Deployment"
echo "=================================="

# Check AWS CLI is installed and configured
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install AWS CLI first"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI not configured. Run 'aws configure' first"
    exit 1
fi

echo "✅ AWS CLI configured"

# Ensure latest code is pushed
echo "📤 Pushing latest code to GitHub..."
git add .
git commit -m "Deploy new App Runner service - $(date)" || echo "No changes to commit"
git push origin main

echo ""
echo "🚀 Creating new App Runner service..."

# Create the service
SERVICE_ARN=$(aws apprunner create-service \
    --cli-input-json file://apprunner-config.json \
    --query 'Service.ServiceArn' \
    --output text)

if [ $? -eq 0 ]; then
    echo "✅ App Runner service created successfully!"
    echo "🔗 Service ARN: $SERVICE_ARN"
    
    # Get service URL
    echo "⏳ Waiting for service to be created..."
    sleep 10
    
    SERVICE_URL=$(aws apprunner describe-service \
        --service-arn "$SERVICE_ARN" \
        --query 'Service.ServiceUrl' \
        --output text)
    
    echo "🌐 Service URL: https://$SERVICE_URL"
    
    echo ""
    echo "📊 Monitoring deployment status..."
    echo "   Use: aws apprunner describe-service --service-arn $SERVICE_ARN"
    
    echo ""
    echo "⏱️  Deployment typically takes 5-15 minutes"
    echo "🎯 Once ready, test: https://$SERVICE_URL/health"
    echo "🔧 Update frontend: ./update_frontend_api.sh https://$SERVICE_URL"
    
else
    echo "❌ Failed to create App Runner service"
    echo "Check your AWS permissions and try again"
    exit 1
fi
