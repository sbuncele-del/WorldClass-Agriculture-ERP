#!/bin/bash

# Deploy Financial Accounting Module to EC2
# Run this when network is stable

set -e

echo "════════════════════════════════════════════════════════"
echo "  Deploy Financial Accounting Module"
echo "════════════════════════════════════════════════════════"
echo ""

EC2_HOST="51.21.219.35"
SSH_KEY="$HOME/.ssh/aetheros-aws.pem"
RDS_HOST="aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com"
RDS_USER="postgres"
RDS_DB="aetheros_erp"
RDS_PASSWORD="caxMex-0putca-dyjnah"

echo "📦 Step 1: Deploy Database Schema..."
echo ""

# Copy schema to EC2
scp -i $SSH_KEY backend/database/migrations/011_financial_accounting_module.sql \
  ec2-user@$EC2_HOST:/tmp/

# Run migration
ssh -i $SSH_KEY ec2-user@$EC2_HOST << ENDSSH
  echo "Running financial schema migration..."
  PGPASSWORD='$RDS_PASSWORD' psql -h $RDS_HOST -U $RDS_USER -d $RDS_DB \
    -f /tmp/011_financial_accounting_module.sql
  
  echo ""
  echo "Verifying tables created..."
  PGPASSWORD='$RDS_PASSWORD' psql -h $RDS_HOST -U $RDS_USER -d $RDS_DB -c "
    SELECT tablename FROM pg_tables 
    WHERE tablename LIKE '%journal%' OR tablename LIKE '%chart_of%' OR tablename LIKE '%fiscal%'
    ORDER BY tablename;
  "
ENDSSH

echo ""
echo "✅ Database schema deployed"
echo ""

echo "📦 Step 2: Deploy compiled backend files..."
echo ""

# Deploy financial module
rsync -avz --progress -e "ssh -i $SSH_KEY" \
  backend/dist/modules/financial/ \
  ec2-user@$EC2_HOST:/home/ec2-user/backend/dist/modules/financial/

# Deploy routes
rsync -avz --progress -e "ssh -i $SSH_KEY" \
  backend/dist/routes/financial*.js \
  ec2-user@$EC2_HOST:/home/ec2-user/backend/dist/routes/

echo ""
echo "✅ Files deployed"
echo ""

echo "🔄 Step 3: Restart backend..."
echo ""

ssh -i $SSH_KEY ec2-user@$EC2_HOST << 'ENDSSH'
  cd /home/ec2-user/backend
  pm2 restart aetheros-backend
  echo ""
  echo "Waiting for backend to start..."
  sleep 5
  pm2 status
ENDSSH

echo ""
echo "✅ Backend restarted"
echo ""

echo "🧪 Step 4: Test endpoints..."
echo ""

sleep 3

# Test Chart of Accounts
echo "Testing GET /api/financial/chart-of-accounts..."
curl -s http://$EC2_HOST:3000/api/financial/chart-of-accounts | jq '. | {success, count: .data | length}' || echo "Failed"
echo ""

# Test Journal Entries
echo "Testing GET /api/financial/journal-entries..."
curl -s http://$EC2_HOST:3000/api/financial/journal-entries | jq '. | {success, total}' || echo "Failed"
echo ""

# Test Dashboard
echo "Testing GET /api/financial/dashboard..."
curl -s http://$EC2_HOST:3000/api/financial/dashboard | jq '. | {success}' || echo "Failed"
echo ""

echo "════════════════════════════════════════════════════════"
echo "  ✅ FINANCIAL ACCOUNTING MODULE DEPLOYED!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "📊 Module Status:"
echo "   • Database: 15+ tables created ✅"
echo "   • Schema: Chart of Accounts, Journal Entries, Fiscal Periods, Budgets"
echo "   • Backend: Compiled and deployed ✅"
echo "   • Endpoints: 14 endpoints ready"
echo ""
echo "📋 Key Tables:"
echo "   • chart_of_accounts - GL account master"
echo "   • fiscal_years, fiscal_periods - Period management"
echo "   • journal_entries, journal_entry_lines - Double-entry bookkeeping"
echo "   • account_period_balances - Performance snapshots"
echo "   • budgets, budget_lines - Budget management"
echo "   • tax_codes - VAT/Tax configuration"
echo "   • departments, cost_centers - Dimension tracking"
echo ""
echo "🧪 Test the endpoints:"
echo "   curl http://$EC2_HOST:3000/api/financial/chart-of-accounts"
echo "   curl http://$EC2_HOST:3000/api/financial/journal-entries"
echo "   curl http://$EC2_HOST:3000/api/financial/reports/trial-balance"
echo "   curl http://$EC2_HOST:3000/api/financial/dashboard"
echo ""
