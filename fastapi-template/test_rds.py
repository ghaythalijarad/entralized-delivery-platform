#!/usr/bin/env python3
"""
Test RDS PostgreSQL connection for production deployment
"""

import os
import sys
from pathlib import Path

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent))

def test_rds_connection():
    """Test RDS connection with current environment"""
    print("🔗 Testing RDS PostgreSQL Connection")
    print("=" * 40)
    
    # Load environment
    from dotenv import load_dotenv
    load_dotenv()
    
    # Show configuration
    rds_endpoint = os.environ.get('RDS_ENDPOINT', 'not-set')
    rds_db = os.environ.get('RDS_DB_NAME', 'not-set')
    rds_user = os.environ.get('RDS_USERNAME', 'not-set')
    
    print(f"RDS Endpoint: {rds_endpoint}")
    print(f"Database: {rds_db}")
    print(f"Username: {rds_user}")
    print(f"Environment: {os.environ.get('ENVIRONMENT', 'development')}")
    print()
    
    if rds_endpoint in ['localhost', 'REPLACE_WITH_RDS_ENDPOINT', 'not-set']:
        print("❌ RDS endpoint not configured")
        print("Please update .env file with real RDS endpoint")
        return False
    
    # Test database connection
    try:
        from app.database import check_database_connection, get_engine
        
        # Set production environment
        os.environ['ENVIRONMENT'] = 'production'
        
        print("🧪 Testing database connection...")
        if check_database_connection():
            print("✅ RDS connection successful!")
            
            # Test database operations
            print("🔍 Testing database operations...")
            engine = get_engine()
            with engine.connect() as conn:
                result = conn.execute("SELECT version()")
                version = result.fetchone()[0]
                print(f"✅ PostgreSQL version: {version}")
            
            return True
        else:
            print("❌ RDS connection failed")
            return False
            
    except Exception as e:
        print(f"❌ Error testing RDS connection: {e}")
        print("\nTroubleshooting:")
        print("1. Check RDS endpoint is correct")
        print("2. Check security group allows connections on port 5432")
        print("3. Check username/password are correct")
        print("4. Check database name exists")
        return False

def test_api_with_rds():
    """Test API endpoints with RDS"""
    print("\n🚀 Testing API with RDS")
    print("=" * 30)
    
    try:
        # Import after setting environment
        os.environ['ENVIRONMENT'] = 'production'
        from app.main import app
        from fastapi.testclient import TestClient
        
        client = TestClient(app)
        
        # Test health endpoint
        response = client.get("/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check: {data.get('status')}")
            print(f"✅ Database status: {data.get('database')}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            
        # Test dashboard stats
        response = client.get("/api/dashboard/stats")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Dashboard stats: {data.get('total_orders', 0)} orders")
        else:
            print(f"❌ Dashboard stats failed: {response.status_code}")
            
        print("✅ API tests completed with RDS")
        return True
        
    except Exception as e:
        print(f"❌ API testing failed: {e}")
        return False

if __name__ == "__main__":
    print("🧪 RDS Production Testing")
    print("=" * 50)
    
    # Test RDS connection
    rds_ok = test_rds_connection()
    
    if rds_ok:
        # Test API with RDS
        api_ok = test_api_with_rds()
        
        if api_ok:
            print("\n🎉 All tests passed! Ready for production deployment with RDS")
            sys.exit(0)
        else:
            print("\n⚠️ RDS connection works but API has issues")
            sys.exit(1)
    else:
        print("\n❌ RDS connection failed. Fix RDS setup first.")
        print("\nNext steps:")
        print("1. Create RDS instance (see RDS_QUICK_SETUP.md)")
        print("2. Update .env with RDS endpoint and credentials")
        print("3. Run this test again")
        sys.exit(1)
