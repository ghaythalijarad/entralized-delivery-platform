#!/usr/bin/env python3
"""
Simple test to check database connectivity
"""

import sys
import os
sys.path.append('/Users/ghaythallaheebi/centralized platform/fastapi-template')

from app.database import check_database_connection, init_database

print("Testing database connection...")
try:
    if check_database_connection():
        print("✅ Database connection successful")
        init_database()
        print("✅ Database initialization successful")
    else:
        print("❌ Database connection failed")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
