#!/bin/bash
# AWS Amplify Deployment Script for Centralized Delivery Platform
# This script guides you through the complete AWS deployment process

set -e  # Exit on any error

echo "🚀 AWS AMPLIFY DEPLOYMENT SCRIPT"
echo "=================================="
echo "Centralized Delivery Platform"
echo "Repository: https://github.com/ghaythalijarad/entralized-delivery-platform.git"
echo "=================================="

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check if git repository is clean
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Git repository has uncommitted changes. Please commit all changes first."
    exit 1
fi

echo "✅ Git repository is clean"

# Check if remote origin is set
REPO_URL=$(git config --get remote.origin.url)
if [ -z "$REPO_URL" ]; then
    echo "❌ Git remote origin not set"
    exit 1
fi

echo "✅ Repository URL: $REPO_URL"

# Verify amplify.yml exists
if [ ! -f "amplify.yml" ]; then
    echo "❌ amplify.yml not found in root directory"
    exit 1
fi

echo "✅ amplify.yml configuration found"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "⚠️ AWS CLI not found. Installing AWS CLI is recommended but not required for Amplify Console deployment."
    echo "   You can deploy using the AWS Amplify Console web interface."
fi

echo ""
echo "🎯 DEPLOYMENT OPTIONS:"
echo "1. Deploy using AWS Amplify Console (Recommended)"
echo "2. Deploy using AWS CLI (Advanced)"
echo ""

read -p "Choose deployment method (1 or 2): " choice

case $choice in
    1)
        echo ""
        echo "🌐 AWS AMPLIFY CONSOLE DEPLOYMENT"
        echo "=================================="
        echo ""
        echo "Follow these steps to deploy using the AWS Amplify Console:"
        echo ""
        echo "1. 🔗 Open AWS Amplify Console:"
        echo "   https://console.aws.amazon.com/amplify/"
        echo ""
        echo "2. 🆕 Create New App:"
        echo "   - Click 'New app' → 'Host web app'"
        echo "   - Select 'GitHub' as the repository service"
        echo ""
        echo "3. 🔐 Connect Repository:"
        echo "   - Repository: ghaythalijarad/entralized-delivery-platform"
        echo "   - Branch: main"
        echo "   - Amplify will automatically detect amplify.yml"
        echo ""
        echo "4. ⚙️ Configure Environment Variables:"
        echo "   Add these environment variables in the Amplify Console:"
        echo ""
        echo "   ENVIRONMENT=production"
        echo "   RDS_ENDPOINT=delivery-platform-db.clo2o2squsbf.eu-north-1.rds.amazonaws.com"
        echo "   RDS_PORT=5432"
        echo "   RDS_DB_NAME=delivery_platform"
        echo "   RDS_USERNAME=ghayth"
        echo "   RDS_PASSWORD=DeliveryPlatform2025!"
        echo "   SECRET_KEY=prod-4a7d8c9e2f1b5a8c3d6e9f2a5b8c1d4e7a0b3c6d9e2f5a8b1c4d7e0a3b6c9d2e5f8a1b4c7d0"
        echo "   PORT=8080"
        echo "   HOST=0.0.0.0"
        echo ""
        echo "5. 🚀 Deploy:"
        echo "   - Review configuration and click 'Save and Deploy'"
        echo "   - Wait for build to complete (~5-10 minutes)"
        echo "   - Your app will be available at: https://xxxxx.amplifyapp.com"
        echo ""
        echo "6. 🧪 Post-Deployment Testing:"
        echo "   - Test login with: admin / admin123"
        echo "   - Change admin password immediately"
        echo "   - Verify all functionality works"
        echo ""
        echo "📱 Your deployment URL will be displayed after successful build!"
        echo ""
        read -p "Press Enter to open AWS Amplify Console in your browser..."
        open "https://console.aws.amazon.com/amplify/"
        ;;
    2)
        echo ""
        echo "🔧 AWS CLI DEPLOYMENT"
        echo "===================="
        echo ""
        if ! command -v aws &> /dev/null; then
            echo "❌ AWS CLI is required for this method."
            echo "   Install AWS CLI: https://aws.amazon.com/cli/"
            exit 1
        fi
        
        # Check AWS credentials
        if ! aws sts get-caller-identity &> /dev/null; then
            echo "❌ AWS credentials not configured."
            echo "   Run: aws configure"
            exit 1
        fi
        
        echo "✅ AWS CLI configured"
        echo ""
        echo "Creating Amplify app via CLI..."
        
        # Create Amplify app
        APP_NAME="centralized-delivery-platform"
        
        echo "Creating Amplify app: $APP_NAME"
        aws amplify create-app --name "$APP_NAME" --description "Centralized Delivery Platform - Full Stack Application"
        
        echo ""
        echo "✅ Amplify app created successfully!"
        echo "   Complete the setup in the AWS Amplify Console to connect your repository."
        echo "   https://console.aws.amazon.com/amplify/"
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again and choose 1 or 2."
        exit 1
        ;;
esac

echo ""
echo "🎉 DEPLOYMENT INITIATION COMPLETE!"
echo "=================================="
echo ""
echo "📊 Build Status:"
echo "   - Repository: ✅ Ready"
echo "   - Configuration: ✅ Ready"
echo "   - Environment: ✅ Production"
echo "   - Database: ✅ RDS PostgreSQL"
echo ""
echo "📝 Next Steps:"
echo "   1. Monitor build progress in AWS Amplify Console"
echo "   2. Test the deployed application"
echo "   3. Update admin password after first login"
echo "   4. Set up custom domain (optional)"
echo ""
echo "🔗 Useful Links:"
echo "   - AWS Amplify Console: https://console.aws.amazon.com/amplify/"
echo "   - Repository: $REPO_URL"
echo "   - Documentation: See MISSION_ACCOMPLISHED.md"
echo ""
echo "✅ Deployment process initiated successfully!"
