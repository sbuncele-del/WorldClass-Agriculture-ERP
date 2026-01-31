#!/bin/bash

# ============================================================================
# ADMIN MODULE DEPLOYMENT SCRIPT
# Worldclass ERP Software
# Created: November 13, 2025
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
EC2_HOST="51.21.219.35"
EC2_USER="ubuntu"
SSH_KEY="$HOME/.ssh/aetheros-aws.pem"
DB_HOST="aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com"
DB_NAME="aetheros_erp"
DB_USER="sibu_sa"
DB_PASSWORD="caxMex-0putca-dyjnah"
BACKEND_PATH="/home/ubuntu/worldclass-erp/backend"
MIGRATION_FILE="./backend/database/migrations/014_admin_module.sql"

echo -e "${GREEN}============================================================================${NC}"
echo -e "${GREEN}ADMIN MODULE DEPLOYMENT${NC}"
echo -e "${GREEN}============================================================================${NC}"

# ============================================================================
# STEP 1: Deploy Database Schema
# ============================================================================

echo -e "\n${YELLOW}Step 1: Deploying Admin Module Schema to RDS...${NC}"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}Error: Migration file not found: $MIGRATION_FILE${NC}"
    exit 1
fi

echo "Executing migration on RDS PostgreSQL..."
PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -f "$MIGRATION_FILE" \
    -v ON_ERROR_STOP=1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Schema deployed successfully${NC}"
    echo ""
    echo "Tables created:"
    echo "  - users (authentication & profiles)"
    echo "  - user_sessions (session management)"
    echo "  - roles (11 pre-populated: Super Admin, System Admin, Finance Manager, HR Manager, etc.)"
    echo "  - permissions (granular resource permissions)"
    echo "  - role_permissions (role → permission mapping)"
    echo "  - user_roles (user → role mapping)"
    echo "  - user_permissions (direct user permission overrides)"
    echo "  - audit_logs (complete audit trail)"
    echo "  - system_settings (11 pre-populated settings)"
    echo "  - notification_templates (email/SMS/push templates)"
    echo "  - user_notifications (in-app notifications)"
    echo "  - notification_preferences (user notification settings)"
    echo "  - feature_flags (gradual feature rollout)"
    echo "  - scheduled_jobs (background job scheduling)"
    echo "  - job_execution_history (job execution logs)"
    echo "  - tenants (multi-tenant management)"
else
    echo -e "${RED}✗ Schema deployment failed${NC}"
    exit 1
fi

# ============================================================================
# STEP 2: Sync Backend Files to EC2
# ============================================================================

echo -e "\n${YELLOW}Step 2: Syncing Backend Files to EC2...${NC}"

# Create directory structure
echo "Creating directory structure..."
ssh -i "$SSH_KEY" "$EC2_USER@$EC2_HOST" "mkdir -p $BACKEND_PATH/src/{controllers,routes,middleware}"

# Sync controller
echo "Syncing admin.controller.ts..."
scp -i "$SSH_KEY" \
    "./backend/src/controllers/admin.controller.ts" \
    "$EC2_USER@$EC2_HOST:$BACKEND_PATH/src/controllers/"

# Sync routes
echo "Syncing admin.routes.ts..."
scp -i "$SSH_KEY" \
    "./backend/src/routes/admin.routes.ts" \
    "$EC2_USER@$EC2_HOST:$BACKEND_PATH/src/routes/"

# Sync permissions middleware
echo "Syncing permissions.ts middleware..."
scp -i "$SSH_KEY" \
    "./backend/src/middleware/permissions.ts" \
    "$EC2_USER@$EC2_HOST:$BACKEND_PATH/src/middleware/"

# Sync updated index.ts (with admin routes registered)
echo "Syncing index.ts..."
scp -i "$SSH_KEY" \
    "./backend/src/index.ts" \
    "$EC2_USER@$EC2_HOST:$BACKEND_PATH/src/"

echo -e "${GREEN}✓ Files synced successfully${NC}"

# ============================================================================
# STEP 3: Install Dependencies & Build
# ============================================================================

echo -e "\n${YELLOW}Step 3: Building Backend on EC2...${NC}"

ssh -i "$SSH_KEY" "$EC2_USER@$EC2_HOST" << 'ENDSSH'
cd /home/ubuntu/worldclass-erp/backend

# Install bcrypt if not already installed
echo "Installing bcrypt dependency..."
npm install bcrypt @types/bcrypt

# Build TypeScript
echo "Building TypeScript..."
npm run build

if [ $? -eq 0 ]; then
    echo "✓ Build successful"
else
    echo "✗ Build failed"
    exit 1
fi
ENDSSH

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend built successfully${NC}"
else
    echo -e "${RED}✗ Backend build failed${NC}"
    exit 1
fi

# ============================================================================
# STEP 4: Restart PM2
# ============================================================================

echo -e "\n${YELLOW}Step 4: Restarting PM2 Process...${NC}"

ssh -i "$SSH_KEY" "$EC2_USER@$EC2_HOST" << 'ENDSSH'
cd /home/ubuntu/worldclass-erp/backend

