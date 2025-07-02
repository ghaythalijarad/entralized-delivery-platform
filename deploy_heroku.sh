#!/bin/bash
# Heroku Deployment Script for Centralized Delivery Platform

echo "🚀 DEPLOYING TO HEROKU - PRODUCTION FASTAPI + RDS"
echo "================================================="

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI not found. Please install from: https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Login to Heroku
echo "🔑 Login to Heroku..."
heroku login

# Create Heroku app
echo "📁 Creating Heroku application..."
cd "/Users/ghaythallaheebi/centralized platform/fastapi-template"

# Create app with unique name
APP_NAME="centralized-delivery-platform-$(date +%s)"
heroku create $APP_NAME --region us

echo "✅ Created Heroku app: $APP_NAME"

# Set environment variables
echo "⚙️ Setting production environment variables..."
heroku config:set ENVIRONMENT=production -a $APP_NAME
heroku config:set DEBUG=false -a $APP_NAME
heroku config:set PORT=8080 -a $APP_NAME
heroku config:set HOST=0.0.0.0 -a $APP_NAME

# RDS Database configuration
heroku config:set RDS_ENDPOINT=delivery-platform-db.clo2o2squsbf.eu-north-1.rds.amazonaws.com -a $APP_NAME
heroku config:set RDS_PORT=5432 -a $APP_NAME
heroku config:set RDS_DB_NAME=delivery_platform -a $APP_NAME
heroku config:set RDS_USERNAME=ghayth -a $APP_NAME
heroku config:set RDS_PASSWORD=DeliveryPlatform2025! -a $APP_NAME

# Security
heroku config:set SECRET_KEY=prod-4a7d8c9e2f1b5a8c3d6e9f2a5b8c1d4e7a0b3c6d9e2f5a8b1c4d7e0a3b6c9d2e5f8a1b4c7d0 -a $APP_NAME

# Initialize git repository and deploy
echo "📦 Preparing deployment..."
git init
git add .
git commit -m "Production deployment to Heroku"

# Add Heroku remote
heroku git:remote -a $APP_NAME

# Deploy
echo "🚀 Deploying to Heroku..."
git push heroku main

echo "✅ Deployment complete!"
echo "🔗 Your app is available at: https://$APP_NAME.herokuapp.com"
echo "🎯 Admin login: admin / admin123"
echo "⚠️  Change admin password after first login!"

# Open the app
heroku open -a $APP_NAME
