#!/bin/bash
# Production Deployment Script for Centralized Delivery Platform
# This script prepares the application for production deployment with Amazon RDS or Mock Database

set -e  # Exit on any error

echo "🚀 Starting production deployment preparation..."
echo "=================================================="

# Check if we're in the correct directory
if [ ! -f "app/main.py" ]; then
    echo "❌ Error: Please run this script from the fastapi-template directory"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found. Please create one based on .env.example"
    exit 1
fi

# Function to check if RDS is configured
check_rds_config() {
    source .env
    if [[ "$RDS_ENDPOINT" != "localhost" && "$RDS_ENDPOINT" != "" ]]; then
        return 0  # RDS is configured
    else
        return 1  # RDS not configured
    fi
}

# Check RDS configuration
if check_rds_config; then
    echo "🗄️  RDS configuration detected"
    USE_RDS=true
else
    echo "📝 No RDS configuration found, using mock database for deployment"
    USE_RDS=false
fi

# Load environment variables
source .env

# Check required RDS environment variables
echo "🔍 Checking RDS configuration..."
required_vars=("RDS_ENDPOINT" "RDS_USERNAME" "RDS_PASSWORD" "RDS_DB_NAME")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "❌ Missing required environment variables:"
    printf '%s\n' "${missing_vars[@]}"
    echo "Please update your .env file with RDS configuration"
    exit 1
fi

echo "✅ RDS configuration verified"

# Install/update dependencies
echo "📦 Installing dependencies..."
pip install -r ../requirements.txt

# Run database migrations
echo "🗄️  Running database migrations..."
export ENVIRONMENT=production
alembic upgrade head

# Test database connection
echo "🔗 Testing database connection..."
python -c "
from app.database import check_database_connection
if not check_database_connection():
    print('❌ Database connection failed')
    exit(1)
print('✅ Database connection successful')
"

# Seed initial data if needed
echo "🌱 Checking if database needs initial data..."
response=$(curl -s -X GET "http://localhost:8003/api/dashboard/stats" || echo "failed")
if [[ "$response" == *"total_orders\":0"* ]] || [[ "$response" == "failed" ]]; then
    echo "📊 Seeding initial data..."
    python -c "
import requests
try:
    response = requests.post('http://localhost:8003/api/seed-database')
    if response.status_code == 200:
        print('✅ Initial data seeded successfully')
    else:
        print('⚠️  Warning: Could not seed initial data. You may need to do this manually.')
except:
    print('⚠️  Warning: Could not connect to API for seeding. Make sure the server is running.')
"
else
    echo "ℹ️  Database already contains data, skipping seeding"
fi

# Create production configuration file
echo "⚙️  Creating production configuration..."
cat > production.env << EOF
# Production Environment Configuration
ENVIRONMENT=production
DEBUG=false
DB_ECHO=false

# RDS Configuration
RDS_ENDPOINT=${RDS_ENDPOINT}
RDS_PORT=${RDS_PORT:-5432}
RDS_DB_NAME=${RDS_DB_NAME}
RDS_USERNAME=${RDS_USERNAME}
RDS_PASSWORD=${RDS_PASSWORD}

# Security
SECRET_KEY=${SECRET_KEY:-$(openssl rand -hex 32)}

# Application Settings
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf
SESSION_TIMEOUT=3600
EOF

echo "✅ Production configuration created: production.env"

# Validate application structure
echo "🔍 Validating application structure..."
required_files=(
    "app/main.py"
    "app/database.py"
    "app/models.py"
    "app/schemas.py"
    "alembic.ini"
    "static/index.html"
    "static/dashboard.html"
)

missing_files=()
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -ne 0 ]; then
    echo "❌ Missing required files:"
    printf '%s\n' "${missing_files[@]}"
    exit 1
fi

echo "✅ Application structure validated"

# Generate deployment checklist
echo "📋 Generating deployment checklist..."
cat > DEPLOYMENT_CHECKLIST.md << EOF
# Production Deployment Checklist

## Pre-deployment
- [ ] Amazon RDS PostgreSQL instance created
- [ ] RDS security groups configured
- [ ] Database migrations run successfully
- [ ] Initial data seeded
- [ ] Environment variables configured
- [ ] SSL certificates ready (if applicable)

## AWS Amplify Configuration
Add these environment variables in Amplify Console:

\`\`\`
ENVIRONMENT=production
RDS_ENDPOINT=${RDS_ENDPOINT}
RDS_PORT=${RDS_PORT:-5432}
RDS_DB_NAME=${RDS_DB_NAME}
RDS_USERNAME=${RDS_USERNAME}
RDS_PASSWORD=${RDS_PASSWORD}
\`\`\`

## Post-deployment
- [ ] Test all API endpoints
- [ ] Verify dashboard functionality
- [ ] Check database connectivity
- [ ] Monitor application logs
- [ ] Test mobile responsiveness
- [ ] Verify navigation system
- [ ] Test order management
- [ ] Confirm real-time updates

## Monitoring
- [ ] Set up CloudWatch alarms
- [ ] Configure RDS Performance Insights
- [ ] Monitor application metrics
- [ ] Set up log aggregation

## Security
- [ ] Review security groups
- [ ] Enable SSL/TLS
- [ ] Rotate database passwords
- [ ] Review IAM permissions
EOF

echo "✅ Deployment checklist created: DEPLOYMENT_CHECKLIST.md"

# Final summary
echo ""
echo "🎉 Production deployment preparation completed!"
echo "=================================================="
echo "✅ Dependencies installed"
echo "✅ Database migrations completed"
echo "✅ Database connection verified"
echo "✅ Production configuration created"
echo "✅ Application structure validated"
echo "✅ Deployment checklist generated"
echo ""
echo "📝 Next steps:"
echo "1. Review DEPLOYMENT_CHECKLIST.md"
echo "2. Configure AWS Amplify environment variables"
echo "3. Deploy to production"
echo "4. Run post-deployment tests"
echo ""
echo "🔗 Useful files:"
echo "- RDS_SETUP_GUIDE.md: Complete RDS setup instructions"
echo "- production.env: Production environment configuration"
echo "- DEPLOYMENT_CHECKLIST.md: Deployment verification checklist"
echo "- scripts/migrate_to_rds.py: Data migration utility"
echo ""
