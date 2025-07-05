"""
Production configuration for AWS deployment
"""
import os
from datetime import timedelta

class ProductionConfig:
    # Environment
    ENVIRONMENT = "production"
    DEBUG = False
    TESTING = False
    
    # Security
    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
    
    # CORS - Configure for your domain
    ALLOWED_ORIGINS = [
        "https://main.d1l2ynfxs4bd2p.amplifyapp.com",
        "https://*.amplifyapp.com",
        "*"  # For development - remove in production
    ]
    
    # Database
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./delivery_platform_prod.db")
    DB_ECHO = False
    
    # API Configuration
    API_V1_PREFIX = "/api"
    PROJECT_NAME = "Centralized Delivery Platform"
    VERSION = "1.0.0"
    
    # File uploads
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    ALLOWED_FILE_TYPES = ["jpg", "jpeg", "png", "pdf"]
    
    # Rate limiting
    RATE_LIMIT_PER_MINUTE = 60
    
    # Cache
    CACHE_TTL = 300  # 5 minutes
    
    # Logging
    LOG_LEVEL = "INFO"
    
    # AWS Cognito Configuration
    COGNITO_REGION = os.getenv("COGNITO_REGION", "us-east-1")
    COGNITO_USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID", "your-user-pool-id")
    COGNITO_APP_CLIENT_ID = os.getenv("COGNITO_APP_CLIENT_ID", "your-app-client-id")
    
class DevelopmentConfig:
    ENVIRONMENT = "development"
    DEBUG = True
    SECRET_KEY = "dev-secret-key"
    ALLOWED_ORIGINS = ["*"]  # Allow all origins in development
    DATABASE_URL = "sqlite:///./delivery_platform_dev.db"
    DB_ECHO = True
    
    # Project info
    PROJECT_NAME = "Centralized Delivery Platform"
    VERSION = "1.0.0"
    API_V1_PREFIX = "/api"
    ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24
    
    # Logging
    LOG_LEVEL = "DEBUG"
    
    # File uploads
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    ALLOWED_FILE_TYPES = ["jpg", "jpeg", "png", "pdf"]
    
    # Rate limiting
    RATE_LIMIT_PER_MINUTE = 100

# Get config based on environment
def get_config():
    env = os.getenv("ENVIRONMENT", "development")
    if env == "production":
        return ProductionConfig()
    return DevelopmentConfig()

# Expose a singleton config object
config = get_config()
