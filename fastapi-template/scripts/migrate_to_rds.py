#!/usr/bin/env python3
"""
Migration Script: SQLite to Amazon RDS PostgreSQL
This script helps migrate data from local SQLite database to Amazon RDS PostgreSQL.
"""

import os
import sys
import sqlite3
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# Add the parent directory to the path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import DatabaseConfig, Base
from app.models import Merchant, Driver, Customer, Order, OrderItem

def setup_rds_connection():
    """Setup connection to RDS PostgreSQL database"""
    print("🔗 Setting up RDS PostgreSQL connection...")
    
    # Ensure we're using production environment
    os.environ['ENVIRONMENT'] = 'production'
    
    db_config = DatabaseConfig()
    
    if not all([
        os.getenv('RDS_ENDPOINT'),
        os.getenv('RDS_USERNAME'),
        os.getenv('RDS_PASSWORD'),
        os.getenv('RDS_DB_NAME')
    ]):
        print("❌ Missing RDS environment variables. Please check your .env file.")
        print("Required variables: RDS_ENDPOINT, RDS_USERNAME, RDS_PASSWORD, RDS_DB_NAME")
        return None, None
    
    try:
        engine = create_engine(db_config.DATABASE_URL, echo=True)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        
        # Test connection
        session = SessionLocal()
        session.execute("SELECT 1")
        session.close()
        
        print("✅ RDS PostgreSQL connection established successfully")
        return engine, SessionLocal
    
    except Exception as e:
        print(f"❌ Failed to connect to RDS PostgreSQL: {e}")
        return None, None

def setup_sqlite_connection():
    """Setup connection to local SQLite database"""
    print("🔗 Setting up SQLite connection...")
    
    sqlite_path = "delivery_platform.db"
    
    if not os.path.exists(sqlite_path):
        print(f"❌ SQLite database not found: {sqlite_path}")
        return None
    
    try:
        conn = sqlite3.connect(sqlite_path)
        conn.row_factory = sqlite3.Row  # Enable column access by name
        print("✅ SQLite connection established successfully")
        return conn
    
    except Exception as e:
        print(f"❌ Failed to connect to SQLite: {e}")
        return None

def migrate_table_data(sqlite_conn, rds_session, table_name, model_class):
    """Migrate data from SQLite table to RDS PostgreSQL table"""
    print(f"📊 Migrating {table_name} data...")
    
    try:
        # Get data from SQLite
        cursor = sqlite_conn.cursor()
        cursor.execute(f"SELECT * FROM {table_name}")
        rows = cursor.fetchall()
        
        if not rows:
            print(f"ℹ️  No data found in {table_name} table")
            return True
        
        # Clear existing data in PostgreSQL (optional)
        rds_session.query(model_class).delete()
        rds_session.commit()
        
        # Insert data into PostgreSQL
        migrated_count = 0
        for row in rows:
            row_dict = dict(row)
            
            # Convert datetime strings to datetime objects if needed
            for key, value in row_dict.items():
                if key.endswith('_at') or key.endswith('_time') and isinstance(value, str):
                    try:
                        row_dict[key] = datetime.fromisoformat(value.replace('Z', '+00:00'))
                    except:
                        pass
            
            # Create model instance
            instance = model_class(**row_dict)
            rds_session.add(instance)
            migrated_count += 1
        
        rds_session.commit()
        print(f"✅ Successfully migrated {migrated_count} records from {table_name}")
        return True
    
    except Exception as e:
        print(f"❌ Failed to migrate {table_name}: {e}")
        rds_session.rollback()
        return False

def create_rds_tables(rds_engine):
    """Create all tables in RDS PostgreSQL"""
    print("🏗️  Creating tables in RDS PostgreSQL...")
    
    try:
        Base.metadata.create_all(bind=rds_engine)
        print("✅ All tables created successfully in RDS PostgreSQL")
        return True
    
    except Exception as e:
        print(f"❌ Failed to create tables in RDS PostgreSQL: {e}")
        return False

def verify_migration(rds_session):
    """Verify the migration by checking record counts"""
    print("🔍 Verifying migration...")
    
    tables = [
        ("merchants", Merchant),
        ("drivers", Driver), 
        ("customers", Customer),
        ("orders", Order),
        ("order_items", OrderItem)
    ]
    
    for table_name, model_class in tables:
        try:
            count = rds_session.query(model_class).count()
            print(f"📈 {table_name}: {count} records")
        except Exception as e:
            print(f"⚠️  Could not verify {table_name}: {e}")

def main():
    """Main migration function"""
    print("🚀 Starting migration from SQLite to Amazon RDS PostgreSQL...")
    print("=" * 60)
    
    # Setup connections
    sqlite_conn = setup_sqlite_connection()
    if not sqlite_conn:
        return False
    
    rds_engine, RDSSessionLocal = setup_rds_connection()
    if not rds_engine or not RDSSessionLocal:
        sqlite_conn.close()
        return False
    
    rds_session = RDSSessionLocal()
    
    try:
        # Create tables in RDS
        if not create_rds_tables(rds_engine):
            return False
        
        # Migration order (respecting foreign key constraints)
        migration_order = [
            ("customers", Customer),
            ("merchants", Merchant),
            ("drivers", Driver),
            ("orders", Order),
            ("order_items", OrderItem)
        ]
        
        # Migrate each table
        success = True
        for table_name, model_class in migration_order:
            if not migrate_table_data(sqlite_conn, rds_session, table_name, model_class):
                success = False
                break
        
        if success:
            print("\n🎉 Migration completed successfully!")
            verify_migration(rds_session)
            
            # Update environment to use RDS
            print("\n📝 Don't forget to:")
            print("1. Set ENVIRONMENT=production in your .env file")
            print("2. Update your deployment with RDS environment variables")
            print("3. Test your application with the new database")
            
        else:
            print("\n❌ Migration failed. Please check the errors above.")
            
        return success
    
    finally:
        # Clean up connections
        rds_session.close()
        sqlite_conn.close()
        rds_engine.dispose()

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
