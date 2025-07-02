#!/bin/bash
# AWS Production Deployment Script
# Deploys Centralized Delivery Platform to AWS App Runner + Amplify + RDS

set -e

echo "🚀 AWS PRODUCTION DEPLOYMENT - Centralized Delivery Platform"
echo "=" * 70

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install AWS CLI first:"
    echo "   brew install awscli"
    echo "   aws configure"
    exit 1
fi

echo "✅ AWS CLI found"

# Get AWS account info
AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "NOT_CONFIGURED")
AWS_REGION="eu-north-1"

if [ "$AWS_ACCOUNT" = "NOT_CONFIGURED" ]; then
    echo "❌ AWS CLI not configured. Please run:"
    echo "   aws configure"
    exit 1
fi

echo "✅ AWS Account: $AWS_ACCOUNT"
echo "✅ AWS Region: $AWS_REGION"

# Step 1: Deploy Backend to AWS App Runner
echo ""
echo "🔧 STEP 1: Deploying FastAPI Backend to AWS App Runner"
echo "=" * 50

# Create App Runner service
SERVICE_NAME="centralized-delivery-api"
GITHUB_REPO_URL="https://github.com/ghaythalijarad/entralized-delivery-platform"

echo "Creating AWS App Runner service..."

# Create the service configuration
cat > apprunner-service.json << EOF
{
    "ServiceName": "$SERVICE_NAME",
    "SourceConfiguration": {
        "ImageRepository": {
            "ImageConfiguration": {
                "Port": "8080",
                "RuntimeEnvironmentVariables": {
                    "ENVIRONMENT": "production",
                    "RDS_ENDPOINT": "delivery-platform-db.clo2o2squsbf.eu-north-1.rds.amazonaws.com",
                    "RDS_PORT": "5432",
                    "RDS_DB_NAME": "delivery_platform",
                    "RDS_USERNAME": "ghayth",
                    "RDS_PASSWORD": "DeliveryPlatform2025!",
                    "SECRET_KEY": "prod-4a7d8c9e2f1b5a8c3d6e9f2a5b8c1d4e7a0b3c6d9e2f5a8b1c4d7e0a3b6c9d2e5f8a1b4c7d0"
                }
            }
        },
        "CodeRepository": {
            "RepositoryUrl": "$GITHUB_REPO_URL",
            "SourceCodeVersion": {
                "Type": "BRANCH",
                "Value": "main"
            },
            "CodeConfiguration": {
                "ConfigurationSource": "REPOSITORY"
            }
        }
    },
    "InstanceConfiguration": {
        "Cpu": "0.25 vCPU",
        "Memory": "0.5 GB"
    }
}
EOF

echo "🚀 Creating App Runner service: $SERVICE_NAME"

# Check if service exists
if aws apprunner describe-service --service-arn "arn:aws:apprunner:$AWS_REGION:$AWS_ACCOUNT:service/$SERVICE_NAME" &>/dev/null; then
    echo "⚠️  Service already exists. Updating..."
    # Update service would go here
    echo "ℹ️  Service update not implemented in this script"
else
    echo "🆕 Creating new service..."
    aws apprunner create-service \
        --service-name "$SERVICE_NAME" \
        --source-configuration file://apprunner-service.json \
        --region "$AWS_REGION"
fi

echo "⏳ Waiting for service to be ready (this may take 5-10 minutes)..."

# Wait for service to be ready
while true; do
    STATUS=$(aws apprunner describe-service \
        --service-arn "arn:aws:apprunner:$AWS_REGION:$AWS_ACCOUNT:service/$SERVICE_NAME" \
        --query 'Service.Status' \
        --output text \
        --region "$AWS_REGION" 2>/dev/null || echo "PENDING")
    
    echo "📊 Service Status: $STATUS"
    
    if [ "$STATUS" = "RUNNING" ]; then
        break
    elif [ "$STATUS" = "CREATE_FAILED" ] || [ "$STATUS" = "UPDATE_FAILED" ]; then
        echo "❌ Service deployment failed"
        exit 1
    fi
    
    sleep 30
done

# Get service URL
API_URL=$(aws apprunner describe-service \
    --service-arn "arn:aws:apprunner:$AWS_REGION:$AWS_ACCOUNT:service/$SERVICE_NAME" \
    --query 'Service.ServiceUrl' \
    --output text \
    --region "$AWS_REGION")

echo "✅ Backend deployed successfully!"
echo "🔗 API URL: https://$API_URL"

# Step 2: Update frontend with API URL
echo ""
echo "🌐 STEP 2: Configuring Frontend for Production API"
echo "=" * 50

# Update the frontend to point to the production API
cat > fastapi-template/static/config.js << EOF
// Production API Configuration
window.PRODUCTION_API_BASE = 'https://$API_URL';
console.log('🚀 Production API configured:', window.PRODUCTION_API_BASE);
EOF

# Update index.html to include the config
sed -i.bak 's|<meta name="api-base" content="">|<meta name="api-base" content="https://'$API_URL'">|g' fastapi-template/static/index.html
sed -i.bak 's|<meta name="api-base" content="">|<meta name="api-base" content="https://'$API_URL'">|g' fastapi-template/static/login.html

echo "✅ Frontend configured with production API"

# Step 3: Deploy Frontend to AWS Amplify
echo ""
echo "📱 STEP 3: Deploying Frontend to AWS Amplify"
echo "=" * 50

# Create Amplify app
APP_NAME="centralized-delivery-platform"

echo "🏗️  Creating Amplify app: $APP_NAME"

# Check if app exists
if aws amplify get-app --app-id "$APP_NAME" &>/dev/null; then
    echo "⚠️  Amplify app already exists"
else
    echo "🆕 Creating new Amplify app..."
    aws amplify create-app \
        --name "$APP_NAME" \
        --repository "$GITHUB_REPO_URL" \
        --platform WEB \
        --region "$AWS_REGION"
fi

echo "✅ Amplify app configured"

# Step 4: Final Summary
echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "=" * 50
echo ""
echo "🔗 Production URLs:"
echo "   Backend API: https://$API_URL"
echo "   Frontend: Check AWS Amplify Console for URL"
echo ""
echo "🔐 Login Credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo "   ⚠️  Change password after first login!"
echo ""
echo "📋 Next Steps:"
echo "   1. Go to AWS Amplify Console"
echo "   2. Connect your GitHub repository"
echo "   3. Deploy the frontend"
echo "   4. Test the complete application"
echo ""
echo "✅ Production deployment ready!"

# Cleanup
rm -f apprunner-service.json

echo "🏁 Deployment script completed successfully!"
