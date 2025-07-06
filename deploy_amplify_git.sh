#!/usr/bin/env bash
# Script to deploy backend and frontend to AWS Amplify via CLI
set -e

# Ensure AWS credentials are configured in environment:
# AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION

# Amplify App details (can be provided via env vars or hard-coded)
AMPLIFY_APP_ID="${AMPLIFY_APP_ID:-<YOUR_AMPLIFY_APP_ID>}"
AMPLIFY_ENV="${AMPLIFY_ENV_NAME:-dev}"

# Install dependencies and Amplify CLI if needed
npm ci
npm install -g @aws-amplify/cli

# Pull existing Amplify environment config
amplify pull --appId "$AMPLIFY_APP_ID" --envName "$AMPLIFY_ENV" --yes

# Push backend changes
amplify push --yes

# Build and publish frontend
amplify publish --yes
