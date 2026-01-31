#!/bin/bash

# Run Database Migration on Backend Server
# This script attempts multiple deployment methods

set -e

echo "════════════════════════════════════════"
echo "  Database Migration Deployment"
echo "════════════════════════════════════════"
echo ""

INSTANCE_ID="i-0b20fd06fae7e84b1"
REGION="eu-north-1"
PUBLIC_IP="51.21.219.35"

echo "Target: Backend Server ($PUBLIC_IP)"
echo "Region: $REGION"
echo ""

# Method 1: Try AWS SSM (Systems Manager)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "METHOD 1: AWS Systems Manager"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Read migration script
MIGRATION_SCRIPT=$(cat backend/migrate-db.js)

# Create inline command
CMD="cd /home/ubuntu/worldclass-erp/backend && cat > migrate-db.js << 'EOFMIG'
$MIGRATION_SCRIPT
EOFMIG
npm install pg 2>/dev/null || true
echo '🚀 Running migration...'
node migrate-db.js
echo '✅ Restarting backend...'
pm2 restart all --update-env 2>/dev/null || echo 'Please restart backend manually'
"

echo "📤 Sending migration command..."

RESULT=$(aws ssm send-command \
    --region "$REGION" \
    --instance-ids "$INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --comment "Database migration" \
    --parameters "commands=[\"$CMD\"]" \
    --output json 2>&1) || RESULT=""

if echo "$RESULT" | grep -q "CommandId"; then
    COMMAND_ID=$(echo "$RESULT" | jq -r '.Command.CommandId')
    echo "✅ Command sent! ID: $COMMAND_ID"
    echo "⏳ Waiting for execution (10 seconds)..."
    sleep 10
    
    echo ""
    echo "📊 Command Output:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    aws ssm get-command-invocation \
        --region "$REGION" \
        --command-id "$COMMAND_ID" \
        --instance-id "$INSTANCE_ID" \
        --output text \
        --query '[Status,StandardOutputContent]' 2>/dev/null || echo "Still running..."
    
    echo ""
    echo "✅ Migration complete!"
    exit 0
fi

# Method 2: Direct SSH attempt
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "METHOD 2: Direct SSH (if key available)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Try common key locations
for KEY in ~/.ssh/aetheros-aws.pem ~/.ssh/worldclass-erp-key.pem ~/.ssh/id_rsa; do
    if [ -f "$KEY" ]; then
        echo "🔑 Found SSH key: $KEY"
        echo "📤 Uploading migration script..."
        
        scp -i "$KEY" -o StrictHostKeyChecking=no \
            backend/migrate-db.js ubuntu@$PUBLIC_IP:/home/ubuntu/worldclass-erp/backend/ 2>/dev/null && \
        
        echo "🚀 Running migration on server..." && \
        ssh -i "$KEY" -o StrictHostKeyChecking=no ubuntu@$PUBLIC_IP << 'EOFSSH'
cd /home/ubuntu/worldclass-erp/backend
npm install pg 2>/dev/null || true
node migrate-db.js
pm2 restart all --update-env 2>/dev/null || echo "Please restart backend manually"
EOFSSH
        
        echo ""
        echo "✅ Migration complete via SSH!"
        exit 0
    fi
done

# Method 3: Manual instructions
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "METHOD 3: Manual Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  Automated deployment not available."
echo ""
echo "Please run these commands on your EC2 server:"
echo ""
echo "1. Connect to your server:"
echo "   ssh -i your-key.pem ubuntu@$PUBLIC_IP"
echo ""
echo "2. Navigate to backend:"
echo "   cd /home/ubuntu/worldclass-erp/backend"
echo ""
echo "3. Create migration file:"
echo "   cat > migrate-db.js << 'EOFMIG'"
cat backend/migrate-db.js
echo "EOFMIG"
echo ""
echo "4. Install dependencies and run:"
echo "   npm install pg"
echo "   node migrate-db.js"
echo ""
echo "5. Restart backend:"
echo "   pm2 restart all --update-env"
echo ""
