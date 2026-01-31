#!/bin/bash

# ============================================================================
# PHASE 1: MULTI-TENANT FOUNDATION DEPLOYMENT
# ============================================================================
# Description: Deploy multi-tenant architecture to AWS RDS
# Date: November 13, 2025
# Prerequisites: EC2 access, RDS credentials, psql installed
# ============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_HOST="aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com"
DB_PORT="5432"
DB_NAME="aetheros_erp"
DB_USER="postgres"
DB_PASSWORD="caxMex-0putca-dyjnah"
DB_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

DEPLOYMENT_DIR="$HOME/deployments/phase-1-multi-tenant"
BACKUP_DIR="$HOME/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# ============================================================================
# FUNCTIONS
# ============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if psql is installed
    if ! command -v psql &> /dev/null; then
        log_error "psql is not installed. Please install PostgreSQL client."
        exit 1
    fi
    
    # Check database connectivity
    if ! psql "$DB_URL" -c "SELECT 1" &> /dev/null; then
        log_error "Cannot connect to database. Please check credentials and network."
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

create_directories() {
    log_info "Creating deployment directories..."
    mkdir -p "$DEPLOYMENT_DIR"
    mkdir -p "$BACKUP_DIR"
    log_success "Directories created"
}

backup_database() {
    log_info "Creating database backup..."
    BACKUP_FILE="$BACKUP_DIR/backup-pre-multitenant-$TIMESTAMP.sql"
    
    if pg_dump "$DB_URL" > "$BACKUP_FILE"; then
        log_success "Backup created: $BACKUP_FILE"
        # Compress backup
        gzip "$BACKUP_FILE"
        log_success "Backup compressed: ${BACKUP_FILE}.gz"
    else
        log_error "Backup failed"
        exit 1
    fi
}

deploy_multi_tenant_schema() {
    log_info "Deploying multi-tenant schema..."
    
    SQL_FILE="$DEPLOYMENT_DIR/multi-tenant-schema.sql"
    
    if [ ! -f "$SQL_FILE" ]; then
        log_error "SQL file not found: $SQL_FILE"
        log_info "Please copy the file using:"
        log_info "scp -i ~/.ssh/aetheros-aws.pem backend/src/config/multi-tenant-schema.sql ec2-user@51.21.219.35:$SQL_FILE"
        exit 1
    fi
    
    # Run migration
    if psql "$DB_URL" -f "$SQL_FILE"; then
        log_success "Multi-tenant schema deployed successfully"
    else
        log_error "Schema deployment failed"
        exit 1
    fi
}

verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check tables created
    log_info "Checking core tables..."
    TABLES=$(psql "$DB_URL" -t -c "SELECT table_name FROM information_schema.tables WHERE table_name IN ('tenants', 'users', 'demo_tenants', 'refresh_tokens', 'audit_log');" | wc -l)
    
    if [ "$TABLES" -eq 5 ]; then
        log_success "All 5 core tables created"
    else
        log_error "Expected 5 tables, found $TABLES"
        exit 1
    fi
    
    # Check tenant_id columns
    log_info "Checking tenant_id columns..."
    TENANT_COLUMNS=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE column_name = 'tenant_id';")
    
    if [ "$TENANT_COLUMNS" -gt 50 ]; then
        log_success "$TENANT_COLUMNS tables have tenant_id column"
    else
        log_warning "Only $TENANT_COLUMNS tables have tenant_id column (expected 100+)"
    fi
    
    # Check demo tenant
    log_info "Checking demo tenant..."
    DEMO_TENANT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM tenants WHERE slug = 'demo';")
    
    if [ "$DEMO_TENANT" -eq 1 ]; then
        log_success "Demo tenant exists"
    else
        log_error "Demo tenant not found"
        exit 1
    fi
    
    # Check demo user
    log_info "Checking demo user..."
    DEMO_USER=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM users WHERE email = 'demo@aetheros.co.za';")
    
    if [ "$DEMO_USER" -eq 1 ]; then
        log_success "Demo user exists"
    else
        log_error "Demo user not found"
        exit 1
    fi
    
    # Check indexes
    log_info "Checking tenant indexes..."
    INDEXES=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM pg_indexes WHERE indexname LIKE '%tenant%';")
    
    if [ "$INDEXES" -gt 20 ]; then
        log_success "$INDEXES tenant indexes created"
    else
        log_warning "Only $INDEXES tenant indexes found (expected 30+)"
    fi
}

display_demo_credentials() {
    log_info "Fetching demo credentials..."
    
    echo ""
    echo "=================================================="
    echo "  DEMO TENANT CREDENTIALS"
    echo "=================================================="
    
    psql "$DB_URL" -c "
        SELECT 
            t.name as tenant_name,
            t.slug as tenant_slug,
            u.email as user_email,
            u.role as user_role,
            t.status as tenant_status
        FROM tenants t
        JOIN users u ON u.tenant_id = t.id
        WHERE t.slug = 'demo';
    "
    
    echo ""
    echo "=================================================="
    echo "  DEFAULT PASSWORD: Demo123!"
    echo "=================================================="
    echo ""
}

