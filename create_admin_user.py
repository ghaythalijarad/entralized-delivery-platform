#!/usr/bin/env python3
"""
Create admin user in Cognito User Pool for testing
"""

import boto3
import sys
from botocore.exceptions import ClientError

# Cognito configuration from your cognito.env
COGNITO_REGION = "us-east-1"
COGNITO_USER_POOL_ID = "us-east-1_9IItcBz7P"

def create_admin_user():
    """Create an admin user in Cognito User Pool"""
    
    client = boto3.client('cognito-idp', region_name=COGNITO_REGION)
    
    username = "admin"
    temporary_password = "TempPass123!"
    permanent_password = "AdminPass123!"
    email = "admin@example.com"
    
    try:
        # Create user
        print(f"Creating user: {username}")
        response = client.admin_create_user(
            UserPoolId=COGNITO_USER_POOL_ID,
            Username=username,
            UserAttributes=[
                {
                    'Name': 'email',
                    'Value': email
                },
                {
                    'Name': 'email_verified',
                    'Value': 'true'
                }
            ],
            TemporaryPassword=temporary_password,
            MessageAction='SUPPRESS'  # Don't send welcome email
        )
        print(f"✅ User created successfully: {response['User']['Username']}")
        
        # Set permanent password
        print("Setting permanent password...")
        client.admin_set_user_password(
            UserPoolId=COGNITO_USER_POOL_ID,
            Username=username,
            Password=permanent_password,
            Permanent=True
        )
        print("✅ Permanent password set")
        
        # Add user to admin group (create group if it doesn't exist)
        try:
            print("Creating admin group...")
            client.create_group(
                GroupName='admin',
                UserPoolId=COGNITO_USER_POOL_ID,
                Description='Administrators group'
            )
            print("✅ Admin group created")
        except ClientError as e:
            if e.response['Error']['Code'] == 'GroupExistsException':
                print("ℹ️  Admin group already exists")
            else:
                raise
        
        # Add user to admin group
        print(f"Adding {username} to admin group...")
        client.admin_add_user_to_group(
            UserPoolId=COGNITO_USER_POOL_ID,
            Username=username,
            GroupName='admin'
        )
        print("✅ User added to admin group")
        
        print("\n🎉 Admin user setup complete!")
        print("=" * 50)
        print(f"Username: {username}")
        print(f"Password: {permanent_password}")
        print(f"Email: {email}")
        print(f"Group: admin")
        print("=" * 50)
        print("\nYou can now use these credentials to login to:")
        print("https://main.d1l2ynfxs4bd2p.amplifyapp.com")
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'UsernameExistsException':
            print(f"ℹ️  User {username} already exists")
            
            # Try to set password anyway in case it needs updating
            try:
                print("Updating password for existing user...")
                client.admin_set_user_password(
                    UserPoolId=COGNITO_USER_POOL_ID,
                    Username=username,
                    Password=permanent_password,
                    Permanent=True
                )
                print("✅ Password updated")
                
                # Ensure user is in admin group
                try:
                    client.admin_add_user_to_group(
                        UserPoolId=COGNITO_USER_POOL_ID,
                        Username=username,
                        GroupName='admin'
                    )
                    print("✅ User confirmed in admin group")
                except ClientError as e:
                    if e.response['Error']['Code'] != 'UserNotConfirmedException':
                        print(f"ℹ️  {e.response['Error']['Message']}")
                
                print("\n🎉 Existing user updated!")
                print("=" * 50)
                print(f"Username: {username}")
                print(f"Password: {permanent_password}")
                print(f"Email: {email}")
                print(f"Group: admin")
                print("=" * 50)
                
            except ClientError as e:
                print(f"❌ Error updating existing user: {e.response['Error']['Message']}")
                
        else:
            print(f"❌ Error creating user: {e.response['Error']['Message']}")
            return False
    
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return False
    
    return True

if __name__ == "__main__":
    print("🚀 Setting up admin user in Cognito User Pool...")
    print(f"Region: {COGNITO_REGION}")
    print(f"User Pool ID: {COGNITO_USER_POOL_ID}")
    print()
    
    success = create_admin_user()
    
    if success:
        print("\n✅ Setup completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Setup failed!")
        sys.exit(1)
