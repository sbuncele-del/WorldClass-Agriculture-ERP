#!/bin/bash
# =====================================================
# FILE PREPARATION FOR DEPLOYMENT
# =====================================================
# This script helps prepare files for manual upload
# Since SSH is blocked, you'll need to transfer files manually

echo "========================================"
echo "FILE PREPARATION FOR DEPLOYMENT"
echo "========================================"
echo ""

# Create deployment directory
DEPLOY_DIR="deployment-package-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$DEPLOY_DIR"/{migrations,controllers,routes,services,config}

echo "Creating deployment package in: $DEPLOY_DIR"
echo ""

# Copy migrations
echo "Copying migrations..."
cp backend/database/migrations/017_multi_entity.sql "$DEPLOY_DIR/migrations/" 2>/dev/null || echo "  ⚠ 017_multi_entity.sql not found"
cp backend/database/migrations/018_reports_analytics.sql "$DEPLOY_DIR/migrations/" 2>/dev/null || echo "  ⚠ 018_reports_analytics.sql not found"
cp backend/database/migrations/019_treasury_management.sql "$DEPLOY_DIR/migrations/" 2>/dev/null || echo "  ⚠ 019_treasury_management.sql not found"
cp backend/database/migrations/020_healthcare_operations_module.sql "$DEPLOY_DIR/migrations/" 2>/dev/null || echo "  ⚠ 020_healthcare_operations_module.sql not found"
cp backend/database/migrations/021_super_admin_portal.sql "$DEPLOY_DIR/migrations/" 2>/dev/null || echo "  ⚠ 021_super_admin_portal.sql not found"

# Copy controllers
echo "Copying controllers..."
cp backend/src/controllers/multi-entity.controller.ts "$DEPLOY_DIR/controllers/" 2>/dev/null || echo "  ⚠ multi-entity.controller.ts not found"
cp backend/src/controllers/reports.controller.ts "$DEPLOY_DIR/controllers/" 2>/dev/null || echo "  ⚠ reports.controller.ts not found"
cp backend/src/controllers/treasury.controller.ts "$DEPLOY_DIR/controllers/" 2>/dev/null || echo "  ⚠ treasury.controller.ts not found"
cp backend/src/controllers/ai-assistant.controller.ts "$DEPLOY_DIR/controllers/" 2>/dev/null || echo "  ⚠ ai-assistant.controller.ts not found"
cp backend/src/controllers/healthcare.controller.ts "$DEPLOY_DIR/controllers/" 2>/dev/null || echo "  ⚠ healthcare.controller.ts not found"
cp backend/src/controllers/superadmin.controller.ts "$DEPLOY_DIR/controllers/" 2>/dev/null || echo "  ⚠ superadmin.controller.ts not found"

# Copy routes
echo "Copying routes..."
cp backend/src/routes/multi-entity.routes.ts "$DEPLOY_DIR/routes/" 2>/dev/null || echo "  ⚠ multi-entity.routes.ts not found"
cp backend/src/routes/reports.routes.ts "$DEPLOY_DIR/routes/" 2>/dev/null || echo "  ⚠ reports.routes.ts not found"
cp backend/src/routes/treasury.routes.ts "$DEPLOY_DIR/routes/" 2>/dev/null || echo "  ⚠ treasury.routes.ts not found"
cp backend/src/routes/ai-assistant.routes.ts "$DEPLOY_DIR/routes/" 2>/dev/null || echo "  ⚠ ai-assistant.routes.ts not found"
cp backend/src/routes/healthcare.routes.ts "$DEPLOY_DIR/routes/" 2>/dev/null || echo "  ⚠ healthcare.routes.ts not found"
cp backend/src/routes/superadmin.routes.ts "$DEPLOY_DIR/routes/" 2>/dev/null || echo "  ⚠ superadmin.routes.ts not found"

# Copy services
echo "Copying services..."
cp backend/src/services/ai-assistant.service.ts "$DEPLOY_DIR/services/" 2>/dev/null || echo "  ⚠ ai-assistant.service.ts not found"

# Copy config
echo "Copying config..."
cp backend/src/index.ts "$DEPLOY_DIR/config/index.ts.new" 2>/dev/null || echo "  ⚠ index.ts not found"

# Copy deployment scripts
echo "Copying deployment scripts..."
cp DEPLOY.sh "$DEPLOY_DIR/" 2>/dev/null
cp DEPLOYMENT-CHECKLIST.md "$DEPLOY_DIR/" 2>/dev/null
cp QUICK-DEPLOY-EC2-INSTANCE-CONNECT.md "$DEPLOY_DIR/" 2>/dev/null

echo ""
echo "========================================"
echo "DEPLOYMENT PACKAGE CREATED!"
echo "========================================"
echo ""
echo "Location: $DEPLOY_DIR/"
echo ""

# Count files
MIGRATION_COUNT=$(ls -1 "$DEPLOY_DIR/migrations/" 2>/dev/null | wc -l | xargs)
CONTROLLER_COUNT=$(ls -1 "$DEPLOY_DIR/controllers/" 2>/dev/null | wc -l | xargs)
ROUTE_COUNT=$(ls -1 "$DEPLOY_DIR/routes/" 2>/dev/null | wc -l | xargs)
SERVICE_COUNT=$(ls -1 "$DEPLOY_DIR/services/" 2>/dev/null | wc -l | xargs)

echo "Files collected:"
echo "  Migrations: $MIGRATION_COUNT / 5"
echo "  Controllers: $CONTROLLER_COUNT / 6"
echo "  Routes: $ROUTE_COUNT / 6"
echo "  Services: $SERVICE_COUNT / 1"
echo "  Config: 1 / 1"
echo ""

TOTAL=$((MIGRATION_COUNT + CONTROLLER_COUNT + ROUTE_COUNT + SERVICE_COUNT + 1))
echo "Total: $TOTAL / 19 files"
echo ""

if [ $TOTAL -eq 19 ]; then
    echo "✅ ALL FILES COLLECTED!"
else
    echo "⚠️  Some files missing - check warnings above"
fi

echo ""
echo "========================================"
echo "NEXT STEPS:"
echo "========================================"
echo ""
echo "Option 1: Upload to GitHub (Private Repo/Gist)"
echo "  cd $DEPLOY_DIR"
echo "  # Create private GitHub repo or gists"
echo "  # Upload files"
echo "  # On server: curl raw URLs to /tmp/"
echo ""
echo "Option 2: Use AWS S3"
echo "  aws s3 cp $DEPLOY_DIR/ s3://your-bucket/deployment/ --recursive"
echo "  # On server: aws s3 sync s3://your-bucket/deployment/ /tmp/"
echo ""
echo "Option 3: Zip and Upload via AWS Console"
echo "  cd $DEPLOY_DIR && zip -r ../deployment.zip ."
echo "  # Upload via AWS Systems Manager or S3"
echo ""
echo "Option 4: Manual Copy/Paste (Tedious but works)"
echo "  # Use 'cat filename' to view file"
echo "  # On server: nano /tmp/filename"
echo "  # Paste content, save"
echo ""
echo "Then follow: DEPLOYMENT-CHECKLIST.md"
echo ""
