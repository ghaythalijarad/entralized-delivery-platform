#!/usr/bin/env python3
"""
Test the complete authentication flow
"""
import requests
import json

API_BASE = "https://l17hfioxt7.execute-api.eu-north-1.amazonaws.com/api"

def test_health():
    """Test health endpoint"""
    print("🔍 Testing health endpoint...")
    try:
        response = requests.get(f"{API_BASE}/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Health test failed: {e}")
        return False

def test_login():
    """Test login endpoint"""
    print("\n🔍 Testing login endpoint...")
    try:
        data = {
            "username": "admin@centralized.com",
            "password": "AdminPass123!"
        }
        
        response = requests.post(
            f"{API_BASE}/auth/login",
            json=data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            return response.json()
        else:
            return None
            
    except Exception as e:
        print(f"❌ Login test failed: {e}")
        return None

def test_cognito_users(token):
    """Test Cognito users endpoint"""
    print("\n🔍 Testing Cognito users endpoint...")
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(f"{API_BASE}/admin/cognito/users", headers=headers)
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        return response.status_code == 200
        
    except Exception as e:
        print(f"❌ Cognito users test failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Testing Centralized Delivery Platform API")
    print("=" * 50)
    
    # Test health
    health_ok = test_health()
    
    if health_ok:
        print("✅ Health check passed")
        
        # Test login
        login_response = test_login()
        
        if login_response:
            print("✅ Login test passed")
            
            # Extract token
            token = login_response.get("token", {}).get("access_token")
            
            if token:
                print(f"📝 Token received: {token[:50]}...")
                
                # Test protected endpoints
                users_ok = test_cognito_users(token)
                
                if users_ok:
                    print("✅ Cognito users test passed")
                else:
                    print("❌ Cognito users test failed")
            else:
                print("❌ No token received")
        else:
            print("❌ Login test failed")
    else:
        print("❌ Health check failed")
    
    print("\n" + "=" * 50)
    print("🏁 Testing complete")
