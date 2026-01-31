#!/bin/bash

# Deploy Cash Management Enhancements - Phase 1
# Deploys multi-line matching, partial reconciliation, duplicate detection, bulk operations

set -e

echo "🚀 Deploying Cash Management Enhancements - Phase 1"
echo "=================================================="

# Configuration
EC2_HOST="ec2-user@51.21.219.35"
SSH_KEY="$HOME/.ssh/aetheros-aws.pem"
REMOTE_DIR="/home/ec2-user/worldclass-erp/backend"
LOCAL_DIR="./backend"

echo ""
echo "📦 Step 1: Building TypeScript..."
cd backend
npm run build
echo "✅ Build complete"

echo ""
echo "📤 Step 2: Uploading new files to EC2..."

# Upload new services
echo "   Uploading multi-line-matching.service.ts..."
scp -i ${SSH_KEY} dist/modules/cash-management/services/multi-line-matching.service.js ${EC2_HOST}:${REMOTE_DIR}/dist/modules/cash-management/services/

echo "   Uploading partial-reconciliation.service.ts..."
scp -i ${SSH_KEY} dist/modules/cash-management/services/partial-reconciliation.service.js ${EC2_HOST}:${REMOTE_DIR}/dist/modules/cash-management/services/

echo "   Uploading bulk-operations.service.ts..."
scp -i ${SSH_KEY} dist/modules/cash-management/services/bulk-operations.service.js ${EC2_HOST}:${REMOTE_DIR}/dist/modules/cash-management/services/

# Upload updated matching service
echo "   Uploading updated matching.service.ts (with duplicate detection)..."
scp -i ${SSH_KEY} dist/modules/cash-management/services/matching.service.js ${EC2_HOST}:${REMOTE_DIR}/dist/modules/cash-management/services/

# Upload new controllers
echo "   Uploading multi-line-matching.controller.ts..."
scp -i ${SSH_KEY} dist/modules/cash-management/controllers/multi-line-matching.controller.js ${EC2_HOST}:${REMOTE_DIR}/dist/modules/cash-management/controllers/

echo "   Uploading partial-reconciliation.controller.ts..."
scp -i ${SSH_KEY} dist/modules/cash-management/controllers/partial-reconciliation.controller.js ${EC2_HOST}:${REMOTE_DIR}/dist/modules/cash-management/controllers/

echo "   Uploading bulk-operations.controller.ts..."
scp -i ${SSH_KEY} dist/modules/cash-management/controllers/bulk-operations.controller.js ${EC2_HOST}:${REMOTE_DIR}/dist/modules/cash-management/controllers/

# Upload updated cash management controller
echo "   Uploading updated cash-management.controller.ts (with duplicate endpoints)..."
scp -i ${SSH_KEY} dist/modules/cash-management/controllers/cash-management.controller.js ${EC2_HOST}:${REMOTE_DIR}/dist/modules/cash-management/controllers/

# Upload updated routes
echo "   Uploading updated cash-management.routes.ts..."
scp -i ${SSH_KEY} dist/routes/cash-management.routes.js ${EC2_HOST}:${REMOTE_DIR}/dist/routes/

# Upload updated models
echo "   Uploading updated cash-management.model.ts..."
scp -i ${SSH_KEY} dist/modules/cash-management/models/cash-management.model.js ${EC2_HOST}:${REMOTE_DIR}/dist/modules/cash-management/models/

# Upload migration
echo "   Uploading updated cash-management-migration.ts..."
scp -i ${SSH_KEY} dist/config/cash-management-migration.js ${EC2_HOST}:${REMOTE_DIR}/dist/config/

echo "✅ Files uploaded"

echo ""
echo "🗄️  Step 3: Running database migration on EC2..."
ssh -i ${SSH_KEY} ${EC2_HOST} << 'ENDSSH'
cd /home/ec2-user/worldclass-erp/backend
echo "Running migration..."
node dist/config/cash-management-migration.js
echo "✅ Migration complete"
ENDSSH

echo ""
echo "🔄 Step 4: Restarting backend service..."
ssh -i ${SSH_KEY} ${EC2_HOST} << 'ENDSSH'
# Stop existing process
pm2 stop worldclass-backend || true

# Start with PM2
cd /home/ec2-user/worldclass-erp/backend
pm2 start dist/index.js --name worldclass-backend --time

# Show status
pm2 status
echo "✅ Backend restarted"
ENDSSH

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 New endpoints deployed:"
echo "   Multi-Line Matching (4 endpoints):"
echo "   • POST   /api/cash-management/multi-line-matching/find"
echo "   • POST   /api/cash-management/multi-line-matching/create"
echo "   • DELETE /api/cash-management/multi-line-matching/:groupId"
echo "   • GET    /api/cash-management/multi-line-matching/groups"
echo ""
echo "   Partial Reconciliation (4 endpoints):"
echo "   • POST /api/cash-management/partial-matching/accept"
echo "   • GET  /api/cash-management/partial-matching/:bankLineId/suggestions"
echo "   • POST /api/cash-management/partial-matching/check-tolerance"
echo "   • GET  /api/cash-management/partial-matching/tolerance-settings"
echo ""
echo "   Duplicate Detection (2 endpoints):"
echo "   • POST /api/cash-management/duplicates/check"
echo "   • GET  /api/cash-management/duplicates/find"
echo ""
echo "   Bulk Operations (4 endpoints):"
echo "   • POST /api/cash-management/bulk/auto-match"
echo "   • POST /api/cash-management/bulk/accept-suggestions"
echo "   • POST /api/cash-management/bulk/unmatch"
echo "   • GET  /api/cash-management/bulk/stats/:statementId"
echo ""
echo "🧪 Test endpoints:"
echo "   curl http://51.21.219.35:3000/api/cash-management/banks"
echo ""