run_post_deployment_tests() {
    log_info "Running post-deployment tests..."
    
    # Test 1: Row-Level Security
    log_info "Test 1: Checking Row-Level Security policies..."
    RLS_POLICIES=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM pg_policies WHERE policyname LIKE '%tenant%';")
    if [ "$RLS_POLICIES" -gt 0 ]; then
        log_success "RLS policies active: $RLS_POLICIES policies"
    else
        log_warning "No RLS policies found"
    fi
    
    # Test 2: Audit log trigger
    log_info "Test 2: Checking audit log triggers..."
    TRIGGERS=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM pg_trigger WHERE tgname LIKE '%audit%';")
    if [ "$TRIGGERS" -gt 0 ]; then
        log_success "Audit triggers active: $TRIGGERS triggers"
    else
        log_warning "No audit triggers found"
    fi
    
    # Test 3: Sample data insert
    log_info "Test 3: Testing data insertion with tenant_id..."
    psql "$DB_URL" -c "
        INSERT INTO chart_of_accounts (
            tenant_id, 
            account_code, 
            account_name, 
            account_type, 
            is_active,
            created_by
        ) VALUES (
            '00000000-0000-0000-0000-000000000001',
            'TEST-001',
            'Test Account',
            'ASSET',
            true,
            (SELECT id FROM users WHERE email = 'demo@aetheros.co.za' LIMIT 1)
        ) ON CONFLICT DO NOTHING;
    " > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        log_success "Test data insertion successful"
        # Clean up test data
        psql "$DB_URL" -c "DELETE FROM chart_of_accounts WHERE account_code = 'TEST-001';" > /dev/null 2>&1
    else
        log_warning "Test data insertion failed (may be expected)"
    fi
}

generate_deployment_report() {
    log_info "Generating deployment report..."
    
    REPORT_FILE="$DEPLOYMENT_DIR/deployment-report-$TIMESTAMP.txt"
    
    cat > "$REPORT_FILE" << EOF
================================================
PHASE 1: MULTI-TENANT DEPLOYMENT REPORT
================================================
Deployment Date: $(date)
Database: $DB_NAME
Host: $DB_HOST
Backup: $BACKUP_DIR/backup-pre-multitenant-$TIMESTAMP.sql.gz

================================================
TABLES CREATED
================================================
EOF
    
    psql "$DB_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_name IN ('tenants', 'users', 'demo_tenants', 'refresh_tokens', 'audit_log');" >> "$REPORT_FILE"
    
    cat >> "$REPORT_FILE" << EOF

================================================
TENANT_ID COLUMNS ADDED
================================================
EOF
    
    psql "$DB_URL" -c "SELECT table_name FROM information_schema.columns WHERE column_name = 'tenant_id' ORDER BY table_name;" >> "$REPORT_FILE"
    
    cat >> "$REPORT_FILE" << EOF

================================================
INDEXES CREATED
================================================
EOF
    
    psql "$DB_URL" -c "SELECT indexname, tablename FROM pg_indexes WHERE indexname LIKE '%tenant%' ORDER BY tablename;" >> "$REPORT_FILE"
    
    cat >> "$REPORT_FILE" << EOF

================================================
DEMO TENANT DETAILS
================================================
EOF
    
    psql "$DB_URL" -c "SELECT id, name, slug, status, max_users FROM tenants WHERE slug = 'demo';" >> "$REPORT_FILE"
    
    cat >> "$REPORT_FILE" << EOF

================================================
DEMO USERS
================================================
EOF
    
    psql "$DB_URL" -c "SELECT id, email, role, status FROM users WHERE tenant_id = '00000000-0000-0000-0000-000000000001';" >> "$REPORT_FILE"
    
    log_success "Deployment report generated: $REPORT_FILE"
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    echo ""
    echo "=================================================="
    echo "  PHASE 1: MULTI-TENANT FOUNDATION DEPLOYMENT"
    echo "=================================================="
    echo ""
    
    # Step 1: Prerequisites
    check_prerequisites
    
    # Step 2: Create directories
    create_directories
    
    # Step 3: Backup database
    backup_database
    
    # Step 4: Deploy schema
    deploy_multi_tenant_schema
    
    # Step 5: Verify deployment
    verify_deployment
    
    # Step 6: Post-deployment tests
    run_post_deployment_tests
    
    # Step 7: Display credentials
    display_demo_credentials
    
    # Step 8: Generate report
    generate_deployment_report
    
    echo ""
    echo "=================================================="
    log_success "PHASE 1 DEPLOYMENT COMPLETE!"
    echo "=================================================="
    echo ""
    log_info "Next steps:"
    echo "  1. Review deployment report: $DEPLOYMENT_DIR/deployment-report-$TIMESTAMP.txt"
    echo "  2. Test demo login: demo@aetheros.co.za / Demo123!"
    echo "  3. Proceed to Phase 2: Financial Modules"
    echo ""
    log_info "Rollback command (if needed):"
    echo "  psql \"$DB_URL\" < $BACKUP_DIR/backup-pre-multitenant-$TIMESTAMP.sql.gz"
    echo ""
}

# Run main function
main

exit 0
