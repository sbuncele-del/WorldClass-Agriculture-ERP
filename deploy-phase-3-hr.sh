#!/bin/bash

# ================================================
# PHASE 3: HR & PAYROLL MODULE DEPLOYMENT
# ================================================

set -e

echo "================================================"
echo "PHASE 3: HR & PAYROLL MODULE DEPLOYMENT"
echo "================================================"
echo ""

DB_URL="postgresql://postgres:caxMex-0putca-dyjnah@aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com:5432/aetheros_erp"
export PGPASSWORD='caxMex-0putca-dyjnah'

echo "Step 1: Creating backup..."
BACKUP_FILE="backup-pre-phase3-$(date +%Y%m%d-%H%M%S).sql"
pg_dump "$DB_URL" > "$BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE"
echo ""

echo "Step 2: Deploying HR & Payroll Module..."
psql "$DB_URL" -f backend/database/migrations/012_hr_payroll_module.sql
echo "✅ HR & Payroll tables created"
echo ""

echo "Step 3: Verifying HR tables..."
psql "$DB_URL" << 'EOF'
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE '%employee%' OR table_name LIKE '%payroll%'
ORDER BY table_name;
EOF
echo ""

echo "================================================"
echo "PHASE 3 DEPLOYMENT COMPLETE"
echo "================================================"
echo ""
echo "Next: ./deploy-phase-4-operations.sh"
echo ""
