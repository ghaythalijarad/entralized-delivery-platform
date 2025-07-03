# 🚀 Build New AWS App Runner Service - Step by Step Guide

## Prerequisites
- ✅ AWS Account with appropriate permissions
- ✅ GitHub repository with your code
- ✅ Working FastAPI application locally

## Step 1: Prepare Your Repository Structure

Your repository should have this structure:
```
your-repo/
├── apprunner.yaml          # App Runner configuration
├── requirements.txt        # Python dependencies
├── start_app_runner.py     # Startup script
└── fastapi-template/       # Your FastAPI app
    └── app/
        ├── main.py         # FastAPI main application
        ├── models.py       # Database models
        └── ...
```

## Step 2: Create apprunner.yaml Configuration

Create a new `apprunner.yaml` file in your repository root:

```yaml
version: 1
runtime: python3
build:
  commands:
    - pip install fastapi uvicorn sqlalchemy python-dotenv passlib python-jose python-multipart
run:
  runtime-version: python3.11
  commands:
    - python start_app_runner.py
  network:
    port: 8080
    env: PORT
  env:
    - name: DATABASE_URL
      value: sqlite:///delivery_platform.db
    - name: SECRET_KEY
      value: your-production-secret-key-here
    - name: ENVIRONMENT
      value: production
```

## Step 3: Create Production Startup Script

Create `start_app_runner.py` in your repository root:

```python
#!/usr/bin/env python3
import os
import sys
import uvicorn
from pathlib import Path

# Add the fastapi-template directory to Python path
fastapi_dir = Path(__file__).parent / "fastapi-template"
sys.path.insert(0, str(fastapi_dir))
os.chdir(fastapi_dir)

# Set production environment
os.environ.setdefault('ENVIRONMENT', 'production')
os.environ.setdefault('HOST', '0.0.0.0')
os.environ.setdefault('PORT', '8080')

print("🚀 Starting App in Production Mode")

# Initialize database and admin user
try:
    from app.database import engine
    from app.models import Base
    Base.metadata.create_all(bind=engine)
    
    # Create admin user if doesn't exist
    from app.database import get_db
    from app.auth import create_user, UserCreate, UserRole, get_user_by_username
    
    db = next(get_db())
    if not get_user_by_username(db, 'admin'):
        admin = UserCreate(
            username='admin',
            email='admin@platform.com',
            password='admin123',
            role=UserRole.ADMIN,
            full_name='Administrator'
        )
        create_user(db, admin)
        print("✅ Admin user created")
    db.close()
except Exception as e:
    print(f"Setup error: {e}")

# Start the app
from app.main import app

if __name__ == "__main__":
    uvicorn.run(
        app,
        host=os.environ.get('HOST', '0.0.0.0'),
        port=int(os.environ.get('PORT', 8080)),
        workers=1
    )
```

## Step 4: Create requirements.txt

Create a minimal `requirements.txt`:

```
fastapi
uvicorn
sqlalchemy
python-dotenv
passlib
python-jose
python-multipart
```

## Step 5: AWS Console - Create App Runner Service

### 5.1 Navigate to AWS App Runner
1. Go to AWS Console
2. Search for "App Runner"
3. Click "Create service"

### 5.2 Configure Source
1. **Source**: Choose "Source code repository"
2. **Repository**: Connect to GitHub
3. **Repository name**: Select your repository
4. **Branch**: main
5. **Configuration file**: Use configuration file (apprunner.yaml)

### 5.3 Configure Build (Auto-detected from apprunner.yaml)
- Runtime: Python 3.11
- Build command: From apprunner.yaml
- Start command: From apprunner.yaml

### 5.4 Configure Service
1. **Service name**: `centralized-delivery-platform`
2. **Virtual CPU**: 0.25 vCPU
3. **Memory**: 0.5 GB
4. **Port**: 8080
5. **Environment variables**: From apprunner.yaml

### 5.5 Auto-scaling (Optional)
- **Concurrency**: 100
- **Min size**: 1
- **Max size**: 10

### 5.6 Health Check
- **Path**: `/health`
- **Protocol**: HTTP
- **Interval**: 10 seconds
- **Timeout**: 5 seconds
- **Healthy threshold**: 1
- **Unhealthy threshold**: 5

## Step 6: Deploy and Monitor

1. Click "Create & deploy"
2. Wait for deployment (5-15 minutes)
3. Monitor logs in AWS Console
4. Test the health endpoint once deployed

## Step 7: Update Frontend

Once deployed, update your frontend to use the new URL:

```bash
./update_frontend_api.sh https://YOUR-NEW-APP-RUNNER-URL.awsapprunner.com
```

## Step 8: Test Complete Flow

1. Test health endpoint: `https://your-url.awsapprunner.com/health`
2. Test login: `https://your-url.awsapprunner.com/static/login.html`
3. Login with: admin/admin123

## Troubleshooting Common Issues

### Build Failures
- Check `apprunner.yaml` syntax
- Verify `requirements.txt` packages
- Check Python path in startup script

### Runtime Failures
- Check environment variables
- Verify port configuration (8080)
- Check database initialization

### Health Check Failures
- Ensure `/health` endpoint exists
- Check if app is binding to 0.0.0.0:8080
- Verify startup script runs without errors

## Alternative: Using AWS CLI

If you prefer CLI deployment:

```bash
# Create apprunner.json configuration
# Use AWS CLI to create service
aws apprunner create-service --cli-input-json file://apprunner.json
```

## Next Steps After Successful Deployment

1. ✅ Update frontend to use production API
2. ✅ Deploy frontend to AWS Amplify
3. ✅ Test complete login flow
4. ✅ Set up custom domain (optional)
5. ✅ Configure monitoring and alerts

---

**💡 Pro Tips:**
- Keep `apprunner.yaml` simple - complex build scripts often fail
- Use minimal dependencies in `requirements.txt`
- Test locally first with the exact same startup script
- Monitor AWS CloudWatch logs for debugging
- App Runner automatically redeploys on every git push to main branch
