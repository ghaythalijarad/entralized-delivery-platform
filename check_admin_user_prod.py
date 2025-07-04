#!/usr/bin/env python3
"""
Script to check if default admin user exists in the production RDS database.
"""
import os
import sys

# Load environment variables from fastapi-template/.env.production
env_file = 'fastapi-template/.env.production'
if not os.path.exists(env_file):
    print(f"❌ {env_file} not found")
    sys.exit(1)
with open(env_file) as f:
    for line in f:
        if line.strip() and not line.strip().startswith('#') and '=' in line:
            key, value = line.strip().split('=', 1)
            os.environ[key] = value

# Add fastapi-template to path
project_dir = os.path.join(os.getcwd(), 'fastapi-template')
if project_dir not in sys.path:
    sys.path.insert(0, project_dir)

# Import database and User model
try:
    from app.database import SessionLocal
    from app.models import User
except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)

# Query for admin user
db = SessionLocal()
admin = db.query(User).filter(User.username == 'admin').first()
if admin:
    print(f"✅ Admin user exists: username='{admin.username}', email='{admin.email}', role='{admin.role.value}'")
else:
    print("❌ Admin user not found in production database.")
db.close()
