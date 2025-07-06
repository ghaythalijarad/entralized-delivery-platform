#!/usr/bin/env python3
"""
Test script for User Management API endpoints
"""

import requests
import json

# Configuration
API_BASE = "https://l17hfioxt7.execute-api.eu-north-1.amazonaws.com/api"
ADMIN_CREDENTIALS = {
    "username": "admin@centralized.com",
    "password": "AdminPass123!"
}

def test_authentication():
    """Test authentication and get access token"""
    print("🔐 Testing Authentication...")
    
    try:
        # Login
        response = requests.post(
            f"{API_BASE}/auth/login",
            json=ADMIN_CREDENTIALS,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                token = data["token"]["access_token"]
                print(f"✅ Authentication successful!")
                print(f"Token: {token[:50]}...")
                return token
            else:
                print(f"❌ Authentication failed: {data.get('message')}")
                return None
        else:
            print(f"❌ Authentication failed with status: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ Authentication error: {str(e)}")
        return None

def test_user_list(token):
    """Test user listing endpoint"""
    print("\n👥 Testing User List...")
    
    try:
        response = requests.get(
            f"{API_BASE}/admin/cognito/users",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            users = data.get("users", [])
            print(f"✅ User list retrieved successfully!")
            print(f"Total users: {len(users)}")
            
            for user in users:
                print(f"  - {user.get('username')} | Groups: {user.get('groups')} | Email: {user.get('email')}")
                
            return True
        else:
            print(f"❌ User list failed with status: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ User list error: {str(e)}")
        return False

def test_user_creation(token):
    """Test user creation endpoint"""
    print("\n➕ Testing User Creation...")
    
    test_user = {
        "username": "test.user@example.com",
        "email": "test.user@example.com",
        "password": "TestPass123!",
        "full_name": "Test User"
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/admin/cognito/users",
            json=test_user,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                print(f"✅ User created successfully!")
                print(f"User: {data.get('user')}")
                return True
            else:
                print(f"❌ User creation failed: {data.get('message')}")
                return False
        else:
            print(f"❌ User creation failed with status: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ User creation error: {str(e)}")
        return False

def test_group_management(token):
    """Test group management endpoints"""
    print("\n🔑 Testing Group Management...")
    
    try:
        # Add user to viewer group
        response = requests.post(
            f"{API_BASE}/admin/cognito/users/test.user@example.com/groups/viewer",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
        )
        
        if response.status_code == 200:
            print(f"✅ User added to viewer group successfully!")
            
            # Remove user from viewer group
            response = requests.delete(
                f"{API_BASE}/admin/cognito/users/test.user@example.com/groups/viewer",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                }
            )
            
            if response.status_code == 200:
                print(f"✅ User removed from viewer group successfully!")
                return True
            else:
                print(f"❌ Group removal failed with status: {response.status_code}")
                return False
        else:
            print(f"❌ Group addition failed with status: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Group management error: {str(e)}")
        return False

def cleanup_test_user(token):
    """Clean up test user"""
    print("\n🧹 Cleaning up test user...")
    
    try:
        response = requests.delete(
            f"{API_BASE}/admin/cognito/users/test.user@example.com",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
        )
        
        if response.status_code == 200:
            print(f"✅ Test user cleaned up successfully!")
            return True
        else:
            print(f"⚠️  Cleanup failed with status: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Cleanup error: {str(e)}")
        return False

def main():
    """Main test function"""
    print("🚀 User Management API Test Suite")
    print("=" * 50)
    
    # Test authentication
    token = test_authentication()
    if not token:
        print("❌ Cannot continue without authentication")
        return
    
    # Test user list
    test_user_list(token)
    
    # Test user creation
    if test_user_creation(token):
        # Test group management
        test_group_management(token)
        
        # Clean up
        cleanup_test_user(token)
    
    print("\n" + "=" * 50)
    print("🎉 Test Suite Complete!")

if __name__ == "__main__":
    main()
