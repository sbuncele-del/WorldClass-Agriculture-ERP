#!/bin/bash

# Deploy Purchase Module Database
set -e

echo "════════════════════════════════════════"
echo "  Purchase Module Database Deployment"
echo "════════════════════════════════════════"
echo ""

BACKEND_IP="51.20.92.38"
EC2_USER="ec2-user"
SSH_KEY="~/.ssh/aetheros-aws.pem"

echo "📤 Step 1: Uploading migration file to EC2..."
scp -i ${SSH_KEY} "migrations/purchase-module-complete.sql" ${EC2_USER}@${BACKEND_IP}:/tmp/purchase-module-complete.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration file uploaded successfully"
else
    echo "❌ Failed to upload migration file"
    exit 1
fi

echo ""
echo "🗄️  Step 2: Executing migration on RDS..."
ssh -i ${SSH_KEY} ${EC2_USER}@${BACKEND_IP} << 'ENDSSH'
cd /tmp
PGPASSWORD="caxMex-0putca-dyjnah" psql \
    -h aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com \
    -U postgres \
    -d aetheros_erp \
    -f purchase-module-complete.sql
ENDSSH

if [ $? -eq 0 ]; then
    echo "✅ Migration executed successfully"
else
    echo "❌ Migration failed"
    exit 1
fi

echo ""
echo "🔍 Step 3: Verifying tables created..."
ssh -i ${SSH_KEY} ${EC2_USER}@${BACKEND_IP} << 'ENDSSH'
PGPASSWORD="caxMex-0putca-dyjnah" psql \
    -h aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com \
    -U postgres \
    -d aetheros_erp \
    -c "\dt purchase.*"
ENDSSH

echo ""
echo "📊 Step 4: Checking data counts..."
ssh -i ${SSH_KEY} ${EC2_USER}@${BACKEND_IP} << 'ENDSSH'
PGPASSWORD="caxMex-0putca-dyjnah" psql \
    -h aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com \
    -U postgres \
    -d aetheros_erp \
    -c "SELECT 'Suppliers' AS table_name, COUNT(*) FROM purchase.suppliers
        UNION ALL SELECT 'Purchase Orders', COUNT(*) FROM purchase.purchase_orders
        UNION ALL SELECT 'Goods Receipts', COUNT(*) FROM purchase.goods_receipts
        UNION ALL SELECT 'Vendor Invoices', COUNT(*) FROM purchase.vendor_invoices;"
ENDSSH

echo ""
echo "✅ Purchase Module database deployment complete!"
echo ""
