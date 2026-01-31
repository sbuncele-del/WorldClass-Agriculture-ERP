#!/bin/bash

# Deploy chart-of-accounts fixes to EC2
# This script syncs local changes to EC2 and rebuilds

INSTANCE_ID="i-0b20fd06fae7e84b1"
EC2_IP="51.20.92.38"
BACKEND_DIR="/home/ec2-user/backend"

echo "📦 Syncing backend files to EC2..."

# Upload fixed backend files
aws ssm send-command \
  --instance-ids "$INSTANCE_ID" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=[
    "echo \"Creating backup...\"",
    "cp -r '"$BACKEND_DIR"' '"$BACKEND_DIR"'.backup-$(date +%s)",
    "echo \"Ready for file uploads\""
  ]' \
  --output text

echo "⏳ Waiting for backup..."
sleep 10

# Copy financial controller
echo "📄 Uploading financial.controller.ts..."
cat << 'EOF' > /tmp/financial.controller.patch
# Lines 286-314 replacement
      SELECT 
        account_id,
        account_code AS code,
        account_name AS name,
        account_type,
        category AS account_category,
        normal_balance,
        parent_account_id,
        account_level AS level,
        is_header,
        is_active,
        allows_manual_entries AS allow_manual_entry,
        is_reconcilable AS requires_reconciliation,
        current_balance AS current_debit_balance,
        0 AS current_credit_balance,
        ytd_debit AS ytd_debit_total,
        ytd_credit AS ytd_credit_total,
        currency AS currency_code,
        tax_type AS tax_code,
        description
      FROM chart_of_accounts
EOF

echo "✅ Files prepared. Now manually apply using nano on EC2:"
echo "   aws ssm start-session --target $INSTANCE_ID"
echo "   sudo su"
echo "   cd $BACKEND_DIR/src/modules/financial/controllers"
echo "   nano financial.controller.ts"
echo "   # Replace lines 286-314 with column mappings"
echo ""
echo "Then rebuild:"
echo "   cd $BACKEND_DIR"
echo "   npm run build"
echo "   pm2 restart worldclass-erp-backend"
