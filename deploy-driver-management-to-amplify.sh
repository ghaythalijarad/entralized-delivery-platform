#!/bin/bash

# Driver Management System - AWS Amplify Deployment Script
# Deploys the complete driver management system with AWS Lambda backend to AWS Amplify

set -e

# Configuration
APP_NAME="driver-management-system"
REGION="${1:-us-east-1}"
ENVIRONMENT="${2:-dev}"
BRANCH="${3:-main}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deploying Driver Management System to AWS Amplify${NC}"
echo -e "${BLUE}===============================================${NC}"
echo -e "App Name: ${YELLOW}${APP_NAME}${NC}"
echo -e "Region: ${YELLOW}${REGION}${NC}"
echo -e "Environment: ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "Branch: ${YELLOW}${BRANCH}${NC}"
echo ""

# Check prerequisites
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install AWS CLI first.${NC}"
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git not found. Please install Git first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Prepare deployment files
echo -e "${BLUE}📦 Preparing deployment files...${NC}"

# Create a deployment-ready directory structure
mkdir -p deployment/dist
cp -r src/* deployment/dist/
cp -r assets/* deployment/dist/ 2>/dev/null || echo "No assets directory found"

# Create main index.html that redirects to driver management
cat > deployment/dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Driver Management System</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #2196F3 0%, #21CBF3 100%);
            color: white;
            text-align: center;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.1);
            padding: 40px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        h1 { margin-bottom: 20px; font-size: 2.5em; }
        p { font-size: 1.2em; margin: 20px 0; }
        .links {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        .link-card {
            background: rgba(255, 255, 255, 0.2);
            padding: 20px;
            border-radius: 10px;
            text-decoration: none;
            color: white;
            transition: transform 0.3s ease;
        }
        .link-card:hover {
            transform: translateY(-5px);
            background: rgba(255, 255, 255, 0.3);
        }
        .auto-redirect {
            font-size: 0.9em;
            opacity: 0.8;
            margin-top: 30px;
        }
    </style>
    <meta http-equiv="refresh" content="3; url=pages/drivers-management.html">
</head>
<body>
    <div class="container">
        <h1>🚗 Driver Management System</h1>
        <p>AWS Lambda-powered driver application management platform</p>
        
        <div class="links">
            <a href="pages/drivers-management.html" class="link-card">
                <h3>🎛️ Driver Dashboard</h3>
                <p>Manage driver applications, approve and monitor</p>
            </a>
            <a href="pages/dashboard.html" class="link-card">
                <h3>📊 General Dashboard</h3>
                <p>Platform overview and analytics</p>
            </a>
        </div>
        
        <div class="auto-redirect">
            <p>Automatically redirecting to Driver Dashboard in 3 seconds...</p>
            <p>Or click any link above to navigate manually</p>
        </div>
    </div>
</body>
</html>
EOF

echo -e "${GREEN}✅ Deployment files prepared${NC}"

# Check if this is a git repository
if [ ! -d ".git" ]; then
    echo -e "${BLUE}📁 Initializing Git repository...${NC}"
    git init
    git add .
    git commit -m "Initial commit: Driver Management System with AWS Lambda backend"
    echo -e "${GREEN}✅ Git repository initialized${NC}"
else
    echo -e "${BLUE}📁 Adding changes to Git...${NC}"
    git add .
    git status
    
    # Check if there are changes to commit
    if ! git diff --cached --quiet; then
        git commit -m "Deploy: Driver Management System with AWS Lambda backend integration"
        echo -e "${GREEN}✅ Changes committed${NC}"
    else
        echo -e "${YELLOW}⚠️  No changes to commit${NC}"
    fi
fi

# Use existing Amplify app
echo -e "${BLUE}🔍 Using existing Amplify app...${NC}"

APP_ID="d26nn5u6blbq6z"
echo -e "${GREEN}✅ Using existing Amplify app: ${APP_ID}${NC}"

# Update app description for driver management
echo -e "${BLUE}📝 Updating app description for driver management...${NC}"
aws amplify update-app \
    --app-id $APP_ID \
    --name "centralized-platform-driver-management" \
    --description "Centralized Platform - Driver Management System with AWS Lambda backend" \
    --platform WEB \
    --region $REGION \
    --output json > /dev/null

echo -e "${GREEN}✅ App description updated${NC}"

# Check if branch exists
echo -e "${BLUE}🌿 Setting up branch...${NC}"

EXISTING_BRANCH=$(aws amplify list-branches \
    --app-id $APP_ID \
    --region $REGION \
    --query "branches[?branchName=='$BRANCH'].branchName" \
    --output text 2>/dev/null || echo "")

if [ -z "$EXISTING_BRANCH" ] || [ "$EXISTING_BRANCH" = "None" ]; then
    echo -e "${BLUE}🌱 Creating new branch...${NC}"
    
    aws amplify create-branch \
        --app-id $APP_ID \
        --branch-name $BRANCH \
        --description "Driver management system with AWS Lambda backend deployment" \
        --environment-variables NODE_ENV=production,DRIVER_API_MODE=production,BACKEND_TYPE=aws-lambda \
        --enable-auto-build \
        --region $REGION
    
    echo -e "${GREEN}✅ Created branch: ${BRANCH}${NC}"
else
    echo -e "${GREEN}✅ Using existing branch: ${BRANCH}${NC}"
fi

# Update environment variables for driver management
echo -e "${BLUE}⚙️  Updating environment variables for driver management...${NC}"

aws amplify update-branch \
    --app-id $APP_ID \
    --branch-name $BRANCH \
    --environment-variables NODE_ENV=production,SYSTEM_TYPE=driver-management,DRIVER_API_MODE=production,BACKEND_TYPE=aws-lambda,BUILD_ENV=amplify \
    --region $REGION

echo -e "${GREEN}✅ Environment variables updated${NC}"

# Start deployment
echo -e "${BLUE}🚀 Starting deployment...${NC}"

# Create a deployment (this assumes code is pushed to repository)
DEPLOYMENT_RESULT=$(aws amplify start-job \
    --app-id $APP_ID \
    --branch-name $BRANCH \
    --job-type RELEASE \
    --region $REGION \
    --output json)

JOB_ID=$(echo $DEPLOYMENT_RESULT | jq -r '.jobSummary.jobId')

echo -e "${YELLOW}⏳ Deployment started with Job ID: ${JOB_ID}${NC}"
echo -e "${YELLOW}⏳ Waiting for deployment to complete...${NC}"

# Wait for deployment to complete
while true; do
    STATUS=$(aws amplify get-job \
        --app-id $APP_ID \
        --branch-name $BRANCH \
        --job-id $JOB_ID \
        --region $REGION \
        --query 'job.summary.status' \
        --output text)
    
    case $STATUS in
        "SUCCEED")
            echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
            break
            ;;
        "FAILED")
            echo -e "${RED}❌ Deployment failed!${NC}"
            aws amplify get-job \
                --app-id $APP_ID \
                --branch-name $BRANCH \
                --job-id $JOB_ID \
                --region $REGION \
                --query 'job.steps[*].[stepName,status,logUrl]' \
                --output table
            exit 1
            ;;
        "RUNNING"|"PENDING")
            echo -e "${BLUE}📡 Deployment in progress... (Status: ${STATUS})${NC}"
            sleep 30
            ;;
        *)
            echo -e "${YELLOW}⚠️  Unknown status: ${STATUS}${NC}"
            sleep 10
            ;;
    esac
done

# Get app details
echo -e "${BLUE}📋 Retrieving deployment details...${NC}"

APP_DETAILS=$(aws amplify get-app \
    --app-id $APP_ID \
    --region $REGION \
    --output json)

DEFAULT_DOMAIN=$(echo $APP_DETAILS | jq -r '.app.defaultDomain')
APP_URL="https://$BRANCH.$DEFAULT_DOMAIN"

# Override with known URL for existing app
APP_URL="https://main.d26nn5u6blbq6z.amplifyapp.com"

echo ""
echo -e "${GREEN}🎉 Driver Management System Deployed Successfully!${NC}"
echo -e "${GREEN}=============================================${NC}"
echo -e "App ID: ${YELLOW}${APP_ID}${NC}"
echo -e "Region: ${YELLOW}${REGION}${NC}"
echo -e "Branch: ${YELLOW}${BRANCH}${NC}"
echo -e "URL: ${YELLOW}${APP_URL}${NC}"
echo ""
echo -e "${BLUE}📱 Available Pages:${NC}"
echo -e "🚗 Driver Dashboard: ${YELLOW}${APP_URL}/pages/drivers-management.html${NC}"
echo -e "📊 General Dashboard: ${YELLOW}${APP_URL}/pages/dashboard.html${NC}"
echo ""
echo -e "${BLUE}🔧 Driver Management Features:${NC}"
echo -e "- ✅ Approve driver applications"
echo -e "- ❌ Reject driver applications"
echo -e "- ⏸️  Suspend/unsuspend drivers"
echo -e "- 📋 View driver details and documents"
echo -e "- 🔍 Filter and search drivers"
echo -e "- 📊 Real-time statistics"
echo ""
echo -e "${BLUE}⚙️  Next Steps:${NC}"
echo -e "1. Deploy AWS Lambda backend: ${YELLOW}./scripts/deploy-driver-management.sh${NC}"
echo -e "2. Update API configuration with real endpoints"
echo -e "3. Test driver management functionality"
echo -e "4. Configure mobile app integration"
echo ""
echo -e "${BLUE}🏗️  Backend Infrastructure:${NC}"
echo -e "- 📊 DynamoDB table with GSI indexes"
echo -e "- ⚡ AWS Lambda functions (Create/Read/Update)"
echo -e "- 🌐 API Gateway with CORS"
echo -e "- 🔐 Cognito user management integration"
echo ""
echo -e "${GREEN}✨ Deployment Complete!${NC}"
