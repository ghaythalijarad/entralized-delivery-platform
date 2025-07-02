# Production Deployment Checklist - Real RDS

## ✅ Pre-Deployment (Complete these first)

### 1. Create RDS PostgreSQL Instance
- [ ] Go to AWS RDS Console: https://console.aws.amazon.com/rds/
- [ ] Create PostgreSQL database (use RDS_QUICK_SETUP.md guide)
- [ ] Note down the endpoint (looks like: `xxx.eu-north-1.rds.amazonaws.com`)
- [ ] Note down the password you set

### 2. Update Environment Configuration
- [ ] Edit `/fastapi-template/.env` file
- [ ] Replace `REPLACE_WITH_RDS_ENDPOINT` with your RDS endpoint
- [ ] Replace `REPLACE_WITH_RDS_PASSWORD` with your RDS password
- [ ] Save the file

### 3. Test RDS Connection Locally
```bash
cd "/Users/ghaythallaheebi/centralized platform/fastapi-template"
python3 test_rds.py
```
- [ ] RDS connection test passes
- [ ] API tests with RDS pass

### 4. Run Database Migrations
```bash
cd "/Users/ghaythallaheebi/centralized platform/fastapi-template"
export ENVIRONMENT=production
alembic upgrade head
```
- [ ] Migrations run successfully
- [ ] Tables created in RDS

## 🚀 Deployment

### 5. Deploy to AWS Amplify
```bash
cd "/Users/ghaythallaheebi/centralized platform"
git add .
git commit -m "Production deployment with RDS"
git push origin main
```

### 6. Configure Amplify Environment Variables
In AWS Amplify Console, add these environment variables:
```
ENVIRONMENT=production
DEBUG=false
RDS_ENDPOINT=your-rds-endpoint.eu-north-1.rds.amazonaws.com
RDS_PORT=5432
RDS_DB_NAME=delivery_platform
RDS_USERNAME=admin
RDS_PASSWORD=your-rds-password
SECRET_KEY=prod-a8f5f167f44f4964e6c998dee827110c67890123
```
- [ ] Environment variables added in Amplify Console
- [ ] Deployment triggered

## ✅ Post-Deployment Verification

### 7. Test Production Site
- [ ] Health endpoint: `https://your-site.amplifyapp.com/health`
- [ ] Dashboard: `https://your-site.amplifyapp.com/index.html`
- [ ] API docs: `https://your-site.amplifyapp.com/docs`
- [ ] Orders page: `https://your-site.amplifyapp.com/orders.html`
- [ ] Merchants page: `https://your-site.amplifyapp.com/merchants.html`

### 8. Database Verification
```bash
# Run from your local machine
python3 "/Users/ghaythallaheebi/centralized platform/fastapi-template/test_production.py" --url https://your-site.amplifyapp.com
```
- [ ] All API endpoints working
- [ ] Real data from RDS PostgreSQL
- [ ] No mock database fallbacks

## 🎯 Success Criteria

- ✅ RDS PostgreSQL running and accessible
- ✅ FastAPI backend deployed on Amplify
- ✅ All API endpoints working with real database
- ✅ Frontend pages loading and functional
- ✅ Real-time updates working (30-second polling)
- ✅ Mobile responsive design working

## 🚨 Troubleshooting

### RDS Connection Issues
1. Check security group allows port 5432 from anywhere (0.0.0.0/0)
2. Verify RDS endpoint is correct (no typos)
3. Check username/password are correct
4. Ensure RDS instance is in "Available" state

### Amplify Build Issues
1. Check environment variables are set correctly
2. Review build logs in Amplify Console
3. Ensure all dependencies in requirements.txt

### API Issues
1. Check Amplify build logs for Python errors
2. Verify database migrations completed
3. Test individual endpoints in /docs

---

**When all checkboxes are ✅, your centralized delivery platform is live in production with real PostgreSQL database!**
