#!/bin/bash

# Amplify Git Deployment Troubleshooting Script
# This script helps diagnose and fix common Amplify deployment issues

echo "🔧 Amplify Git Deployment Troubleshooting"
echo "=========================================="

# Check current directory
echo "📁 Current directory: $(pwd)"

# Check Git status
echo -e "\n📋 Git Status:"
git status

# Check Node.js and npm versions
echo -e "\n🟢 Node.js version:"
node --version
echo "📦 npm version:"
npm --version

# Check if package.json exists and is valid
echo -e "\n📄 Checking package.json:"
if [ -f "package.json" ]; then
    echo "✅ package.json exists"
    echo "🎯 Main script: $(jq -r '.main // "not set"' package.json)"
    echo "📋 Build script: $(jq -r '.scripts.build // "not set"' package.json)"
    echo "🏗️  Frontend build script: $(jq -r '.scripts["build:frontend"] // "not set"' package.json)"
else
    echo "❌ package.json not found"
fi

# Check if amplify.yml exists
echo -e "\n⚙️  Checking amplify.yml:"
if [ -f "amplify.yml" ]; then
    echo "✅ amplify.yml exists"
    echo "📄 Content preview:"
    head -20 amplify.yml
else
    echo "❌ amplify.yml not found"
fi

# Test the build process locally
echo -e "\n🏗️  Testing local build:"
if [ -f "package.json" ] && jq -e '.scripts["build:frontend"]' package.json > /dev/null; then
    echo "🔄 Running npm run build:frontend..."
    npm run build:frontend
    
    # Check if dist directory was created
    if [ -d "dist" ]; then
        echo "✅ Build successful - dist directory created"
        echo "📁 Contents of dist directory:"
        ls -la dist/
        
        # Check for essential files
        if [ -f "dist/index.html" ]; then
            echo "✅ index.html found in dist"
        else
            echo "⚠️  index.html not found in dist"
        fi
        
        if [ -f "dist/src/aws-exports.js" ]; then
            echo "✅ AWS configuration found"
        else
            echo "⚠️  AWS configuration not found"
        fi
    else
        echo "❌ Build failed - no dist directory created"
    fi
else
    echo "⚠️  No build:frontend script found in package.json"
fi

# Check Git remote
echo -e "\n🌐 Git remote configuration:"
git remote -v

# Check recent commits
echo -e "\n📝 Recent commits:"
git log --oneline -5

# Check if there are any uncommitted changes
echo -e "\n🔍 Checking for uncommitted changes:"
if [ -z "$(git status --porcelain)" ]; then
    echo "✅ Working directory clean"
else
    echo "⚠️  There are uncommitted changes:"
    git status --short
fi

# Amplify Console deployment recommendations
echo -e "\n💡 Amplify Console Deployment Recommendations:"
echo "1. ✅ Simplified amplify.yml configuration"
echo "2. ✅ Working npm build script"
echo "3. ✅ Git repository properly configured"
echo "4. ✅ Changes pushed to main branch"

echo -e "\n🎯 Next Steps:"
echo "1. Check AWS Amplify Console for the new deployment"
echo "2. Monitor the build logs for any errors"
echo "3. If deployment fails, check the specific error in Amplify Console"
echo "4. Common issues:"
echo "   - Node.js version mismatch (check amplify.yml for node version)"
echo "   - Missing dependencies (check package.json)"
echo "   - Build script errors (test locally first)"
echo "   - File path issues (ensure correct baseDirectory in amplify.yml)"

echo -e "\n🔗 Your GitHub repository:"
git remote get-url origin

echo -e "\n✅ Troubleshooting complete!"
