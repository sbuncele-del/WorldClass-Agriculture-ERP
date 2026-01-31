#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}  QUICK FIX: Connect Frontend to Backend${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

S3_BUCKET="aetheros-erp-frontend-483636500494"
AWS_REGION="eu-north-1"

echo -e "${YELLOW}What this does:${NC}"
echo "  1. Rebuild frontend to connect to live backend (51.20.67.228:3000)"
echo "  2. Deploy to S3"
echo "  3. Your frontend will call REAL backend APIs"
echo ""

#================================================================
# STEP 1: Rebuild Frontend
#================================================================
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 1: Build Frontend with Live API${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

cd frontend

# Create production environment file
echo "📝 Creating .env.production..."
cat > .env.production << EOF
VITE_API_URL=http://51.20.67.228:3000
VITE_APP_NAME=AetherOS ERP
VITE_ENVIRONMENT=production
EOF

echo "✅ Production environment configured"
echo ""
echo "📦 Building frontend..."
npm run build

echo -e "${GREEN}✅ Frontend built${NC}\n"

#================================================================
# STEP 2: Deploy to S3
#================================================================
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 2: Deploy to S3${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

if command -v aws &> /dev/null; then
    echo "📤 Uploading to S3..."
    
    # Upload all files except index.html with long cache
    aws s3 sync dist/ s3://${S3_BUCKET}/ \
        --region ${AWS_REGION} \
        --delete \
        --cache-control "max-age=31536000,public" \
        --exclude "index.html"
    
    # Upload index.html with no cache
    aws s3 cp dist/index.html s3://${S3_BUCKET}/index.html \
        --region ${AWS_REGION} \
        --cache-control "max-age=0,no-cache,no-store,must-revalidate" \
        --content-type "text/html"
    
    echo -e "${GREEN}✅ Deployed to S3${NC}"
else
    echo -e "${YELLOW}⚠️  AWS CLI not installed${NC}"
    echo "Please upload frontend/dist/ to S3 bucket: ${S3_BUCKET}"
    read -p "Press ENTER when done..."
fi

cd ..

#================================================================
# SUCCESS!
#================================================================
echo -e "\n${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}   🎉 FRONTEND DEPLOYED! 🎉${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}\n"

echo -e "${BLUE}🌐 Your Live URL:${NC}"
echo -e "   ${YELLOW}http://${S3_BUCKET}.s3-website.${AWS_REGION}.amazonaws.com${NC}"
echo ""

echo -e "${BLUE}🔐 Demo Credentials:${NC}"
echo "   Email: demo@aetheros.co.za"
echo "   Password: Demo123!"
echo ""

echo -e "${BLUE}📊 What's Connected:${NC}"
echo "   ✅ Frontend → Backend API (51.20.67.228:3000)"
echo "   ✅ Backend  → AWS RDS PostgreSQL"
echo ""

echo -e "${BLUE}🧪 Test It:${NC}"
echo "   1. Open: http://${S3_BUCKET}.s3-website.${AWS_REGION}.amazonaws.com"
echo "   2. Login with demo credentials"
echo "   3. Navigate to any module"
echo "   4. Check browser console for API calls"
echo ""

echo -e "${GREEN}🚀 Your frontend is now calling the REAL backend!${NC}\n"
