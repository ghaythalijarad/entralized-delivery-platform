# 🚀 AWS PRODUCTION DEPLOYMENT GUIDE

## Prerequisites
1. **AWS CLI configured** with proper credentials
2. **GitHub repository** pushed and ready
3. **AWS RDS PostgreSQL** database (already configured)

## Architecture
- **Backend**: AWS App Runner (FastAPI + PostgreSQL)
- **Frontend**: AWS Amplify (Static hosting)
- **Database**: AWS RDS PostgreSQL (existing)

---

## STEP 1: Fix AWS CLI Configuration

First, configure your AWS CLI properly:

```bash
aws configure
```

Enter your:
- AWS Access Key ID
- AWS Secret Access Key  
- Default region: `eu-north-1`
- Default output format: `json`

Test the configuration:
```bash
aws sts get-caller-identity
```

---

## STEP 2: Deploy Backend to AWS App Runner

### 2.1 Go to AWS App Runner Console
1. Open [AWS App Runner Console](https://console.aws.amazon.com/apprunner/)
2. Click "Create service"

### 2.2 Configure Source
- **Source**: Repository
- **Repository type**: GitHub
- **Connect to GitHub**: Authorize AWS to access your repositories
- **Repository**: `ghaythalijarad/entralized-delivery-platform`
- **Branch**: `main`
- **Source directory**: `fastapi-template`

### 2.3 Configure Deployment
- **Deployment trigger**: Automatic
- **Configuration file**: Use configuration file (apprunner.yaml)

### 2.4 Configure Service
- **Service name**: `centralized-delivery-api`
- **Virtual CPU**: 0.25 vCPU
- **Memory**: 0.5 GB

### 2.5 Environment Variables
Add these environment variables:

```
ENVIRONMENT=production
RDS_ENDPOINT=delivery-platform-db.clo2o2squsbf.eu-north-1.rds.amazonaws.com
RDS_PORT=5432
RDS_DB_NAME=delivery_platform
RDS_USERNAME=ghayth
RDS_PASSWORD=DeliveryPlatform2025!
SECRET_KEY=prod-4a7d8c9e2f1b5a8c3d6e9f2a5b8c1d4e7a0b3c6d9e2f5a8b1c4d7e0a3b6c9d2e5f8a1b4c7d0
PORT=8080
```

### 2.6 Create Service
- Click "Create & deploy"
- Wait 5-10 minutes for deployment
- Note the service URL (e.g., `https://abc123.eu-north-1.awsapprunner.com`)

---

## STEP 3: Deploy Frontend to AWS Amplify

### 3.1 Update Frontend Configuration
First, update your frontend to point to the App Runner API URL:

```bash
cd "/Users/ghaythallaheebi/centralized platform"

# Update the API base URL in index.html
sed -i.bak 's|<meta name="api-base" content="">|<meta name="api-base" content="https://YOUR_APPRUNNER_URL">|g' fastapi-template/static/index.html

# Update the API base URL in login.html  
sed -i.bak 's|<meta name="api-base" content="">|<meta name="api-base" content="https://YOUR_APPRUNNER_URL">|g' fastapi-template/static/login.html

# Commit the changes
git add .
git commit -m "Update frontend API URL for production"
git push origin main
```

**Replace `YOUR_APPRUNNER_URL` with your actual App Runner service URL**

### 3.2 Go to AWS Amplify Console
1. Open [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click "New app" → "Host web app"

### 3.3 Connect Repository
- **Repository service**: GitHub
- **Repository**: `ghaythalijarad/entralized-delivery-platform`
- **Branch**: `main`

### 3.4 Configure Build Settings
Amplify should detect the `amplify.yml` file automatically. If not, use this configuration:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - echo "Building Centralized Delivery Platform Frontend"
    build:
      commands:
        - echo "Static files ready for deployment"
  artifacts:
    baseDirectory: fastapi-template/static
    files:
      - '**/*'
```

### 3.5 Deploy
- **App name**: `centralized-delivery-platform`
- Click "Save and deploy"
- Wait for deployment (2-5 minutes)

---

## STEP 4: Configure CORS for Production

After both services are deployed, update the backend CORS settings:

1. Go to your App Runner service
2. Update the allowed origins in `app/config.py`:

```python
ALLOWED_ORIGINS = [
    "https://YOUR_AMPLIFY_URL",  # Your Amplify frontend URL
    "https://main.YOUR_AMPLIFY_ID.amplifyapp.com",  # Auto-generated Amplify URL
    "http://localhost:3000",  # For development
]
```

3. Commit and push the changes to trigger a new deployment

---

## STEP 5: Test the Production Application

### 5.1 Access URLs
- **Frontend**: Your Amplify app URL (e.g., `https://main.d1a2b3c4d5e6f7.amplifyapp.com`)
- **Backend API**: Your App Runner URL (e.g., `https://abc123.eu-north-1.awsapprunner.com`)

### 5.2 Test Login
1. Go to the frontend URL
2. Navigate to login page
3. Use credentials:
   - Username: `admin`
   - Password: `admin123`
4. Verify you can access the dashboard

### 5.3 Test API
```bash
curl -X POST "https://YOUR_APPRUNNER_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

---

## STEP 6: Security Updates

### 6.1 Change Default Password
1. Login to the production application
2. Go to settings or profile
3. Change the admin password from `admin123` to a secure password

### 6.2 Update Environment Variables
Consider rotating the `SECRET_KEY` and database credentials for production security.

---

## 🎯 Expected Results

After successful deployment:

- ✅ **Backend API**: Running on AWS App Runner with RDS PostgreSQL
- ✅ **Frontend**: Hosted on AWS Amplify with CDN
- ✅ **Database**: AWS RDS PostgreSQL with proper connectivity
- ✅ **Authentication**: Full JWT-based login system working
- ✅ **HTTPS**: Secure connections on both frontend and backend
- ✅ **Scalability**: Auto-scaling with AWS managed services

---

## 🆘 Troubleshooting

### App Runner Issues
- Check CloudWatch logs in the App Runner console
- Verify environment variables are set correctly
- Ensure RDS security groups allow App Runner access

### Amplify Issues
- Check build logs in the Amplify console
- Verify the API base URL is correctly set in the frontend
- Ensure CORS is properly configured on the backend

### Database Issues
- Verify RDS is running and accessible
- Check security groups and VPC settings
- Test database connection from App Runner logs

---

## 📞 Support

If you encounter issues:
1. Check AWS CloudWatch logs
2. Verify all environment variables
3. Test each component individually
4. Ensure network connectivity between services

**Your production deployment is ready!** 🚀
