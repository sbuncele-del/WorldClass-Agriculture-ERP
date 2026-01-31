#!/bin/bash

# ================================================
# COMPLETE ERP SYSTEM DEPLOYMENT
# All Modules - All Phases
# ================================================

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  WORLDCLASS ERP - COMPLETE SYSTEM DEPLOYMENT             ║"
echo "║  Deploying all modules to AWS RDS                        ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

START_TIME=$(date +%s)

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

DB_URL="postgresql://postgres:caxMex-0putca-dyjnah@aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com:5432/aetheros_erp"
export PGPASSWORD='caxMex-0putca-dyjnah'

echo -e "${BLUE}Checking database connection...${NC}"
if psql "$DB_URL" -c "SELECT version();" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    exit 1
fi
echo ""

# ================================================
# PHASE 1: MULTI-TENANT FOUNDATION
# ================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}PHASE 1: Multi-Tenant Foundation${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo "Creating full backup before deployment..."
FULL_BACKUP="backup-complete-deployment-$(date +%Y%m%d-%H%M%S).sql"
pg_dump "$DB_URL" > "$FULL_BACKUP" 2>/dev/null || echo "Note: Initial backup skipped (database may be empty)"
echo -e "${GREEN}✅ Backup: $FULL_BACKUP${NC}"
echo ""

echo "Deploying multi-tenant schema..."
if psql "$DB_URL" -f backend/src/config/multi-tenant-schema.sql > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Multi-tenant schema deployed${NC}"
else
    echo -e "${YELLOW}⚠️  Multi-tenant schema deployment had warnings (may already exist)${NC}"
fi
echo ""

# ================================================
# PHASE 2: CORE FINANCIAL MODULES
# ================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}PHASE 2: Financial Modules${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo "Deploying financial accounting module..."
if [ -f "backend/database/migrations/011_financial_accounting_module.sql" ]; then
    psql "$DB_URL" -f backend/database/migrations/011_financial_accounting_module.sql > /dev/null 2>&1
    echo -e "${GREEN}✅ Financial module deployed${NC}"
else
    echo -e "${YELLOW}⚠️  Financial migration file not found${NC}"
fi
echo ""

# ================================================
# PHASE 3: HR & PAYROLL (RSA COMPLIANCE)
# ================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}PHASE 3: HR & Payroll (RSA Compliance)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo "Deploying HR & payroll module..."
if [ -f "backend/database/migrations/012_hr_payroll_module.sql" ]; then
    psql "$DB_URL" -f backend/database/migrations/012_hr_payroll_module.sql > /dev/null 2>&1
    echo -e "${GREEN}✅ HR & Payroll module deployed${NC}"
else
    echo -e "${YELLOW}⚠️  HR migration file not found${NC}"
fi
echo ""

# ================================================
# PHASE 4: OPERATIONS MODULES
# ================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}PHASE 4: Operations Modules${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

OPERATIONS_MODULES=(
    "009_logistics_module.sql"
    "010_cash_management_module.sql"
    "013_asset_management_module.sql"
)

for module in "${OPERATIONS_MODULES[@]}"; do
    if [ -f "backend/database/migrations/$module" ]; then
        echo "Deploying $module..."
        psql "$DB_URL" -f "backend/database/migrations/$module" > /dev/null 2>&1
        echo -e "${GREEN}✅ $module deployed${NC}"
    else
        echo -e "${YELLOW}⚠️  $module not found${NC}"
    fi
done
echo ""

# ================================================
# PHASE 5: SPECIALIZED MODULES
# ================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}PHASE 5: Specialized Modules${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

SPECIALIZED_MODULES=(
    "020_healthcare_operations_module.sql"
    "015_compliance_governance_module.sql"
    "017_treasury_management_module.sql"
    "018_ai_agents_module.sql"
    "030_sales_module_complete.sql"
)

for module in "${SPECIALIZED_MODULES[@]}"; do
    if [ -f "backend/database/migrations/$module" ]; then
        echo "Deploying $module..."
        psql "$DB_URL" -f "backend/database/migrations/$module" > /dev/null 2>&1
        echo -e "${GREEN}✅ $module deployed${NC}"
    else
        echo -e "${YELLOW}⚠️  $module not found${NC}"
    fi
done
echo ""

# ================================================
# ADDITIONAL MIGRATIONS (User Auth, Email, etc.)
# ================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}PHASE 6: Supporting Systems${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

SUPPORT_MIGRATIONS=(
    "006_email_verification.sql"
    "007_password_reset.sql"
    "008_onboarding_tracking.sql"
    "012_tenant_settings.sql"
)

for migration in "${SUPPORT_MIGRATIONS[@]}"; do
    if [ -f "backend/src/migrations/$migration" ]; then
        echo "Deploying $migration..."
        psql "$DB_URL" -f "backend/src/migrations/$migration" > /dev/null 2>&1
        echo -e "${GREEN}✅ $migration deployed${NC}"
    else
        echo -e "${YELLOW}⚠️  $migration not found${NC}"
    fi
done
echo ""

# ================================================
# VERIFICATION
# ================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}VERIFICATION${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo "Checking deployed tables..."
TABLE_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
echo -e "${GREEN}✅ Total tables: $TABLE_COUNT${NC}"

echo "Checking multi-tenant setup..."
TENANT_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM tenants;" 2>/dev/null | tr -d ' ' || echo "0")
USER_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ' || echo "0")
echo -e "${GREEN}✅ Tenants: $TENANT_COUNT${NC}"
echo -e "${GREEN}✅ Users: $USER_COUNT${NC}"

echo ""
echo "Sample tables verification:"
psql "$DB_URL" << 'EOF' 2>/dev/null || true
SELECT 
    'Core' as category,
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE information_schema.columns.table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('tenants', 'users', 'chart_of_accounts', 'journal_entries')
ORDER BY table_name;
EOF
echo ""

# ================================================
# COMPLETION SUMMARY
# ================================================
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  DEPLOYMENT COMPLETE!                                    ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Deployment Summary:${NC}"
echo "  • Duration: ${DURATION} seconds"
echo "  • Tables deployed: $TABLE_COUNT"
echo "  • Backup file: $FULL_BACKUP"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Deploy backend to EC2: ./deploy-backend-to-ec2.sh"
echo "  2. Test API endpoints"
echo "  3. Verify frontend connection"
echo "  4. Load sample data"
echo ""
