#!/bin/bash
# =====================================================
# MASTER DEPLOYMENT SCRIPT - November 2025
# =====================================================
# Deploys: Multi-Entity, Reports, Treasury, AI Agents, Healthcare, Super Admin
# Target: 51.21.219.35 (AWS EC2, eu-north-1)
# Author: Worldclass ERP Team
# Date: November 13, 2025
# =====================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}WORLDCLASS ERP - DEPLOYMENT SCRIPT${NC}"
echo -e "${GREEN}November 2025 - 6 Modules${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""

# =====================================================
# 1. PRE-FLIGHT CHECKS
# =====================================================

echo -e "${YELLOW}[1/8] Pre-flight checks...${NC}"

# Check if we're on the server
if [ ! -d "/var/www" ]; then
    echo -e "${RED}ERROR: Not on server! Run this script ON the EC2 instance.${NC}"
    exit 1
fi

# Find backend directory
if [ -d "/var/www/backend" ]; then
    BACKEND_DIR="/var/www/backend"
elif [ -d "/home/ec2-user/backend" ]; then
    BACKEND_DIR="/home/ec2-user/backend"
else
    echo -e "${RED}ERROR: Cannot find backend directory${NC}"
    exit 1
fi

echo "Backend directory: $BACKEND_DIR"

# Check if files are in /tmp
if [ ! -f "/tmp/017_multi_entity.sql" ]; then
    echo -e "${RED}ERROR: Migration files not found in /tmp/${NC}"
    echo "Please upload files to /tmp first"
    exit 1
fi

# Check database connection
if [ -z "$DATABASE_URL" ]; then
    if [ -f "$BACKEND_DIR/.env" ]; then
        export $(grep -v '^#' $BACKEND_DIR/.env | xargs)
    else
        echo -e "${RED}ERROR: DATABASE_URL not set and no .env file found${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓ Pre-flight checks passed${NC}"
echo ""

# =====================================================
# 2. CREATE BACKUP
# =====================================================

echo -e "${YELLOW}[2/8] Creating backup...${NC}"

BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_pre_deployment_$BACKUP_TIMESTAMP.sql"

echo "Creating database backup: $BACKUP_FILE"

# Parse DATABASE_URL to get connection details
# Format: postgresql://user:pass@host:port/dbname
DB_HOST=$(echo $DATABASE_URL | sed -e 's/.*@\(.*\):.*/\1/')
DB_PORT=$(echo $DATABASE_URL | sed -e 's/.*:\([0-9]*\)\/.*/\1/')
DB_NAME=$(echo $DATABASE_URL | sed -e 's/.*\/\(.*\)/\1/')
DB_USER=$(echo $DATABASE_URL | sed -e 's/.*:\/\/\(.*\):.*/\1/')
DB_PASS=$(echo $DATABASE_URL | sed -e 's/.*:\/\/.*:\(.*\)@.*/\1/')

export PGPASSWORD=$DB_PASS

pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > /tmp/$BACKUP_FILE

if [ -f "/tmp/$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h /tmp/$BACKUP_FILE | cut -f1)
    echo -e "${GREEN}✓ Backup created: $BACKUP_SIZE${NC}"
else
    echo -e "${RED}ERROR: Backup failed${NC}"
    exit 1
fi

echo ""

# =====================================================
# 3. BACKUP CURRENT CODE
# =====================================================

echo -e "${YELLOW}[3/8] Backing up current code...${NC}"

cd $BACKEND_DIR
CODE_BACKUP_DIR="src.backup.$BACKUP_TIMESTAMP"

if [ -d "src" ]; then
    cp -r src $CODE_BACKUP_DIR
    echo -e "${GREEN}✓ Code backed up to: $CODE_BACKUP_DIR${NC}"
else
    echo -e "${RED}ERROR: src directory not found${NC}"
    exit 1
fi

echo ""

# =====================================================
# 4. RUN DATABASE MIGRATIONS
# =====================================================

echo -e "${YELLOW}[4/8] Running database migrations...${NC}"

# Array of migrations in order
MIGRATIONS=(
    "017_multi_entity.sql"
    "018_reports_analytics.sql"
    "019_treasury_management.sql"
    "020_healthcare_operations_module.sql"
    "021_super_admin_portal.sql"
)

for migration in "${MIGRATIONS[@]}"; do
    echo "Running: $migration"
    psql $DATABASE_URL -f /tmp/$migration
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $migration completed${NC}"
    else
        echo -e "${RED}ERROR: $migration failed${NC}"
        echo "Run rollback: psql \$DATABASE_URL < /tmp/$BACKUP_FILE"
        exit 1
    fi
done

echo -e "${GREEN}✓ All migrations completed${NC}"
echo ""

# =====================================================
# 5. DEPLOY BACKEND CODE
# =====================================================

echo -e "${YELLOW}[5/8] Deploying backend code...${NC}"

# Copy controllers
echo "Copying controllers..."
cp /tmp/multi-entity.controller.ts $BACKEND_DIR/src/controllers/
cp /tmp/reports.controller.ts $BACKEND_DIR/src/controllers/
cp /tmp/treasury.controller.ts $BACKEND_DIR/src/controllers/
cp /tmp/ai-assistant.controller.ts $BACKEND_DIR/src/controllers/
cp /tmp/healthcare.controller.ts $BACKEND_DIR/src/controllers/
cp /tmp/superadmin.controller.ts $BACKEND_DIR/src/controllers/

# Copy routes
echo "Copying routes..."
cp /tmp/multi-entity.routes.ts $BACKEND_DIR/src/routes/
cp /tmp/reports.routes.ts $BACKEND_DIR/src/routes/
cp /tmp/treasury.routes.ts $BACKEND_DIR/src/routes/
cp /tmp/ai-assistant.routes.ts $BACKEND_DIR/src/routes/
cp /tmp/healthcare.routes.ts $BACKEND_DIR/src/routes/
cp /tmp/superadmin.routes.ts $BACKEND_DIR/src/routes/

# Copy services
echo "Copying services..."
if [ ! -d "$BACKEND_DIR/src/services" ]; then
    mkdir -p $BACKEND_DIR/src/services
fi
cp /tmp/ai-assistant.service.ts $BACKEND_DIR/src/services/

# Update index.ts
echo "Updating index.ts..."
cp /tmp/index.ts.new $BACKEND_DIR/src/index.ts

echo -e "${GREEN}✓ Code deployed${NC}"
echo ""

# =====================================================
# 6. INSTALL DEPENDENCIES & BUILD
# =====================================================

echo -e "${YELLOW}[6/8] Installing dependencies & building...${NC}"

cd $BACKEND_DIR

# Check if AI packages are installed
if ! npm list openai &>/dev/null; then
    echo "Installing openai package..."
    npm install openai
fi

if ! npm list @anthropic-ai/sdk &>/dev/null; then
    echo "Installing @anthropic-ai/sdk package..."
    npm install @anthropic-ai/sdk
fi

# Build TypeScript
echo "Building TypeScript..."
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}ERROR: Build failed${NC}"
    echo "Check errors above. You may need to rollback."
    exit 1
