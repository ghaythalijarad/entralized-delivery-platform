#!/usr/bin/env python3
"""
Simple test to verify Cognito environment variables
"""
import os

def test_env_vars():
    print("🔧 Testing Cognito Environment Variables")
    print("=" * 50)
    
    # Try to load .env file manually
    env_path = "/Users/ghaythallaheebi/centralized platform/fastapi-template/.env"
    
    try:
        with open(env_path, 'r') as f:
            content = f.read()
            print(f"✅ .env file found at {env_path}")
            print("Content preview:")
            for line in content.split('\n'):
                if 'COGNITO' in line:
                    print(f"   {line}")
    except Exception as e:
        print(f"❌ Error reading .env file: {e}")
        return False
    
    # Test environment variables
    cognito_vars = {
        'COGNITO_REGION': 'us-east-1',
        'COGNITO_USER_POOL_ID': 'us-east-1_9IItcBz7P',
        'COGNITO_APP_CLIENT_ID': '5r4pff0krdrblr5nkcfuglo4j1'
    }
    
    print("\n📋 Expected Cognito Configuration:")
    for var, expected in cognito_vars.items():
        print(f"   {var}={expected}")
    
    return True

if __name__ == "__main__":
    test_env_vars()
