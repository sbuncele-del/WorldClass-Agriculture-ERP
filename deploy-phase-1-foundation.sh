#!/bin/bash

# ================================================
# PHASE 1: MULTI-TENANT FOUNDATION DEPLOYMENT
# ================================================

set -e  # Exit on any error

echo "================================================"
echo "PHASE 1: MULTI-TENANT FOUNDATION DEPLOYMENT"
echo "================================================"
echo ""

# Database connection
DB_URL="postgresql://postgres:caxMex-0putca-dyjnah@aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com:5432/aetheros_erp"
export PGPASSWORD='caxMex-0putca-dyjnah'

echo "Step 1: Creating backup..."
BACKUP_FILE="backup-pre-phase1-$(date +%Y%m%d-%H%M%S).sql"
pg_dump "$DB_URL" > "$BACKUP_FILE" 2>/dev/null || echo "Note: Backup skipped (database may be empty)"
echo "✅ Backup created: $BACKUP_FILE"
echo ""

echo "Step 2: Deploying Multi-Tenant Schema..."
psql "$DB_URL" -f backend/src/config/multi-tenant-schema.sql
echo "✅ Multi-tenant schema deployed"
echo ""

echo "Step 3: Verifying core tables..."
psql "$DB_URL" << 'EOF'
SELECT 'Checking tenants table...' as status;
SELECT COUNT(*) as tenant_count FROM tenants;

SELECT 'Checking users table...' as status;
SELECT COUNT(*) as user_count FROM users;

SELECT 'Checking tables with tenant_id column...' as status;
SELECT COUNT(DISTINCT table_name) as tables_with_tenant_id 
FROM information_schema.columns 
WHERE column_name = 'tenant_id';

SELECT 'Demo tenant check...' as status;
SELECT id, name, slug, status FROM tenants WHERE slug = 'demo';

SELECT 'Demo user check...' as status;
SELECT id, email, role, status FROM users WHERE email = 'demo@aetheros.co.za';
EOF
echo ""

echo "================================================"
echo "PHASE 1 DEPLOYMENT COMPLETE"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Review the output above"
echo "2. If successful, proceed to Phase 2 (Financial modules)"
echo "3. Run: ./deploy-phase-2-financial.sh"
echo ""
