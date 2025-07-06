#!/usr/bin/env bash
# Simple Amplify initialization script for Merchant Management System
echo "🚀 Initializing Amplify project (Simple Mode)..."

# Check if Amplify CLI is installed
if ! command -v amplify &> /dev/null; then
    echo "❌ Amplify CLI not found. Installing..."
    npm install -g @aws-amplify/cli
fi

# Check if already initialized
if [ -d "amplify" ]; then
    echo "✅ Amplify project already exists"
    exit 0
fi

echo "📦 Initializing new Amplify project..."
echo "ℹ️  Using defaults: projectName=merchantManagement, env=dev, region=eu-north-1"

# Simple initialization with minimal configuration
amplify init --yes

if [ $? -eq 0 ]; then
    echo "✅ Amplify project initialized successfully!"
    echo "📁 Created amplify/ directory with configuration"
    echo "🎯 Ready to publish with: amplify publish"
else
    echo "❌ Failed to initialize Amplify project"
    exit 1
fi
