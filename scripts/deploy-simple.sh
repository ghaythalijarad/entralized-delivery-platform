#!/bin/bash

# Simple Merchant Management Deployment
echo "🏪 Deploying Merchant Management System (Simplified)"
echo "=================================================="

STACK_NAME="merchant-management-dev"
TEMPLATE_FILE="config/aws/merchant-management-simple.yaml"
REGION="us-east-1"

# Deploy the stack
echo "🚀 Deploying CloudFormation stack..."

aws cloudformation deploy \
    --template-file "$TEMPLATE_FILE" \
    --stack-name "$STACK_NAME" \
    --capabilities CAPABILITY_IAM \
    --region "$REGION" \
    --parameter-overrides Environment=dev

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    
    # Get outputs
    echo "📋 Getting stack outputs..."
    aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --query 'Stacks[0].Outputs' \
        --output table
else
    echo "❌ Deployment failed!"
    exit 1
fi
