#!/bin/bash

# ================================================
# PHASE 4: OPERATIONS MODULES DEPLOYMENT
# ================================================

set -e

echo "================================================"
echo "PHASE 4: OPERATIONS MODULES DEPLOYMENT"
echo "================================================"
echo ""

DB_URL="postgresql://postgres:caxMex-0putca-dyjnah@aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com:5432/aetheros_erp"
export PGPASSWORD='caxMex-0putca-dyjnah'

echo "Step 1: Creating backup..."
BACKUP_FILE="backup-pre-phase4-$(date +%Y%m%d-%H%M%S).sql"
pg_dump "$DB_URL" > "$BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE"
echo ""

echo "Step 2: Deploying Logistics Module..."
psql "$DB_URL" -f backend/database/migrations/009_logistics_module.sql
echo "✅ Logistics tables created"
echo ""

echo "Step 3: Deploying Asset Management Module..."
psql "$DB_URL" -f backend/database/migrations/013_asset_management_module.sql
echo "✅ Asset management tables created"
echo ""

echo "Step 4: Deploying Cash Management Module..."
psql "$DB_URL" -f backend/database/migrations/010_cash_management_module.sql
echo "✅ Cash management tables created"
echo ""

echo "Step 5: Verifying operations tables..."
psql "$DB_URL" << 'EOF'
SELECT COUNT(DISTINCT table_name) as operations_tables 
FROM information_schema.tables 
WHERE table_name LIKE '%logistics%' 
   OR table_name LIKE '%asset%'
   OR table_name LIKE '%cash%'
   OR table_name LIKE '%fuel%';
EOF
echo ""

echo "================================================"
echo "PHASE 4 DEPLOYMENT COMPLETE"
echo "================================================"
echo ""
echo "Next: ./deploy-phase-5-specialized.sh"
echo ""