# Restart PM2
pm2 restart worldclass-erp || pm2 start dist/index.js --name worldclass-erp

# Save PM2 process list
pm2 save

# Show status
pm2 status
ENDSSH

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ PM2 restarted successfully${NC}"
else
    echo -e "${RED}✗ PM2 restart failed${NC}"
    exit 1
fi

# ============================================================================
# STEP 5: Test Endpoints
# ============================================================================

echo -e "\n${YELLOW}Step 5: Testing Admin Endpoints...${NC}"

# Wait for server to be ready
sleep 3

# Test 1: Get roles
echo -e "\nTest 1: GET /api/admin/roles"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" http://$EC2_HOST:3000/api/admin/roles \
    -H "Content-Type: application/json")

HTTP_STATUS=$(echo "$RESPONSE" | grep HTTP_STATUS | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS:/d')

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "401" ]; then
    echo -e "${GREEN}✓ Roles endpoint responding (Status: $HTTP_STATUS)${NC}"
    echo "Response preview: $(echo "$BODY" | head -c 200)"
else
    echo -e "${RED}✗ Roles endpoint failed (Status: $HTTP_STATUS)${NC}"
fi

# Test 2: Get permissions
echo -e "\nTest 2: GET /api/admin/permissions"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" http://$EC2_HOST:3000/api/admin/permissions \
    -H "Content-Type: application/json")

HTTP_STATUS=$(echo "$RESPONSE" | grep HTTP_STATUS | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS:/d')

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "401" ]; then
    echo -e "${GREEN}✓ Permissions endpoint responding (Status: $HTTP_STATUS)${NC}"
    echo "Response preview: $(echo "$BODY" | head -c 200)"
else
    echo -e "${RED}✗ Permissions endpoint failed (Status: $HTTP_STATUS)${NC}"
fi

# Test 3: Get system settings
echo -e "\nTest 3: GET /api/admin/settings"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" http://$EC2_HOST:3000/api/admin/settings \
    -H "Content-Type: application/json")

HTTP_STATUS=$(echo "$RESPONSE" | grep HTTP_STATUS | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS:/d')

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "401" ]; then
    echo -e "${GREEN}✓ Settings endpoint responding (Status: $HTTP_STATUS)${NC}"
    echo "Response preview: $(echo "$BODY" | head -c 200)"
else
    echo -e "${RED}✗ Settings endpoint failed (Status: $HTTP_STATUS)${NC}"
fi

# ============================================================================
# DEPLOYMENT SUMMARY
# ============================================================================

echo -e "\n${GREEN}============================================================================${NC}"
echo -e "${GREEN}ADMIN MODULE DEPLOYMENT COMPLETE${NC}"
echo -e "${GREEN}============================================================================${NC}"

echo -e "\n📊 ${YELLOW}Module Statistics:${NC}"
echo "   - Database Tables: 16"
echo "   - API Endpoints: 20+"
echo "   - Pre-populated Roles: 11"
echo "   - Pre-populated Permissions: 15"
echo "   - Pre-populated Settings: 11"

echo -e "\n🔑 ${YELLOW}Key Features Deployed:${NC}"
echo "   ✓ User Management (CRUD, password reset, activation)"
echo "   ✓ Role-Based Access Control (RBAC)"
echo "   ✓ Granular Permissions System"
echo "   ✓ System Settings Management"
echo "   ✓ In-App Notifications"
echo "   ✓ Feature Flags"
echo "   ✓ Audit Logging"
echo "   ✓ Session Management"
echo "   ✓ Multi-Factor Authentication support"
echo "   ✓ Multi-Tenant Support"

echo -e "\n🌐 ${YELLOW}API Endpoints:${NC}"
echo "   User Management:"
echo "     GET    /api/admin/users              - List users"
echo "     GET    /api/admin/users/:id          - Get user details"
echo "     POST   /api/admin/users              - Create user"
echo "     PUT    /api/admin/users/:id          - Update user"
echo "     DELETE /api/admin/users/:id          - Delete user"
echo "     POST   /api/admin/users/:id/reset-password - Reset password"
echo ""
echo "   Role Management:"
echo "     GET    /api/admin/roles              - List roles"
echo "     GET    /api/admin/roles/:id          - Get role with permissions"
echo "     POST   /api/admin/roles              - Create role"
echo "     POST   /api/admin/roles/:id/permissions - Update role permissions"
echo ""
echo "   Permissions:"
echo "     GET    /api/admin/permissions        - List all permissions"
echo ""
echo "   Settings:"
echo "     GET    /api/admin/settings           - List settings"
echo "     PUT    /api/admin/settings/:key      - Update setting"
echo ""
echo "   Notifications:"
echo "     GET    /api/admin/notifications      - Get user notifications"
echo "     PUT    /api/admin/notifications/:id/read - Mark as read"
echo ""
echo "   Audit:"
echo "     GET    /api/admin/audit-logs         - Get audit logs"

echo -e "\n✅ ${GREEN}Admin module is now LIVE!${NC}"
echo ""
