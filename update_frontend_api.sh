#!/bin/bash
# Update frontend to use production API URL

if [ -z "$1" ]; then
    echo "❌ Usage: $0 <APP_RUNNER_URL>"
    echo "   Example: $0 https://abc123.eu-north-1.awsapprunner.com"
    exit 1
fi

BACKEND_URL="$1"
echo "🔧 Updating frontend to use production API: $BACKEND_URL"

cd "/Users/ghaythallaheebi/centralized platform"

# Update index.html
echo "📝 Updating index.html..."
sed -i.bak "s|<meta name=\"api-base\" content=\"[^\"]*\">|<meta name=\"api-base\" content=\"$BACKEND_URL\">|g" fastapi-template/static/index.html

# Update login.html
echo "📝 Updating login.html..."
sed -i.bak "s|<meta name=\"api-base\" content=\"[^\"]*\">|<meta name=\"api-base\" content=\"$BACKEND_URL\">|g" fastapi-template/static/login.htmln.html

echo "✅ Frontend updated with production API URL"

# Show the changes
echo ""
echo "📋 Changes made:"
echo "- index.html: Updated API base URL"
echo "- login.html: Updated API base URL"

echo ""
echo "🚀 Ready to commit and push changes:"
echo "   git add ."
echo "   git commit -m 'Configure frontend for production API'"
echo "   git push origin main"

echo ""
echo "📱 After pushing, your AWS Amplify app will automatically redeploy"
echo "🎯 Then test your production app with login: admin/admin123"
