#!/usr/bin/env python3
"""
Script to check if default admin user exists in the production RDS database.
"""
import os
from dotenv import load_dotenv
from sqlalchemy.orm import Session

# Load production environment variables
load_dotenv('.env.production', override=True)

# Import database and model
from fastapi_template.app.database import SessionLocal  # adjust import path as needed
from fastapi_template.app.models import User

# Create session
db: Session = SessionLocal()
try:
    admin = db.query(User).filter(User.username == 'admin').first()
    if admin:
        print(f"✅ Admin user exists: username='{admin.username}', email='{admin.email}', role='{admin.role.value}'")
    else:
        print("❌ Admin user not found in database.")
finally:
    db.close()
