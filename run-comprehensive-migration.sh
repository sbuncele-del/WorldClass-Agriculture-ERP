#!/bin/bash
# ============================================================================
# RUN COMPREHENSIVE MIGRATION ON PRODUCTION RDS
# Run from Codespace or any machine with access to EC2
# ============================================================================

set -e

echo "============================================="
echo "WorldClass ERP - Production Database Migration"
echo "============================================="
echo ""

# Configuration
EC2_HOST="51.20.67.228"
EC2_USER="ubuntu"
RDS_HOST="aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com"
RDS_PORT="5432"
RDS_DB="aetheros_erp"
RDS_USER="postgres"
RDS_PASS="caxMex-0putca-dyjnah"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATION_FILE="$SCRIPT_DIR/comprehensive-production-migration.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "ERROR: Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo "Migration File: $MIGRATION_FILE"
echo "Target Database: $RDS_DB on $RDS_HOST"
echo ""

# Method 1: Try using AWS SSM to run psql on EC2
run_via_ssm() {
    echo "Attempting to run migration via AWS SSM..."
    
    # First, copy the migration file to a temporary location accessible via SSM
    echo "Encoding migration file..."
    MIGRATION_CONTENT=$(cat "$MIGRATION_FILE" | base64 | tr -d '\n')
    
    echo "Running migration on RDS via EC2..."
    aws ssm send-command \
        --instance-ids "i-0ef09696c5f8c3086" \
        --document-name "AWS-RunShellScript" \
        --parameters "commands=[
            'echo \"$MIGRATION_CONTENT\" | base64 -d > /tmp/migration.sql',
            'PGPASSWORD=$RDS_PASS psql -h $RDS_HOST -p $RDS_PORT -U $RDS_USER -d $RDS_DB -f /tmp/migration.sql 2>&1 | tail -100',
            'rm /tmp/migration.sql'
        ]" \
        --output text \
        --query "Command.CommandId"
}

# Method 2: Try direct SSH
run_via_ssh() {
    echo "Attempting to run migration via SSH..."
    
    # Copy migration file to EC2
    echo "Copying migration file to EC2..."
    scp -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$MIGRATION_FILE" "$EC2_USER@$EC2_HOST:/tmp/migration.sql"
    
    # Run migration
    echo "Running migration on RDS via EC2..."
    ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$EC2_USER@$EC2_HOST" << ENDSSH
        export PGPASSWORD='$RDS_PASS'
        psql -h $RDS_HOST -p $RDS_PORT -U $RDS_USER -d $RDS_DB -f /tmp/migration.sql
        rm /tmp/migration.sql
ENDSSH
}

# Method 3: Create a migration endpoint on the backend
run_via_api() {
    echo "You can also run the migration manually:"
    echo ""
    echo "1. SSH to EC2:"
    echo "   ssh ubuntu@$EC2_HOST"
    echo ""
    echo "2. Connect to RDS:"
    echo "   PGPASSWORD='$RDS_PASS' psql -h $RDS_HOST -p $RDS_PORT -U $RDS_USER -d $RDS_DB"
    echo ""
    echo "3. Copy and paste the migration SQL, or run:"
    echo "   \\i /path/to/comprehensive-production-migration.sql"
    echo ""
}

echo "Choose migration method:"
echo "1) Via SSH (requires SSH access to EC2)"
echo "2) Via AWS SSM (requires AWS CLI configured)"
echo "3) Manual instructions"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        run_via_ssh
        ;;
    2)
        run_via_ssm
        ;;
    3)
        run_via_api
        ;;
    *)
        echo "Invalid choice. Running manual instructions..."
        run_via_api
        ;;
esac

echo ""
echo "============================================="
echo "Migration process completed"
echo "============================================="
