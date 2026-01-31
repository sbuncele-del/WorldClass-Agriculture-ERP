#!/bin/bash

# ================================================
# PHASE 2: FINANCIAL MODULES DEPLOYMENT
# ================================================

set -e

echo "================================================"
echo "PHASE 2: FINANCIAL MODULES DEPLOYMENT"
echo "================================================"
echo ""

DB_URL="postgresql://postgres:caxMex-0putca-dyjnah@aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com:5432/aetheros_erp"
export PGPASSWORD='caxMex-0putca-dyjnah'

echo "Step 1: Creating backup..."
BACKUP_FILE="backup-pre-phase2-$(date +%Y%m%d-%H%M%S).sql"
pg_dump "$DB_URL" > "$BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE"
echo ""

echo "Step 2: Deploying Financial Accounting Module..."
psql "$DB_URL" -f backend/database/migrations/011_financial_accounting_module.sql
echo "✅ Financial accounting tables created"
echo ""

echo "Step 3: Verifying financial tables..."
psql "$DB_URL" << 'EOF'
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN (
    'chart_of_accounts',
    'journal_entries',
    'journal_entry_lines',
    'fiscal_periods',
    'dimensions_cost_center',
    'dimensions_department',
    'dimensions_project',
    'dimensions_product',
    'dimensions_location'
)
ORDER BY table_name;
EOF
echo ""

echo "Step 4: Checking record counts..."
psql "$DB_URL" << 'EOF'
SELECT 'Chart of Accounts' as table_name, COUNT(*) as record_count FROM chart_of_accounts
UNION ALL
SELECT 'Journal Entries', COUNT(*) FROM journal_entries
UNION ALL
SELECT 'Fiscal Periods', COUNT(*) FROM fiscal_periods;
EOF
echo ""

echo "================================================"
echo "PHASE 2 DEPLOYMENT COMPLETE"
echo "================================================"
echo ""
echo "Next: ./deploy-phase-3-hr.sh"
echo ""
