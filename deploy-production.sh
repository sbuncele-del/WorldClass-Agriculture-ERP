#!/bin/bash
# WorldClass ERP - Production Deployment Script
# This is the ONLY script you should run to deploy changes
# 
# Usage: ./deploy-production.sh [frontend|backend|database|all]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
INSTANCE_ID="i-0b20fd06fae7e84b1"
S3_BUCKET="aetheros-erp-deployments"
DB_HOST="aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com"
DB_USER="postgres"
DB_PASS="caxMex-0putca-dyjnah"
DB_NAME="postgres"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

wait_for_command() {
    local cmd_id=$1
    local max_wait=60
    local waited=0
    
    while [ $waited -lt $max_wait ]; do
        status=$(aws ssm get-command-invocation --command-id "$cmd_id" --instance-id "$INSTANCE_ID" --query "Status" --output text 2>/dev/null || echo "Pending")
        if [ "$status" = "Success" ]; then
            return 0
        elif [ "$status" = "Failed" ] || [ "$status" = "Cancelled" ]; then
            log_error "Command failed with status: $status"
            aws ssm get-command-invocation --command-id "$cmd_id" --instance-id "$INSTANCE_ID" --query "StandardErrorContent" --output text
            return 1
        fi
        sleep 2
        waited=$((waited + 2))
    done
    log_error "Command timed out after ${max_wait}s"
    return 1
}

run_on_ec2() {
    local commands=$1
    log_info "Running command on EC2..."
    cmd_id=$(aws ssm send-command \
        --instance-ids "$INSTANCE_ID" \
        --document-name "AWS-RunShellScript" \
        --parameters commands=["$commands"] \
        --output text \
        --query "Command.CommandId")
    
    wait_for_command "$cmd_id"
    aws ssm get-command-invocation --command-id "$cmd_id" --instance-id "$INSTANCE_ID" --query "StandardOutputContent" --output text
}

deploy_frontend() {
    log_info "========== DEPLOYING FRONTEND =========="
    
    # Step 1: Build frontend
    log_info "Building frontend..."
    cd "$SCRIPT_DIR/frontend"
    npm run build
    
    # Step 2: Package
    log_info "Packaging frontend..."
    tar -czf /tmp/frontend-dist.tar.gz -C dist .
    
    # Step 3: Upload to S3
    log_info "Uploading to S3..."
    aws s3 cp /tmp/frontend-dist.tar.gz "s3://$S3_BUCKET/frontend-dist.tar.gz"
    
    # Step 4: Deploy to EC2
    log_info "Deploying to EC2..."
    run_on_ec2 "cd /tmp && aws s3 cp s3://$S3_BUCKET/frontend-dist.tar.gz . && sudo rm -rf /var/www/html/assets/* && sudo tar -xzf frontend-dist.tar.gz -C /var/www/html/ && sudo chown -R nginx:nginx /var/www/html/ && echo 'Frontend deployed at $(date)'"
    
    log_info "Frontend deployment complete!"
}

deploy_backend() {
    log_info "========== DEPLOYING BACKEND =========="
    
    # Step 1: Build backend
    log_info "Building backend..."
    cd "$SCRIPT_DIR/backend"
    npm run build
    
    # Step 2: Package (dist + node_modules + package.json)
    log_info "Packaging backend..."
    tar -czf /tmp/backend-dist.tar.gz dist package.json package-lock.json node_modules
    
    # Step 3: Upload to S3
    log_info "Uploading to S3..."
    aws s3 cp /tmp/backend-dist.tar.gz "s3://$S3_BUCKET/backend-dist.tar.gz"
    
    # Step 4: Deploy to EC2
    log_info "Deploying to EC2..."
    run_on_ec2 "cd /home/ec2-user/erp-production && aws s3 cp s3://$S3_BUCKET/backend-dist.tar.gz . && tar -xzf backend-dist.tar.gz && pm2 restart erp-backend && echo 'Backend deployed at $(date)'"
    
    log_info "Backend deployment complete!"
}

deploy_database() {
    log_info "========== RUNNING DATABASE MIGRATIONS =========="
    
    # Check for pending migrations
    if [ -f "$SCRIPT_DIR/migrations/pending.sql" ]; then
        log_info "Running pending migrations..."
        run_on_ec2 "PGPASSWORD='$DB_PASS' psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f /tmp/migrations.sql"
    else
        log_info "No pending migrations found"
    fi
    
    log_info "Database migrations complete!"
}

verify_deployment() {
    log_info "========== VERIFYING DEPLOYMENT =========="
    
    # Check backend health
    log_info "Checking backend health..."
    if curl -s "http://primesources.site/health" | grep -q "OK"; then
        log_info "✅ Backend is healthy"
    else
        log_error "❌ Backend health check failed"
    fi
    
    # Check frontend
    log_info "Checking frontend..."
    if curl -s "http://primesources.site/" | grep -q "html"; then
        log_info "✅ Frontend is serving"
    else
        log_error "❌ Frontend check failed"
    fi
    
    # Check API
    log_info "Checking API..."
    if curl -s "http://primesources.site/api/auth/login" -X POST -H "Content-Type: application/json" -d '{}' | grep -q "error"; then
        log_info "✅ API is responding"
    else
        log_error "❌ API check failed"
    fi
}

# Main
case "${1:-all}" in
    frontend)
        deploy_frontend
        ;;
    backend)
        deploy_backend
        ;;
    database)
        deploy_database
        ;;
    all)
        deploy_frontend
        deploy_backend
        deploy_database
        verify_deployment
        ;;
    verify)
        verify_deployment
        ;;
    *)
        echo "Usage: $0 [frontend|backend|database|all|verify]"
        exit 1
        ;;
esac

log_info "========== DEPLOYMENT COMPLETE =========="
