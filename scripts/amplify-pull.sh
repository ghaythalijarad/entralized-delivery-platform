#!/usr/bin/env bash
# Pull existing Amplify project for Merchant Management System

APP_ID="d26nn5u6blbq6z"
ENV_NAME="main"

echo "🔎 Pulling existing Amplify project..."
echo "   App ID: $APP_ID"
echo "   Env:    $ENV_NAME"

amplify pull --appId "$APP_ID" --envName "$ENV_NAME" --yes

if [ $? -eq 0 ]; then
    echo "✅ Amplify project pulled successfully!"
else
    echo "❌ Failed to pull Amplify project"
    exit 1
fi
