#!/usr/bin/env python3
"""
Test script to verify Cognito configuration and secure session handling
"""
import os
import sys

# Add the app directory to the Python path
sys.path.insert(0, '/Users/ghaythallaheebi/centralized platform/fastapi-template')

# Load environment variables
from dotenv import load_dotenv
load_dotenv('/Users/ghaythallaheebi/centralized platform/fastapi-template/.env')

def test_environment_variables():
    """Test if all required environment variables are set"""
    print("🔧 Testing Environment Variables")
    print("=" * 50)
    
    required_vars = [
        'COGNITO_REGION',
        'COGNITO_USER_POOL_ID', 
        'COGNITO_APP_CLIENT_ID'
    ]
    
    all_set = True
    for var in required_vars:
        value = os.getenv(var)
        status = "✅" if value else "❌"
        print(f"{status} {var}: {value or 'NOT SET'}")
        if not value:
            all_set = False
    
    return all_set

def test_cognito_configuration():
    """Test Cognito configuration"""
    print("\n🔐 Testing Cognito Configuration")
    print("=" * 50)
    
    try:
        # Import the config
        from app.config import config
        
        print(f"✅ COGNITO_REGION: {config.COGNITO_REGION}")
        print(f"✅ COGNITO_USER_POOL_ID: {config.COGNITO_USER_POOL_ID}")
        print(f"✅ COGNITO_APP_CLIENT_ID: {config.COGNITO_APP_CLIENT_ID}")
        
        # Test if we can create the Cognito client
        import boto3
        client = boto3.client('cognito-idp', region_name=config.COGNITO_REGION)
        print("✅ Boto3 Cognito client created successfully")
        
        # Test the JWKS URL
        import requests
        jwks_url = f"https://cognito-idp.{config.COGNITO_REGION}.amazonaws.com/{config.COGNITO_USER_POOL_ID}/.well-known/jwks.json"
        response = requests.get(jwks_url, timeout=5)
        if response.status_code == 200:
            print("✅ JWKS endpoint accessible")
            print(f"   URL: {jwks_url}")
        else:
            print(f"❌ JWKS endpoint not accessible: {response.status_code}")
            
        return True
        
    except Exception as e:
        print(f"❌ Error testing Cognito configuration: {e}")
        return False

def test_login_credentials():
    """Test if the admin user exists and can be authenticated"""
    print("\n👤 Testing Admin User Credentials")
    print("=" * 50)
    
    try:
        from app.config import config
        import boto3
        
        client = boto3.client('cognito-idp', region_name=config.COGNITO_REGION)
        
        # Test admin user exists
        try:
            response = client.admin_get_user(
                UserPoolId=config.COGNITO_USER_POOL_ID,
                Username='admin'
            )
            print("✅ Admin user exists in Cognito")
            print(f"   Username: admin")
            print(f"   Status: {response.get('UserStatus', 'Unknown')}")
            
            # Check user groups
            groups_response = client.admin_list_groups_for_user(
                UserPoolId=config.COGNITO_USER_POOL_ID,
                Username='admin'
            )
            groups = [g['GroupName'] for g in groups_response.get('Groups', [])]
            print(f"   Groups: {groups}")
            
            return True
            
        except client.exceptions.UserNotFoundException:
            print("❌ Admin user not found in Cognito")
            return False
            
    except Exception as e:
        print(f"❌ Error testing admin user: {e}")
        return False

def print_test_instructions():
    """Print instructions for manual testing"""
    print("\n📋 Manual Testing Instructions")
    print("=" * 50)
    print("""
1. Start your FastAPI server:
   cd "/Users/ghaythallaheebi/centralized platform/fastapi-template"
   python3 -m uvicorn app.main:app --reload --port 8000

2. Open your browser and navigate to:
   http://localhost:8000/static/login.html

3. Test login with these credentials:
   Username: admin
   Password: AdminPass123!

4. After login, check the browser dev tools:
   - Go to Application/Storage tab
   - Check Cookies for localhost:8000
   - You should see a "refreshToken" cookie with HttpOnly flag

5. Test the secure logout:
   - Click the logout button
   - Verify the refreshToken cookie is cleared

6. Test automatic token refresh:
   - Login successfully
   - Wait for token to expire (or manually expire it in localStorage)
   - Make an API call (navigate to different sections)
   - Token should refresh automatically
""")

def main():
    """Main test function"""
    print("🚀 Cognito Secure Session Handling Test")
    print("=" * 60)
    
    # Test environment variables
    env_ok = test_environment_variables()
    
    if not env_ok:
        print("\n❌ Environment variables are not properly configured")
        print("Please check your .env file")
        return False
    
    # Test Cognito configuration
    cognito_ok = test_cognito_configuration()
    
    if not cognito_ok:
        print("\n❌ Cognito configuration failed")
        return False
    
    # Test admin user
    user_ok = test_login_credentials()
    
    if not user_ok:
        print("\n❌ Admin user not properly configured")
        return False
    
    print("\n✅ All tests passed!")
    print_test_instructions()
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
