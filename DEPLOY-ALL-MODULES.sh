#!/bin/bash

# ============================================
# DEPLOY ALL NEW MODULES TO PRODUCTION
# ============================================
# Target: 51.21.219.35 (aetheros-erp-server)
# Date: November 13, 2025
# ============================================

set -e  # Exit on any error

echo "🚀 Starting deployment of all new modules..."
echo "============================================"

# Configuration
SSH_KEY="$HOME/.ssh/aetheros-aws.pem"
SSH_USER="ec2-user"
SSH_HOST="51.21.219.35"
REMOTE_DIR="/home/ec2-user/backend"
LOCAL_DIR="/Users/sibusisomavuso/Desktop/Worldclass ERP Software /backend"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Upload new database migrations
echo ""
echo "${YELLOW}📦 Step 1/7: Uploading database migrations...${NC}"
scp -i "$SSH_KEY" \
  "$LOCAL_DIR/database/migrations/016_reports_analytics_module.sql" \
  "$LOCAL_DIR/database/migrations/017_treasury_management_module.sql" \
  "$LOCAL_DIR/database/migrations/018_ai_agents_module.sql" \
  "$LOCAL_DIR/database/migrations/019_multi_entity_module.sql" \
  "$LOCAL_DIR/database/migrations/020_healthcare_operations_module.sql" \
  "$LOCAL_DIR/database/migrations/021_super_admin_portal.sql" \
  "$SSH_USER@$SSH_HOST:$REMOTE_DIR/database/migrations/"

echo "${GREEN}✅ Database migrations uploaded${NC}"

# Step 2: Upload new controllers
echo ""
echo "${YELLOW}📦 Step 2/7: Uploading controllers...${NC}"
scp -i "$SSH_KEY" \
  "$LOCAL_DIR/src/controllers/reports.controller.ts" \
  "$LOCAL_DIR/src/controllers/treasury.controller.ts" \
  "$LOCAL_DIR/src/controllers/ai-assistant.controller.ts" \
  "$LOCAL_DIR/src/controllers/multi-entity.controller.ts" \
  "$LOCAL_DIR/src/controllers/healthcare.controller.ts" \
  "$LOCAL_DIR/src/controllers/superadmin.controller.ts" \
  "$SSH_USER@$SSH_HOST:$REMOTE_DIR/src/controllers/"

echo "${GREEN}✅ Controllers uploaded${NC}"

# Step 3: Upload new routes
echo ""
echo "${YELLOW}📦 Step 3/7: Uploading routes...${NC}"
scp -i "$SSH_KEY" \
  "$LOCAL_DIR/src/routes/reports.routes.ts" \
  "$LOCAL_DIR/src/routes/treasury.routes.ts" \
  "$LOCAL_DIR/src/routes/ai-assistant.routes.ts" \
  "$LOCAL_DIR/src/routes/multi-entity.routes.ts" \
  "$LOCAL_DIR/src/routes/healthcare.routes.ts" \
  "$LOCAL_DIR/src/routes/superadmin.routes.ts" \
  "$SSH_USER@$SSH_HOST:$REMOTE_DIR/src/routes/"

echo "${GREEN}✅ Routes uploaded${NC}"

# Step 4: Upload AI service
echo ""
echo "${YELLOW}📦 Step 4/7: Uploading AI service...${NC}"
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" "mkdir -p $REMOTE_DIR/src/services"
scp -i "$SSH_KEY" \
  "$LOCAL_DIR/src/services/ai-assistant.service.ts" \
  "$SSH_USER@$SSH_HOST:$REMOTE_DIR/src/services/"

echo "${GREEN}✅ AI service uploaded${NC}"

# Step 5: Upload updated index.ts
echo ""
echo "${YELLOW}📦 Step 5/7: Uploading updated main app file...${NC}"
scp -i "$SSH_KEY" \
  "$LOCAL_DIR/src/index.ts" \
  "$SSH_USER@$SSH_HOST:$REMOTE_DIR/src/"

echo "${GREEN}✅ Main app file uploaded${NC}"

# Step 6: Build on remote server
echo ""
echo "${YELLOW}🔨 Step 6/7: Building TypeScript on server...${NC}"
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" << 'ENDSSH'
  cd /home/ec2-user/backend
  echo "Installing any new dependencies..."
  npm install
  echo "Building TypeScript..."
  npm run build
  echo "Build complete!"
ENDSSH

echo "${GREEN}✅ Build successful${NC}"

# Step 7: Run database migrations
echo ""
echo "${YELLOW}🗄️  Step 7/7: Running database migrations...${NC}"
echo "${YELLOW}NOTE: This will prompt for database password${NC}"

ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" << 'ENDSSH'
  cd /home/ec2-user/backend
  
  # Source environment variables
  export $(cat .env | grep -v '^#' | xargs)
  
  echo "Running migrations in order..."
  
  # Multi-Entity (must be first - dependency for others)
  echo "1/6: Multi-Entity Support..."
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f database/migrations/019_multi_entity_module.sql
  
  # Reports & Analytics
  echo "2/6: Reports & Analytics..."
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f database/migrations/016_reports_analytics_module.sql
  
  # Treasury Management
  echo "3/6: Treasury Management..."
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f database/migrations/017_treasury_management_module.sql
  
  # AI Agents
  echo "4/6: AI Agents Module..."
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f database/migrations/018_ai_agents_module.sql
  
  # Healthcare Operations
  echo "5/6: Healthcare Operations..."
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f database/migrations/020_healthcare_operations_module.sql
  
  # Super Admin Portal
  echo "6/6: Super Admin Portal..."
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f database/migrations/021_super_admin_portal.sql
  
  echo "✅ All migrations completed!"
ENDSSH

echo "${GREEN}✅ Database migrations completed${NC}"

# Step 8: Restart PM2
echo ""
echo "${YELLOW}🔄 Restarting application...${NC}"
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" "pm2 restart aetheros-backend"

echo "${GREEN}✅ Application restarted${NC}"

# Step 9: Verify deployment
echo ""
echo "${YELLOW}🔍 Verifying deployment...${NC}"
sleep 5
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" "pm2 list && pm2 logs aetheros-backend --lines 20 --nostream"

echo ""
echo "${GREEN}============================================${NC}"
echo "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo "${GREEN}============================================${NC}"
echo ""
echo "📊 Modules Deployed:"
echo "  ✅ Multi-Entity Support (11 endpoints)"
echo "  ✅ Reports & Analytics (14 endpoints)"
echo "  ✅ Treasury Management (11 endpoints)"
echo "  ✅ AI Agents Module (20+ endpoints)"
echo "  ✅ Healthcare Operations (45 endpoints)"
echo "  ✅ Super Admin Portal (23 endpoints)"
echo ""
echo "🌐 Server: http://51.21.219.35:3000"
echo ""
echo "🧪 Test with:"
echo "  curl http://51.21.219.35:3000/api/health"
echo ""
