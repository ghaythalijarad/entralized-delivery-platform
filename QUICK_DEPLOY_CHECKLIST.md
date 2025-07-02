# 🚀 QUICK AWS DEPLOYMENT CHECKLIST

## Before You Start
- [ ] AWS CLI installed and configured
- [ ] GitHub repository pushed with latest code
- [ ] AWS RDS PostgreSQL database running
- [ ] IAM permissions for App Runner and Amplify

---

## DEPLOYMENT ORDER

### 1. ⚡ Fix AWS CLI (If needed)
```bash
aws configure
# Enter your AWS credentials when prompted
aws sts get-caller-identity  # Test configuration
```

### 2. 🚀 Deploy Backend (AWS App Runner)
1. Go to [AWS App Runner Console](https://console.aws.amazon.com/apprunner/)
2. Create service from GitHub: `ghaythalijarad/entralized-delivery-platform`
3. Source directory: `fastapi-template`
4. Use `apprunner.yaml` configuration
5. Set environment variables (RDS credentials, etc.)
6. Deploy and get service URL

### 3. 🌐 Update Frontend for Production API
```bash
cd "/Users/ghaythallaheebi/centralized platform"

# Replace YOUR_APPRUNNER_URL with actual URL from step 2
BACKEND_URL="https://YOUR_APPRUNNER_URL"

# Update API endpoints
sed -i.bak "s|<meta name=\"api-base\" content=\"\">|<meta name=\"api-base\" content=\"$BACKEND_URL\">|g" fastapi-template/static/index.html
sed -i.bak "s|<meta name=\"api-base\" content=\"\">|<meta name=\"api-base\" content=\"$BACKEND_URL\">|g" fastapi-template/static/login.html

# Commit and push
git add .
git commit -m "🚀 Update frontend for production API"
git push origin main
```

### 4. 📱 Deploy Frontend (AWS Amplify)
1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. New app → Host web app → GitHub
3. Repository: `ghaythalijarad/entralized-delivery-platform`
4. Branch: `main`
5. Build settings: Use `amplify.yml` (should auto-detect)
6. Deploy and get frontend URL

### 5. 🔧 Update CORS Settings
Update backend CORS to allow frontend domain:
1. Edit `fastapi-template/app/config.py`
2. Add your Amplify URL to `ALLOWED_ORIGINS`
3. Commit and push to trigger backend redeploy

### 6. ✅ Test Production System
- [ ] Frontend loads correctly
- [ ] Login works with admin/admin123
- [ ] API calls successful
- [ ] Database connectivity working
- [ ] All features functional

---

## 🎯 EXPECTED PRODUCTION URLS

After deployment you'll have:
- **Frontend**: `https://main.XXXXX.amplifyapp.com`
- **Backend API**: `https://XXXXX.eu-north-1.awsapprunner.com`
- **Database**: `delivery-platform-db.clo2o2squsbf.eu-north-1.rds.amazonaws.com`

---

## 🔐 LOGIN CREDENTIALS

**Default Admin Account:**
- Username: `admin`
- Password: `admin123`
- **⚠️ CHANGE PASSWORD AFTER FIRST LOGIN!**

---

## 🆘 IF SOMETHING FAILS

### App Runner Deployment Fails
- Check CloudWatch logs in App Runner console
- Verify `requirements.txt` has all dependencies
- Check environment variables are set correctly

### Amplify Build Fails  
- Check build logs in Amplify console
- Verify `amplify.yml` configuration
- Ensure static files are in correct directory

### Authentication Not Working
- Verify backend API URL is correct in frontend
- Check CORS settings allow frontend domain
- Test API endpoints manually with curl

### Database Connection Issues
- Verify RDS security groups allow App Runner access
- Check database credentials in environment variables
- Test connection from App Runner CloudWatch logs

---

## 🎉 SUCCESS INDICATORS

You know deployment worked when:
- ✅ App Runner service shows "Running" status
- ✅ Amplify app shows "Deployed" status  
- ✅ Frontend loads and shows login page
- ✅ Login with admin/admin123 succeeds
- ✅ Dashboard loads with real-time data
- ✅ Database status shows "Connected"

**Your production system is live!** 🚀
