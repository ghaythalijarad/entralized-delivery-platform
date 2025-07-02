# Quick RDS Setup for Real Production

## Option A: AWS Console (Manual - Fastest)

1. **Go to RDS Console**: https://console.aws.amazon.com/rds/
2. **Click "Create database"**
3. **Configuration**:
   - Engine: PostgreSQL
   - Version: 15.7 (latest)
   - Template: Free tier
   - DB instance identifier: `delivery-platform-db`
   - Master username: `admin`
   - Master password: `DeliveryPlatform2025!` (or generate one)
   - DB instance class: `db.t3.micro` (Free tier)
   - Storage: 20 GB
   - Public access: **Yes** (for initial setup)

4. **Security Group**:
   - Create new security group: `delivery-platform-sg`
   - Add inbound rule: PostgreSQL (5432) from Anywhere (0.0.0.0/0)

5. **Additional Settings**:
   - Initial database name: `delivery_platform`
   - Backup retention: 7 days
   - Enable Enhanced monitoring

6. **Create Database** (takes 5-10 minutes)

## Option B: AWS CLI (After fixing credentials)

```bash
# Run this when AWS CLI works
cd "/Users/ghaythallaheebi/centralized platform/fastapi-template/scripts"
./create_rds.sh
```

## After RDS is Created

1. **Get the endpoint** from RDS console (looks like: `delivery-platform-db.xxxxx.eu-north-1.rds.amazonaws.com`)

2. **Update .env file**:
```env
ENVIRONMENT=production
DEBUG=false
RDS_ENDPOINT=your-rds-endpoint-here.eu-north-1.rds.amazonaws.com
RDS_PORT=5432
RDS_DB_NAME=delivery_platform
RDS_USERNAME=admin
RDS_PASSWORD=DeliveryPlatform2025!
SECRET_KEY=prod-$(openssl rand -hex 32)
```

3. **Test connection locally**:
```bash
cd "/Users/ghaythallaheebi/centralized platform/fastapi-template"
python3 -c "from app.database import check_database_connection; print('RDS Connected:', check_database_connection())"
```

4. **Run migrations**:
```bash
export ENVIRONMENT=production
alembic upgrade head
```

5. **Deploy to Amplify with RDS environment variables**

## Quick Deploy Steps

1. Create RDS (5-10 min)
2. Update .env with RDS endpoint
3. Test locally with RDS
4. Push to git and deploy on Amplify
5. Set environment variables in Amplify Console
6. Your app will be live with real PostgreSQL!
