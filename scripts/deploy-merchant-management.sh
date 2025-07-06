#!/bin/bash

# Enhanced Merchant Management System Deployment Script
# This script deploys the complete merchant management infrastructure

set -e

# Configuration
STACK_NAME="merchant-management-system"
TEMPLATE_FILE="config/aws/merchant-management-simple.yaml"
ENVIRONMENT="${1:-dev}"
REGION="${2:-us-east-1}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Enhanced Merchant Management System Deployment${NC}"
echo -e "${BLUE}================================================${NC}"
echo -e "Environment: ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "Region: ${YELLOW}${REGION}${NC}"
echo -e "Stack Name: ${YELLOW}${STACK_NAME}-${ENVIRONMENT}${NC}"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install AWS CLI first.${NC}"
    exit 1
fi

# Check if template file exists
if [ ! -f "$TEMPLATE_FILE" ]; then
    echo -e "${RED}❌ Template file not found: $TEMPLATE_FILE${NC}"
    exit 1
fi

# Validate CloudFormation template
echo -e "${BLUE}🔍 Validating CloudFormation template...${NC}"
aws cloudformation validate-template \
    --template-body file://$TEMPLATE_FILE \
    --region $REGION

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Template validation successful${NC}"
else
    echo -e "${RED}❌ Template validation failed${NC}"
    exit 1
fi

# Check if stack exists
STACK_EXISTS=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}-${ENVIRONMENT}" \
    --region $REGION \
    --query 'Stacks[0].StackStatus' \
    --output text 2>/dev/null || echo "DOES_NOT_EXIST")

if [ "$STACK_EXISTS" = "DOES_NOT_EXIST" ]; then
    echo -e "${BLUE}📦 Creating new stack...${NC}"
    
    aws cloudformation create-stack \
        --stack-name "${STACK_NAME}-${ENVIRONMENT}" \
        --template-body file://$TEMPLATE_FILE \
        --parameters ParameterKey=Environment,ParameterValue=$ENVIRONMENT \
        --capabilities CAPABILITY_IAM \
        --region $REGION \
        --tags Key=Environment,Value=$ENVIRONMENT \
               Key=Service,Value=MerchantManagement \
               Key=ManagedBy,Value=CloudFormation

    echo -e "${YELLOW}⏳ Waiting for stack creation to complete...${NC}"
    
    aws cloudformation wait stack-create-complete \
        --stack-name "${STACK_NAME}-${ENVIRONMENT}" \
        --region $REGION

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Stack created successfully${NC}"
    else
        echo -e "${RED}❌ Stack creation failed${NC}"
        exit 1
    fi
else
    echo -e "${BLUE}🔄 Updating existing stack...${NC}"
    
    aws cloudformation update-stack \
        --stack-name "${STACK_NAME}-${ENVIRONMENT}" \
        --template-body file://$TEMPLATE_FILE \
        --parameters ParameterKey=Environment,ParameterValue=$ENVIRONMENT \
        --capabilities CAPABILITY_IAM \
        --region $REGION \
        --tags Key=Environment,Value=$ENVIRONMENT \
               Key=Service,Value=MerchantManagement \
               Key=ManagedBy,Value=CloudFormation

    echo -e "${YELLOW}⏳ Waiting for stack update to complete...${NC}"
    
    aws cloudformation wait stack-update-complete \
        --stack-name "${STACK_NAME}-${ENVIRONMENT}" \
        --region $REGION

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Stack updated successfully${NC}"
    else
        echo -e "${RED}❌ Stack update failed${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${BLUE}📋 Retrieving stack outputs...${NC}"

# Get stack outputs
OUTPUTS=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}-${ENVIRONMENT}" \
    --region $REGION \
    --query 'Stacks[0].Outputs' \
    --output json)

API_ENDPOINT=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="MerchantAPIEndpoint") | .OutputValue')
TABLE_NAME=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="MerchantsTableName") | .OutputValue')

echo -e "${GREEN}✅ Deployment Summary${NC}"
echo -e "${GREEN}===================${NC}"
echo -e "API Endpoint: ${YELLOW}${API_ENDPOINT}${NC}"
echo -e "DynamoDB Table: ${YELLOW}${TABLE_NAME}${NC}"
echo ""

# Test API endpoint
echo -e "${BLUE}🧪 Testing API endpoint...${NC}"
if curl -s -f "${API_ENDPOINT}/merchants" > /dev/null; then
    echo -e "${GREEN}✅ API endpoint is responding${NC}"
else
    echo -e "${YELLOW}⚠️  API endpoint test failed (this is normal for a new deployment)${NC}"
fi

# Create configuration file for frontend
echo -e "${BLUE}📝 Creating configuration file...${NC}"
mkdir -p src/config
cat > src/config/aws-config.js << EOF
// Auto-generated AWS configuration
export const AWS_CONFIG = {
    region: '${REGION}',
    environment: '${ENVIRONMENT}',
    merchantAPI: {
        endpoint: '${API_ENDPOINT}',
        tableName: '${TABLE_NAME}'
    }
};

// API endpoints
export const API_ENDPOINTS = {
    merchants: '${API_ENDPOINT}/merchants',
    createMerchant: '${API_ENDPOINT}/merchants',
    updateMerchant: (merchantId) => \`${API_ENDPOINT}/merchants/\${merchantId}\`,
    getMerchants: '${API_ENDPOINT}/merchants'
};

console.log('AWS Configuration loaded:', AWS_CONFIG);
EOF

echo -e "${GREEN}✅ Configuration file created: src/config/aws-config.js${NC}"

# Seed sample data
echo -e "${BLUE}🌱 Seeding sample merchant data...${NC}"
if [ -f "scripts/seed-merchants.py" ]; then
    python3 scripts/seed-merchants.py --table-name "$TABLE_NAME" --region "$REGION"
    echo -e "${GREEN}✅ Sample data seeded successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Seed script not found, skipping sample data${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Merchant Management System Deployment Complete!${NC}"
echo -e "${GREEN}=================================================${NC}"
echo -e "Next steps:"
echo -e "1. Update your frontend to use the new API endpoint"
echo -e "2. Test the merchant management interface"
echo -e "3. Configure user authentication if needed"
echo ""
echo -e "API Documentation:"
echo -e "- GET ${API_ENDPOINT}/merchants - List all merchants"
echo -e "- POST ${API_ENDPOINT}/merchants - Create new merchant"
echo -e "- PUT ${API_ENDPOINT}/merchants/{id} - Update merchant"
echo ""
echo -e "Frontend files to update:"
echo -e "- src/utils/merchant-api.js (update API_BASE_URL)"
echo -e "- src/pages/merchant-management.html (verify API integration)"
echo ""