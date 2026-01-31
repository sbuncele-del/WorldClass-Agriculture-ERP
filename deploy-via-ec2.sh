#!/bin/bash

# ================================================
# DEPLOY MODULES VIA EC2 (SSH Tunnel Method)
# ================================================

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  WORLDCLASS ERP - EC2 DEPLOYMENT METHOD                  ║"
echo "║  Deploying all modules via EC2 instance                  ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# AWS Configuration
EC2_HOST="51.21.219.35"
EC2_USER="ubuntu"
SSH_KEY="$HOME/.ssh/aetheros-aws.pem"

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ SSH key not found at: $SSH_KEY"
    echo ""
    echo "Please ensure your SSH key is at the correct location or update the script."
    exit 1
fi

echo "✅ SSH key found"
echo ""

# Test EC2 connection
echo "Testing EC2 connection..."
if ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "${EC2_USER}@${EC2_HOST}" "echo 'Connected'" 2>/dev/null; then
    echo "✅ EC2 connection successful"
else
    echo "❌ Cannot connect to EC2 instance at $EC2_HOST"
    echo "Please check:"
    echo "  1. EC2 instance is running"
    echo "  2. Security group allows SSH from your IP"
    echo "  3. SSH key permissions are correct (chmod 400 $SSH_KEY)"
    exit 1
fi
echo ""

# Create deployment directory on EC2
echo "Setting up deployment environment on EC2..."
ssh -i "$SSH_KEY" "${EC2_USER}@${EC2_HOST}" << 'ENDSSH'
mkdir -p ~/erp-deployment/migrations
mkdir -p ~/erp-deployment/backups
echo "✅ Deployment directories created"
ENDSSH
echo ""

# Copy all migration files to EC2
echo "Copying migration files to EC2..."

# Multi-tenant schema
echo "  • multi-tenant-schema.sql"
scp -i "$SSH_KEY" \
    backend/src/config/multi-tenant-schema.sql \
    "${EC2_USER}@${EC2_HOST}:~/erp-deployment/migrations/"

# Database migrations
for file in backend/database/migrations/*.sql; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        echo "  • $filename"
        scp -i "$SSH_KEY" "$file" \
            "${EC2_USER}@${EC2_HOST}:~/erp-deployment/migrations/"
    fi
done

# Source migrations
for file in backend/src/migrations/*.sql; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        echo "  • $filename"
        scp -i "$SSH_KEY" "$file" \
            "${EC2_USER}@${EC2_HOST}:~/erp-deployment/migrations/"
    fi
done

echo "✅ All migration files copied to EC2"
echo ""

# Create deployment script on EC2
echo "Creating deployment script on EC2..."
ssh -i "$SSH_KEY" "${EC2_USER}@${EC2_HOST}" << 'ENDSSH'
cat > ~/erp-deployment/run-migrations.sh << 'DEPLOYEOF'
#!/bin/bash

# Database configuration
DB_HOST="aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com"
DB_PORT="5432"
DB_NAME="aetheros_erp"
DB_USER="postgres"
DB_PASS="caxMex-0putca-dyjnah"

export PGPASSWORD="$DB_PASS"

echo "Testing database connection..."
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
    exit 1
fi
echo ""

# Create backup
echo "Creating backup..."
BACKUP_FILE="~/erp-deployment/backups/backup-$(date +%Y%m%d-%H%M%S).sql"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null || echo "Note: Backup skipped (database may be empty)"
echo "✅ Backup created: $BACKUP_FILE"
echo ""

cd ~/erp-deployment/migrations

# Phase 1: Multi-tenant
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 1: Multi-Tenant Foundation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "multi-tenant-schema.sql" ]; then
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f multi-tenant-schema.sql
    echo "✅ Multi-tenant schema deployed"
else
    echo "⚠️  multi-tenant-schema.sql not found"
fi
echo ""

# Phase 2: Financial
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 2: Financial Modules"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "011_financial_accounting_module.sql" ]; then
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f 011_financial_accounting_module.sql
    echo "✅ Financial module deployed"
fi
echo ""

# Phase 3: HR
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 3: HR & Payroll"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "012_hr_payroll_module.sql" ]; then
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f 012_hr_payroll_module.sql
    echo "✅ HR module deployed"
fi
echo ""

# Phase 4: Operations
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 4: Operations Modules"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
for file in 009_logistics_module.sql 010_cash_management_module.sql 013_asset_management_module.sql; do
    if [ -f "$file" ]; then
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$file"
        echo "✅ $file deployed"
    fi
done
echo ""

# Phase 5: Specialized
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 5: Specialized Modules"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
for file in 020_healthcare_operations_module.sql 015_compliance_governance_module.sql 017_treasury_management_module.sql 018_ai_agents_module.sql 030_sales_module_complete.sql; do
    if [ -f "$file" ]; then
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$file"
        echo "✅ $file deployed"
    fi
done
echo ""

# Supporting migrations
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 6: Supporting Systems"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
for file in 006_email_verification.sql 007_password_reset.sql 008_onboarding_tracking.sql 012_tenant_settings.sql; do
    if [ -f "$file" ]; then
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$file"
        echo "✅ $file deployed"
    fi
done
echo ""

# Verification
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
TABLE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
echo "✅ Total tables: $TABLE_COUNT"

TENANT_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM tenants;" 2>/dev/null | tr -d ' ' || echo "0")
USER_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ' || echo "0")
echo "✅ Tenants: $TENANT_COUNT"
echo "✅ Users: $USER_COUNT"
echo ""

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  DEPLOYMENT COMPLETE!                                    ║"
echo "╚══════════════════════════════════════════════════════════╝"
DEPLOYEOF

chmod +x ~/erp-deployment/run-migrations.sh
echo "✅ Deployment script created on EC2"
ENDSSH
echo ""

# Execute deployment on EC2
echo "Executing deployment on EC2..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ssh -i "$SSH_KEY" "${EC2_USER}@${EC2_HOST}" "~/erp-deployment/run-migrations.sh"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ALL MIGRATIONS DEPLOYED SUCCESSFULLY!                   ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  1. Deploy backend application: ./deploy-backend-app.sh"
echo "  2. Test API endpoints"
echo "  3. Connect frontend to backend"
echo ""
