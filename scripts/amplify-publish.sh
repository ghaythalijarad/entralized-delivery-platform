#!/usr/bin/env bash
# Quick Amplify CLI publish script for Merchant Management System
echo "🔨 Building and publishing to AWS Amplify..."

# Check if Amplify project exists
if [ ! -d "amplify" ]; then
    echo "❌ No Amplify project found. Initializing first..."
    ./scripts/amplify-init.sh
    if [ $? -ne 0 ]; then
        echo "❌ Failed to initialize Amplify project"
        exit 1
    fi
fi

# Ensure correct environment
echo "🔄 Switching to dev environment..."
amplify env checkout dev

# Prepare build directory
echo "📦 Preparing build files..."
mkdir -p dist
cp -r src/* dist/
cp -r assets/* dist/ 2>/dev/null || echo "No assets directory found"

# Create index.html if it doesn't exist
if [ ! -f "dist/index.html" ]; then
    echo "📝 Creating index.html..."
    cat > dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Merchant Management System</title>
    <meta http-equiv="refresh" content="0; url=pages/login-aws-native.html">
</head>
<body>
    <h1>🏪 Merchant Management System</h1>
    <p>Redirecting to <a href="pages/login-aws-native.html">Login Page</a>...</p>
</body>
</html>
EOF
fi

# Publish to Amplify
echo "🚀 Publishing to Amplify..."
amplify publish --yes

echo "🎉 Amplify publish complete! Check the URL above to access your app."
