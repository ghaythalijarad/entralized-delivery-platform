#!/bin/bash
# AWS CLI Configuration Helper

echo "🔧 AWS CLI Configuration Setup"
echo "=============================="

echo "You'll need your AWS credentials:"
echo "1. AWS Access Key ID"
echo "2. AWS Secret Access Key" 
echo "3. Default region (e.g., eu-west-1)"
echo "4. Default output format (json)"

echo ""
echo "Get your credentials from:"
echo "🔗 AWS Console > IAM > Users > Your User > Security credentials"
echo "📖 Or ask your AWS administrator"

echo ""
echo "Run this command to configure:"
echo "aws configure"

echo ""
echo "Required permissions for App Runner:"
echo "- apprunner:*"
echo "- iam:CreateRole"
echo "- iam:AttachRolePolicy"
echo "- logs:CreateLogGroup"

echo ""
echo "After configuration, run:"
echo "./deploy_new_app_runner.sh"
