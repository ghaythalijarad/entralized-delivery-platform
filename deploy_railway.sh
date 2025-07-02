#!/bin/bash
# Railway Deployment Script for Centralized Delivery Platform

echo "🚀 DEPLOYING TO RAILWAY - PRODUCTION FASTAPI"
echo "=============================================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway
echo "🔑 Login to Railway..."
railway login

# Create new project
echo "📁 Creating Railway project..."
cd "/Users/ghaythallaheebi/centralized platform/fastapi-template"
railway init

# Set environment variables
echo "⚙️ Setting production environment variables..."
railway variables set ENVIRONMENT=production
railway variables set DEBUG=false
railway variables set PORT=8080
railway variables set HOST=0.0.0.0

# RDS Database configuration
railway variables set RDS_ENDPOINT=delivery-platform-db.clo2o2squsbf.eu-north-1.rds.amazonaws.com
railway variables set RDS_PORT=5432
railway variables set RDS_DB_NAME=delivery_platform
railway variables set RDS_USERNAME=ghayth
railway variables set RDS_PASSWORD=DeliveryPlatform2025!

# Security
railway variables set SECRET_KEY=prod-4a7d8c9e2f1b5a8c3d6e9f2a5b8c1d4e7a0b3c6d9e2f5a8b1c4d7e0a3b6c9d2e5f8a1b4c7d0

# Deploy
echo "🚀 Deploying application..."
railway up

echo "✅ Deployment complete! Your app will be available at the Railway URL"
echo "🔗 Check your deployment at: https://railway.app/dashboard"