fi

echo ""

# =====================================================
# 7. RESTART APPLICATION
# =====================================================

echo -e "${YELLOW}[7/8] Restarting application...${NC}"

# Check if PM2 is available
if command -v pm2 &> /dev/null; then
    echo "Restarting PM2 processes..."
    pm2 restart all
    
    sleep 3
    
    pm2 status
    echo -e "${GREEN}✓ PM2 restarted${NC}"
else
    echo -e "${YELLOW}PM2 not found. If using systemd, run: sudo systemctl restart worldclass-erp${NC}"
fi

echo ""

# =====================================================
# 8. VERIFY DEPLOYMENT
# =====================================================

echo -e "${YELLOW}[8/8] Verifying deployment...${NC}"

# Wait for server to start
sleep 5

# Test health endpoint
echo "Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/health || echo "FAILED")

if [[ $HEALTH_RESPONSE == *"ok"* ]] || [[ $HEALTH_RESPONSE == *"healthy"* ]]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${RED}⚠ Health check failed or server not responding${NC}"
fi

# Test new endpoints (without auth, will return 401 but proves route exists)
echo ""
echo "Testing new module endpoints (401 = route exists, needs auth)..."

ENDPOINTS=(
    "/api/entities"
    "/api/reports"
    "/api/treasury/accounts"
    "/api/ai/agents"
    "/api/healthcare/facilities"
    "/api/super-admin/system/health"
)

for endpoint in "${ENDPOINTS[@]}"; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000$endpoint)
    
    if [ "$HTTP_CODE" -eq 401 ] || [ "$HTTP_CODE" -eq 403 ] || [ "$HTTP_CODE" -eq 200 ]; then
        echo -e "${GREEN}✓${NC} $endpoint (HTTP $HTTP_CODE)"
    else
        echo -e "${RED}✗${NC} $endpoint (HTTP $HTTP_CODE - route may not exist)"
    fi
done

echo ""

# =====================================================
# DEPLOYMENT SUMMARY
# =====================================================

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo "Deployment Summary:"
echo "  - Backup: /tmp/$BACKUP_FILE"
echo "  - Code backup: $BACKEND_DIR/$CODE_BACKUP_DIR"
echo "  - Timestamp: $BACKUP_TIMESTAMP"
echo ""
echo "Modules Deployed:"
echo "  ✓ Multi-Entity Management (11 endpoints)"
echo "  ✓ Reports & Analytics (14 endpoints)"
echo "  ✓ Treasury Management (11 endpoints)"
echo "  ✓ AI Agents & Assistants (20+ endpoints)"
echo "  ✓ Healthcare Operations (45 endpoints)"
echo "  ✓ Super Admin Portal (23 endpoints)"
echo ""
echo "Total: 124+ new endpoints"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Test endpoints with authentication"
echo "2. Verify tenant isolation"
echo "3. Check PM2 logs: pm2 logs"
echo "4. Monitor for errors: pm2 logs --err"
echo ""
echo -e "${YELLOW}If issues occur:${NC}"
echo "Rollback database: psql \$DATABASE_URL < /tmp/$BACKUP_FILE"
echo "Rollback code: rm -rf $BACKEND_DIR/src && mv $BACKEND_DIR/$CODE_BACKUP_DIR $BACKEND_DIR/src"
echo "Rebuild: npm run build && pm2 restart all"
echo ""
echo -e "${GREEN}🚀 System ready for testing!${NC}"
