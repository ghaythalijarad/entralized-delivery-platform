# 🔑 AWS Credentials Configuration Guide

## Quick Setup

You need to configure AWS credentials to deploy your backend. Here's how:

### Step 1: Get Your AWS Credentials

1. **Login to AWS Console**: https://console.aws.amazon.com/
2. **Go to IAM**: https://console.aws.amazon.com/iam/home#/security_credentials
3. **Create Access Key**:
   - Click "Create access key"
   - Choose "Command Line Interface (CLI)"
   - Download or copy your credentials

### Step 2: Configure AWS CLI

Run this command in your terminal:

```bash
aws configure
```

Enter your credentials when prompted:
- **AWS Access Key ID**: [Your access key]
- **AWS Secret Access Key**: [Your secret key]
- **Default region name**: `eu-west-1`
- **Default output format**: `json`

### Step 3: Verify Configuration

```bash
aws sts get-caller-identity
```

You should see your AWS account information.

### Step 4: Check App Runner Service

Once credentials are configured, check your service status:

```bash
aws apprunner describe-service \
  --service-arn "arn:aws:apprunner:eu-west-1:109804294167:service/entralized-delivery-api/ff201cf70ebb4a2085b0d8655f59798e" \
  --region eu-west-1
```

### Step 5: Alternative - Use AWS Console

If CLI setup is complex, you can:

1. **Check App Runner Console**: https://eu-west-1.console.aws.amazon.com/apprunner/
2. **Find your service**: `entralized-delivery-api`
3. **Check status**: Should be "Running"
4. **Get URL**: Copy the service URL
5. **Update frontend**: `./update_frontend_api.sh https://YOUR_SERVICE_URL`

## Troubleshooting

### Service Not Running?
- Check CloudWatch logs in AWS Console
- Verify environment variables are set
- Check if RDS database is accessible

### Connection Issues?
- Verify CORS settings in backend
- Check security groups
- Ensure service has internet access

## Manual Backend Deployment

If App Runner isn't working, you can deploy manually:

```bash
# Option 1: Deploy to Heroku
./deploy_heroku.sh

# Option 2: Deploy to Railway
./deploy_railway.sh
```

## Current Status

Your backend was previously deployed to:
- **Service**: `entralized-delivery-api`
- **Expected URL**: `https://ff201cf70ebb4a2085b0d8655f59798e.eu-west-1.awsapprunner.com`
- **Region**: `eu-west-1`

Once the service is running, test it:
```bash
curl https://ff201cf70ebb4a2085b0d8655f59798e.eu-west-1.awsapprunner.com/health
```
