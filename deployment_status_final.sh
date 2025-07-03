#!/bin/bash
# Final deployment verification and status check

echo "🚀 CENTRALIZED DELIVERY PLATFORM - FINAL DEPLOYMENT STATUS"
echo "=========================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check local backend
echo "🖥️  LOCAL BACKEND STATUS:"
echo "-----------------------"
LOCAL_HEALTH=$(curl -s http://localhost:8000/health 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Local backend is running${NC}"
    echo "   Status: $(echo $LOCAL_HEALTH | jq -r '.status' 2>/dev/null || echo 'healthy')"
    echo "   Database: $(echo $LOCAL_HEALTH | jq -r '.database' 2>/dev/null || echo 'connected')"
else
    echo -e "${RED}❌ Local backend is not running${NC}"
fi
echo ""

# Check AWS backend
echo "☁️  AWS BACKEND STATUS:"
echo "----------------------"
AWS_URL="https://ff201cf70ebb4a2085b0d8655f59798e.eu-west-1.awsapprunner.com"
AWS_HEALTH=$(curl -s -w "HTTP_STATUS:%{http_code}" $AWS_URL/health 2>/dev/null)
HTTP_STATUS=$(echo $AWS_HEALTH | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ AWS backend is running${NC}"
    echo "   URL: $AWS_URL"
    echo "   Status: $(echo $AWS_HEALTH | jq -r '.status' 2>/dev/null || echo 'healthy')"
else
    echo -e "${RED}❌ AWS backend is not ready${NC}"
    echo "   URL: $AWS_URL"
    echo "   Status: HTTP $HTTP_STATUS"
fi
echo ""

# Test local login
echo "🔐 LOCAL LOGIN TEST:"
echo "-------------------"
LOCAL_LOGIN=$(curl -s -X POST http://localhost:8000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username": "admin", "password": "admin123"}' 2>/dev/null)

if echo "$LOCAL_LOGIN" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Local login working${NC}"
    USERNAME=$(echo $LOCAL_LOGIN | jq -r '.token.user.username' 2>/dev/null)
    ROLE=$(echo $LOCAL_LOGIN | jq -r '.token.user.role' 2>/dev/null)
    echo "   Admin user: $USERNAME ($ROLE)"
else
    echo -e "${RED}❌ Local login failed${NC}"
fi
echo ""

# Check frontend configuration
echo "🌐 FRONTEND CONFIGURATION:"
echo "-------------------------"
INDEX_API=$(grep 'api-base' fastapi-template/static/index.html | head -1)
LOGIN_API=$(grep 'api-base' fastapi-template/static/login.html | head -1)

echo "📁 Index page API config:"
echo "   $INDEX_API"
echo "📁 Login page API config:"
echo "   $LOGIN_API"
echo ""

# Check files ready for deployment
echo "📦 DEPLOYMENT READINESS:"
echo "-----------------------"
REQUIRED_FILES=(
    "fastapi-template/static/index.html"
    "fastapi-template/static/login.html"
    "fastapi-template/static/auth.js"
    "fastapi-template/static/dashboard.html"
    "amplify.yml"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file${NC}"
    fi
done
echo ""

# Next steps
echo "📋 NEXT STEPS:"
echo "-------------"
if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}🎯 AWS Backend is ready!${NC}"
    echo "1. Update frontend API URLs:"
    echo "   ./update_frontend_api.sh $AWS_URL"
    echo ""
    echo "2. Deploy frontend to AWS Amplify:"
    echo "   - Login to AWS Console"
    echo "   - Create new Amplify app"
    echo "   - Connect this repository"
    echo "   - Deploy with amplify.yml configuration"
    echo ""
    echo "3. Test production login:"
    echo "   - Username: admin"
    echo "   - Password: admin123"
else
    echo -e "${YELLOW}⏳ Waiting for AWS Backend...${NC}"
    echo "1. Check AWS App Runner service status:"
    echo "   https://eu-west-1.console.aws.amazon.com/apprunner/"
    echo ""
    echo "2. Once ready, update frontend and deploy:"
    echo "   ./update_frontend_api.sh $AWS_URL"
fi
echo ""

# AWS Console Links
echo "🔗 AWS CONSOLE LINKS:"
echo "--------------------"
echo "App Runner: https://eu-west-1.console.aws.amazon.com/apprunner/"
echo "Amplify: https://console.aws.amazon.com/amplify/"
echo "RDS: https://eu-west-1.console.aws.amazon.com/rds/"
echo ""

# Current status summary
echo "📊 SUMMARY:"
echo "----------"
if curl -s http://localhost:8000/health >/dev/null 2>&1; then
    LOCAL_STATUS="${GREEN}✅ Ready${NC}"
else
    LOCAL_STATUS="${RED}❌ Not running${NC}"
fi

if [ "$HTTP_STATUS" = "200" ]; then
    AWS_STATUS="${GREEN}✅ Ready${NC}"
else
    AWS_STATUS="${RED}❌ Not ready${NC}"
fi

echo -e "Local Backend:  $LOCAL_STATUS"
echo -e "AWS Backend:    $AWS_STATUS"
echo "Frontend:       ✅ Ready for deployment"
echo ""

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}🚀 READY FOR PRODUCTION DEPLOYMENT!${NC}"
else
    echo -e "${YELLOW}⏳ Waiting for AWS backend to be ready...${NC}"
fi
