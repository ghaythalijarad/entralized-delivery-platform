#!/usr/bin/env bash
# Initialize Amplify project for Merchant Management System
echo "🚀 Initializing Amplify project for Merchant Management System..."

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

# Create temporary config files for Amplify init
cat > /tmp/amplify-config.json << 'EOF'
{
    "projectName": "merchantManagement",
    "envName": "dev",
    "defaultEditor": "code"
}
EOF

cat > /tmp/frontend-config.json << 'EOF'
{
    "frontend": "javascript",
    "framework": "none",
    "config": {
        "SourceDir": "src",
        "DistributionDir": "dist",
        "BuildCommand": "echo 'Building...' && mkdir -p dist && cp -r src/* dist/",
        "StartCommand": "echo 'Starting...'"
    }
}
EOF

cat > /tmp/providers-config.json << 'EOF'
{
    "awscloudformation": {
        "configLevel": "project",
        "useProfile": true,
        "profileName": "default",
        "region": "eu-north-1"
    }
}
EOF

# Initialize Amplify project with configuration files
amplify init \
    --amplify /tmp/amplify-config.json \
    --frontend /tmp/frontend-config.json \
    --providers /tmp/providers-config.json \
    --yes

# Clean up temporary files
rm -f /tmp/amplify-config.json /tmp/frontend-config.json /tmp/providers-config.json

if [ $? -eq 0 ]; then
    echo "✅ Amplify project initialized successfully!"
    echo "📁 Created amplify/ directory with configuration"
    echo "🎯 Ready to publish with: amplify publish"
else
    echo "❌ Failed to initialize Amplify project"
    exit 1
fi
