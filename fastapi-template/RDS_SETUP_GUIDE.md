# Amazon RDS Setup Guide for Centralized Delivery Platform

## Overview
This guide will help you set up Amazon RDS PostgreSQL for your centralized delivery platform and migrate from the local SQLite database.

## Prerequisites
- AWS Account with appropriate permissions
- AWS CLI installed and configured
- PostgreSQL client tools (optional, for direct database access)

## Step 1: Create Amazon RDS PostgreSQL Instance

### Using AWS Console:
1. Go to RDS Console: https://console.aws.amazon.com/rds/
2. Click "Create database"
3. Choose "Standard create"
4. Engine type: PostgreSQL
5. Engine version: PostgreSQL 15.4 (or latest stable)
6. Templates: Production (for production) or Dev/Test (for staging)

### Instance Configuration:
- **DB instance identifier**: `delivery-platform-db`
- **Master username**: `admin` (or your preferred username)
- **Master password**: Generate secure password or use your own
- **DB instance class**: 
  - Production: `db.t3.medium` or `db.t3.large`
  - Development: `db.t3.micro` (Free tier eligible)
- **Storage type**: General Purpose SSD (gp2)
- **Allocated storage**: 20 GB (minimum, auto-scaling enabled)

### Connectivity:
- **VPC**: Default VPC or your custom VPC
- **Subnet group**: Default
- **Public access**: Yes (for initial setup, can be restricted later)
- **VPC security group**: Create new security group
- **Database port**: 5432 (default PostgreSQL port)

### Security Group Rules:
Create a security group with the following inbound rules:
- Type: PostgreSQL
- Protocol: TCP
- Port: 5432
- Source: Your IP address (for development) or your application's security group

### Additional Configuration:
- **Initial database name**: `delivery_platform`
- **DB parameter group**: default.postgres15
- **Backup retention period**: 7 days
- **Monitoring**: Enable Enhanced monitoring
- **Auto minor version upgrade**: Yes

## Step 2: Update Environment Configuration

### Update .env file:
```bash
# Update your .env file with RDS connection details
ENVIRONMENT=production
RDS_ENDPOINT=your-rds-instance.region.rds.amazonaws.com
RDS_PORT=5432
RDS_DB_NAME=delivery_platform
RDS_USERNAME=admin
RDS_PASSWORD=your-secure-password
```

### AWS Region Configuration:
Make sure your RDS instance is in the same region as your application deployment.

## Step 3: Database Migration

### 3.1 Run Alembic Migrations:
```bash
# Set environment to production
export ENVIRONMENT=production

# Run migrations to create all tables
alembic upgrade head
```

### 3.2 Seed Initial Data:
```bash
# Call the API endpoint to seed initial data
curl -X POST "https://your-api-domain.com/api/seed-database"
```

## Step 4: Application Deployment

### 4.1 Update requirements.txt:
Ensure your requirements.txt includes:
```
psycopg2-binary==2.9.9
sqlalchemy==2.0.23
alembic==1.13.1
python-dotenv==1.0.0
```

### 4.2 AWS Amplify Deployment:
The application will automatically use RDS when ENVIRONMENT=production.

### 4.3 Environment Variables in AWS Amplify:
Add the following environment variables in Amplify Console:
- `ENVIRONMENT`: `production`
- `RDS_ENDPOINT`: Your RDS endpoint
- `RDS_PORT`: `5432`
- `RDS_DB_NAME`: `delivery_platform`
- `RDS_USERNAME`: Your RDS username
- `RDS_PASSWORD`: Your RDS password

## Step 5: Security Best Practices

### 5.1 Network Security:
- Place RDS in private subnets if possible
- Use VPC security groups to restrict access
- Enable SSL/TLS for database connections

### 5.2 Access Control:
- Use IAM database authentication when possible
- Rotate database passwords regularly
- Create separate read-only users for reporting

### 5.3 Backup Strategy:
- Enable automated backups (7-30 days retention)
- Create manual snapshots before major updates
- Test backup restoration procedures

## Step 6: Monitoring and Maintenance

### 6.1 CloudWatch Monitoring:
- CPU utilization
- Database connections
- Read/write IOPS
- Free storage space

### 6.2 Performance Insights:
- Enable Performance Insights for query analysis
- Monitor top SQL statements
- Identify performance bottlenecks

### 6.3 Maintenance Windows:
- Schedule maintenance windows during low traffic periods
- Enable auto minor version upgrades
- Plan for major version upgrades

## Step 7: Cost Optimization

### 7.1 Instance Sizing:
- Start with smaller instances and scale up as needed
- Use Reserved Instances for production workloads
- Consider Aurora Serverless for variable workloads

### 7.2 Storage Optimization:
- Enable storage auto-scaling
- Use appropriate storage types (gp2 vs io1)
- Archive old data to reduce storage costs

## Troubleshooting

### Common Issues:

1. **Connection Timeout**:
   - Check security group rules
   - Verify VPC and subnet configuration
   - Ensure public accessibility if connecting from outside VPC

2. **Authentication Failed**:
   - Verify username and password
   - Check if user has necessary privileges
   - Ensure correct database name

3. **SSL Connection Issues**:
   - Download and configure RDS SSL certificate
   - Update connection string with SSL parameters

### Testing Connection:
```bash
# Test connection using psql
psql -h your-rds-endpoint -U admin -d delivery_platform

# Test connection using Python
python -c "
from app.database import check_database_connection
print('Database connection:', check_database_connection())
"
```

## Migration Script

A complete migration script is available in `scripts/migrate_to_rds.py` to help with the transition from local SQLite to RDS PostgreSQL.

## Support

For additional support:
- Check AWS RDS documentation: https://docs.aws.amazon.com/rds/
- Monitor application logs for database-related errors
- Use AWS Support for infrastructure issues
- Contact development team for application-specific issues
