#!/bin/bash

# Driver Management System Deployment Script
# Deploys AWS Lambda functions and API Gateway for driver management

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions for colored output
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_status() {
    echo -e "${BLUE}🔄 $1${NC}"
}

# Configuration
ENVIRONMENT=${1:-dev}
REGION=${2:-us-east-1}
STACK_NAME="driver-management-${ENVIRONMENT}"
TEMPLATE_FILE="config/aws/driver-management-lambda.yaml"
USER_POOL_ID=${3:-""}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if the template file exists
if [ ! -f "$TEMPLATE_FILE" ]; then
    print_error "Template file not found: $TEMPLATE_FILE"
    exit 1
fi

print_info "Starting Driver Management System deployment..."
print_info "Environment: $ENVIRONMENT"
print_info "Region: $REGION"
print_info "Stack Name: $STACK_NAME"
echo ""

# Deploy the CloudFormation stack
print_status "Deploying CloudFormation stack..."

PARAMETERS=""
if [ ! -z "$USER_POOL_ID" ]; then
    PARAMETERS="ParameterKey=UserPoolId,ParameterValue=$USER_POOL_ID"
fi

aws cloudformation deploy \
    --template-file $TEMPLATE_FILE \
    --stack-name $STACK_NAME \
    --parameter-overrides Environment=$ENVIRONMENT $PARAMETERS \
    --capabilities CAPABILITY_IAM \
    --region $REGION \
    --no-fail-on-empty-changeset

if [ $? -eq 0 ]; then
    print_success "CloudFormation stack deployed successfully"
else
    print_error "Failed to deploy CloudFormation stack"
    exit 1
fi

# Get stack outputs
print_status "Retrieving stack outputs..."

DRIVER_API_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`DriverAPIEndpoint`].OutputValue' \
    --output text)

DRIVERS_TABLE_NAME=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`DriversTableName`].OutputValue' \
    --output text)

if [ -z "$DRIVER_API_ENDPOINT" ]; then
    print_error "Failed to get API endpoint from stack outputs"
    exit 1
fi

print_success "Stack outputs retrieved successfully"
echo ""

# Update AWS configuration file
print_status "Updating AWS configuration..."

AWS_CONFIG_FILE="src/utils/aws-config.js"

if [ -f "$AWS_CONFIG_FILE" ]; then
    # Update the drivers endpoint
    sed -i.bak "s|drivers: 'https://.*\.execute-api\..*\.amazonaws\.com/.*/drivers'|drivers: '${DRIVER_API_ENDPOINT}/drivers'|g" "$AWS_CONFIG_FILE"
    
    # Update the main API endpoint if needed
    sed -i.bak "s|https://your-api-gateway-url\.execute-api\..*\.amazonaws\.com/dev|${DRIVER_API_ENDPOINT}|g" "$AWS_CONFIG_FILE"
    
    print_success "AWS configuration updated"
else
    print_warning "AWS configuration file not found: $AWS_CONFIG_FILE"
fi

# Test the API endpoints
print_status "Testing API endpoints..."

# Test GET /drivers endpoint
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${DRIVER_API_ENDPOINT}/drivers")

if [ "$HTTP_STATUS" -eq 200 ]; then
    print_success "GET /drivers endpoint is working"
else
    print_warning "GET /drivers endpoint returned status: $HTTP_STATUS"
fi

# Create a test driver (optional)
if [ "$ENVIRONMENT" == "dev" ]; then
    print_status "Creating test driver..."
    
    TEST_DRIVER_DATA='{
        "firstName": "Test",
        "lastName": "Driver",
        "email": "test.driver@example.com",
        "phoneNumber": "+1234567890",
        "vehicleType": "car",
        "licensePlate": "TEST-123",
        "vehicleModel": "Test Model",
        "vehicleColor": "Blue",
        "zone": "central",
        "streetAddress": "123 Test Street",
        "city": "Test City",
        "zipCode": "12345",
        "emergencyName": "Test Emergency",
        "emergencyPhone": "+1987654321"
    }'
    
    CREATE_RESPONSE=$(curl -s -X POST "${DRIVER_API_ENDPOINT}/drivers" \
        -H "Content-Type: application/json" \
        -d "$TEST_DRIVER_DATA")
    
    if echo "$CREATE_RESPONSE" | grep -q "success.*true"; then
        print_success "Test driver created successfully"
    else
        print_warning "Test driver creation failed or returned unexpected response"
        echo "Response: $CREATE_RESPONSE"
    fi
fi

# Display deployment summary
echo ""
print_success "🎉 Driver Management System deployment completed!"
echo ""
print_info "📋 Deployment Summary:"
echo "    • Environment: $ENVIRONMENT"
echo "    • Region: $REGION"
echo "    • Stack Name: $STACK_NAME"
echo "    • API Endpoint: $DRIVER_API_ENDPOINT"
echo "    • Drivers Table: $DRIVERS_TABLE_NAME"
echo ""

print_info "🔧 Available API Endpoints:"
echo "    • GET    ${DRIVER_API_ENDPOINT}/drivers"
echo "    • POST   ${DRIVER_API_ENDPOINT}/drivers"
echo "    • GET    ${DRIVER_API_ENDPOINT}/drivers/{driverId}"
echo "    • PUT    ${DRIVER_API_ENDPOINT}/drivers/{driverId}/status"
echo ""

print_info "🧪 Testing Commands:"
echo "    # List all drivers"
echo "    curl '${DRIVER_API_ENDPOINT}/drivers'"
echo ""
echo "    # Create a new driver"
echo "    curl -X POST '${DRIVER_API_ENDPOINT}/drivers' \\"
echo "         -H 'Content-Type: application/json' \\"
echo "         -d '{\"firstName\":\"John\",\"lastName\":\"Doe\",\"email\":\"john@example.com\",\"phoneNumber\":\"+1234567890\",\"vehicleType\":\"car\"}'"
echo ""
echo "    # Update driver status"
echo "    curl -X PUT '${DRIVER_API_ENDPOINT}/drivers/{driverId}/status' \\"
echo "         -H 'Content-Type: application/json' \\"
echo "         -d '{\"status\":\"approved\"}'"
echo ""

print_info "🌐 Frontend Integration:"
echo "    • The AWS configuration has been updated automatically"
echo "    • Your drivers management page should now connect to the real API"
echo "    • Test the frontend at: http://localhost:8080/src/pages/drivers-management.html"
echo ""

print_info "📊 Monitoring:"
echo "    • CloudWatch Logs: /aws/lambda/${ENVIRONMENT}-*-driver"
echo "    • DynamoDB Table: $DRIVERS_TABLE_NAME"
echo "    • API Gateway: $STACK_NAME"
echo ""

print_success "Driver Management System is ready for use! 🚀"
