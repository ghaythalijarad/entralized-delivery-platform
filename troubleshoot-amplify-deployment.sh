#!/bin/bash

echo "🔍 Amplify Deployment Troubleshooting Script"
echo "=============================================="
echo ""

# Check if we're in the right directory
if [ ! -f "amplify.yml" ]; then
    echo "❌ Error: amplify.yml not found. Make sure you're in the project root directory."
    exit 1
fi

echo "✅ Found amplify.yml"
echo ""

# Check Node.js version
echo "📋 Environment Check:"
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"
echo ""

# Check if package.json exists and has proper scripts
if [ -f "package.json" ]; then
    echo "✅ Found package.json"
    echo "Checking build scripts..."
    
    if grep -q "build:amplify" package.json; then
        echo "✅ build:amplify script found"
    else
        echo "⚠️  build:amplify script not found"
    fi
else
    echo "❌ package.json not found"
fi

echo ""

# Check required files
echo "📁 File Structure Check:"
files_to_check=("index.html" "login-aws-native.html" "src/" "amplify.yml")

for file in "${files_to_check[@]}"; do
    if [ -e "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

echo ""

# Check amplify.yml content
echo "🔧 Amplify Configuration:"
echo "Build command in amplify.yml:"
grep -A 5 "build:" amplify.yml | head -6

echo ""

# Test build locally
echo "🛠️  Testing Local Build:"
echo "Running local build test..."

if npm run build:amplify; then
    echo "✅ Local build successful"
    
    if [ -d "build" ]; then
        echo "✅ Build directory created"
        echo "Build contents:"
        ls -la build/
    else
        echo "❌ Build directory not created"
    fi
else
    echo "❌ Local build failed"
fi

echo ""

# Git status
echo "📝 Git Status:"
git status --porcelain | head -10

echo ""

# Recent commits
echo "📚 Recent Commits:"
git log --oneline -5

echo ""

echo "🚀 Amplify Deployment Status:"
echo "Check your Amplify console at:"
echo "https://console.aws.amazon.com/amplify/home#/d2ina1trm0zag3"
echo ""
echo "If deployment is still failing, check the Amplify build logs for specific errors."
echo ""
echo "Common fixes:"
echo "1. Ensure all file paths in amplify.yml are correct"
echo "2. Check that Node.js version matches (18+)"
echo "3. Verify all dependencies are in package.json"
echo "4. Make sure index.html is not empty"
echo "5. Check that src/ directory and files exist"
