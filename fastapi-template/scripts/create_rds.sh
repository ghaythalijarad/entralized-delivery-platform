#!/bin/bash
# Automated RDS PostgreSQL Setup for Centralized Delivery Platform
# Run this script after configuring AWS CLI properly

set -e

echo "🚀 Creating RDS PostgreSQL instance for Centralized Delivery Platform"
echo "=================================================================="

# Configuration variables
DB_INSTANCE_ID="delivery-platform-db"
DB_NAME="delivery_platform"
DB_USERNAME="admin"
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
DB_CLASS="db.t3.micro"  # Free tier eligible
REGION="eu-north-1"  # Your configured region

echo "📋 Database Configuration:"
echo "Instance ID: $DB_INSTANCE_ID"
echo "Database Name: $DB_NAME"
echo "Username: $DB_USERNAME"
echo "Password: [GENERATED - will be saved to .env]"
echo "Instance Class: $DB_CLASS"
echo "Region: $REGION"
echo ""

# Create security group
echo "🔒 Creating security group..."
SECURITY_GROUP_ID=$(aws ec2 create-security-group \
    --group-name delivery-platform-db-sg \
    --description "Security group for Delivery Platform RDS instance" \
    --region $REGION \
    --query 'GroupId' \
    --output text 2>/dev/null || echo "EXISTS")

if [ "$SECURITY_GROUP_ID" = "EXISTS" ]; then
    echo "Security group already exists, getting ID..."
    SECURITY_GROUP_ID=$(aws ec2 describe-security-groups \
        --group-names delivery-platform-db-sg \
        --region $REGION \
        --query 'SecurityGroups[0].GroupId' \
        --output text)
fi

echo "Security Group ID: $SECURITY_GROUP_ID"

# Add security group rule for PostgreSQL
echo "🔓 Adding PostgreSQL access rule..."
aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 5432 \
    --cidr 0.0.0.0/0 \
    --region $REGION 2>/dev/null || echo "Rule already exists"

# Create RDS instance
echo "🗄️  Creating RDS PostgreSQL instance..."
aws rds create-db-instance \
    --db-instance-identifier $DB_INSTANCE_ID \
    --db-instance-class $DB_CLASS \
    --engine postgres \
    --engine-version 15.7 \
    --master-username $DB_USERNAME \
    --master-user-password $DB_PASSWORD \
    --allocated-storage 20 \
    --storage-type gp2 \
    --vpc-security-group-ids $SECURITY_GROUP_ID \
    --db-name $DB_NAME \
    --publicly-accessible \
    --backup-retention-period 7 \
    --region $REGION \
    --no-multi-az \
    --storage-encrypted

echo "⏳ Waiting for RDS instance to be available (this may take 5-10 minutes)..."
aws rds wait db-instance-available \
    --db-instance-identifier $DB_INSTANCE_ID \
    --region $REGION

# Get RDS endpoint
echo "🔗 Getting RDS endpoint..."
RDS_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier $DB_INSTANCE_ID \
    --region $REGION \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text)

echo "✅ RDS instance created successfully!"
echo "Endpoint: $RDS_ENDPOINT"

# Update .env file
echo "📝 Updating .env file with RDS configuration..."
cat > .env << EOF
# Production Environment Configuration
ENVIRONMENT=production
DEBUG=false
DB_ECHO=false

# RDS PostgreSQL Configuration
RDS_ENDPOINT=$RDS_ENDPOINT
RDS_PORT=5432
RDS_DB_NAME=$DB_NAME
RDS_USERNAME=$DB_USERNAME
RDS_PASSWORD=$DB_PASSWORD

# Application Settings
SECRET_KEY=$(openssl rand -hex 32)
PORT=8080
HOST=0.0.0.0

# API Configuration
API_PREFIX=/api
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf
SESSION_TIMEOUT=3600
EOF

echo "✅ Environment file updated: .env"

# Save RDS details for reference
cat > RDS_CONNECTION_INFO.txt << EOF
RDS PostgreSQL Instance Details
==============================
Instance ID: $DB_INSTANCE_ID
Endpoint: $RDS_ENDPOINT
Port: 5432
Database Name: $DB_NAME
Username: $DB_USERNAME
Password: $DB_PASSWORD
Region: $REGION
Security Group: $SECURITY_GROUP_ID

Connection String:
postgresql://$DB_USERNAME:$DB_PASSWORD@$RDS_ENDPOINT:5432/$DB_NAME

To connect via psql:
psql -h $RDS_ENDPOINT -U $DB_USERNAME -d $DB_NAME
EOF

echo "📄 Connection details saved to: RDS_CONNECTION_INFO.txt"

echo ""
echo "🎉 RDS Setup Complete!"
echo "======================"
echo "✅ RDS PostgreSQL instance created"
echo "✅ Security group configured"
echo "✅ Environment file updated"
echo "✅ Connection details saved"
echo ""
echo "Next steps:"
echo "1. Run database migrations: ./scripts/deploy_production.sh"
echo "2. Test local connection with new RDS"
echo "3. Deploy to AWS Amplify with updated environment"
echo ""
echo "⚠️  IMPORTANT: Keep RDS_CONNECTION_INFO.txt secure and don't commit it to git!"
