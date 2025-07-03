# Database Configuration for Amazon RDS
import os
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database configuration
class DatabaseConfig:
    def __init__(self):
        self.environment = os.getenv('ENVIRONMENT', 'development')
        self.setup_database_url()
    
    def setup_database_url(self):
        # Check for explicit DATABASE_URL first
        explicit_url = os.getenv('DATABASE_URL')
        if explicit_url:
            self.DATABASE_URL = explicit_url
            return
            
        if self.environment == 'production':
            # Amazon RDS PostgreSQL configuration
            self.DATABASE_URL = (
                f"postgresql://{os.getenv('RDS_USERNAME', 'postgres')}:"
                f"{os.getenv('RDS_PASSWORD', 'password')}@"
                f"{os.getenv('RDS_ENDPOINT', 'localhost')}:"
                f"{os.getenv('RDS_PORT', '5432')}/"
                f"{os.getenv('RDS_DB_NAME', 'delivery_platform')}"
            )
        else:
            # Local development database (SQLite or local PostgreSQL)
            local_db_type = os.getenv('LOCAL_DB_TYPE', 'sqlite')
            if local_db_type == 'postgresql':
                self.DATABASE_URL = (
                    f"postgresql://{os.getenv('LOCAL_DB_USER', 'postgres')}:"
                    f"{os.getenv('LOCAL_DB_PASSWORD', 'password')}@"
                    f"{os.getenv('LOCAL_DB_HOST', 'localhost')}:"
                    f"{os.getenv('LOCAL_DB_PORT', '5432')}/"
                    f"{os.getenv('LOCAL_DB_NAME', 'delivery_platform_dev')}"
                )
            else:
                # SQLite for easy local development
                self.DATABASE_URL = "sqlite:///./delivery_platform.db"

# Initialize database configuration
db_config = DatabaseConfig()

# Create SQLAlchemy engine
engine = create_engine(
    db_config.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    echo=os.getenv('DB_ECHO', 'false').lower() == 'true'
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for models
Base = declarative_base()

# Database dependency for FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Health check function
def check_database_connection():
    try:
        db = SessionLocal()
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        db.close()
        print(f"✅ Database connected successfully ({db_config.environment})")
        print(f"🔗 Database URL: {db_config.DATABASE_URL.split('@')[0]}@***")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

# Initialize database tables
def init_database():
    """Create all database tables"""
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully")
        return True
    except Exception as e:
        print(f"❌ Failed to create database tables: {e}")
        return False
