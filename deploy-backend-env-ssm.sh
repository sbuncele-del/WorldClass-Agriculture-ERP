#!/bin/bash

# Deploy Backend .env to EC2 using AWS SSM
# No SSH key needed - uses AWS Systems Manager

set -e

echo "════════════════════════════════════════"
echo "  Deploy Backend Config to EC2"
echo "════════════════════════════════════════"
echo ""

INSTANCE_ID="i-0b20fd06fae7e84b1"
REGION="eu-north-1"
BACKEND_DIR="/home/ubuntu/worldclass-erp/backend"

echo "📍 Instance: $INSTANCE_ID"
echo "📍 Region: $REGION"
echo ""

# Check if instance is running
echo "🔍 Checking EC2 instance status..."
INSTANCE_STATE=$(aws ec2 describe-instances --region $REGION --instance-ids $INSTANCE_ID --query 'Reservations[0].Instances[0].State.Name' --output text)

if [ "$INSTANCE_STATE" != "running" ]; then
    echo "❌ Instance is $INSTANCE_STATE. Please start it first."
    exit 1
fi

echo "✅ Instance is running"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1: Prepare .env Content"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Read the local .env file
if [ ! -f "backend/.env" ]; then
    echo "❌ backend/.env not found!"
    exit 1
fi

echo "📝 Reading backend/.env configuration..."
echo "✅ Configuration loaded"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2: Upload .env to EC2"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create the .env content with proper escaping
ENV_CONTENT=$(cat backend/.env | base64)

# Use SSM to write the file
echo "📤 Uploading configuration via AWS Systems Manager..."

aws ssm send-command \
    --region $REGION \
    --instance-ids $INSTANCE_ID \
    --document-name "AWS-RunShellScript" \
    --comment "Deploy backend .env file" \
    --parameters commands="[
        \"cd $BACKEND_DIR\",
        \"[ -f .env ] && cp .env .env.backup.\$(date +%Y%m%d_%H%M%S) || true\",
        \"echo '$ENV_CONTENT' | base64 -d > .env\",
        \"chmod 600 .env\",
        \"chown ubuntu:ubuntu .env\",
        \"echo 'Environment file updated successfully'\"
    ]" \
    --output text \
    --query 'Command.CommandId' > /tmp/command_id.txt

COMMAND_ID=$(cat /tmp/command_id.txt)
echo "📋 Command ID: $COMMAND_ID"
echo ""

# Wait for command to complete
echo "⏳ Waiting for deployment to complete..."
sleep 5

# Get command status
STATUS=$(aws ssm get-command-invocation \
    --region $REGION \
    --command-id $COMMAND_ID \
    --instance-id $INSTANCE_ID \
    --query 'Status' \
    --output text 2>/dev/null || echo "Pending")

echo "📊 Status: $STATUS"

if [ "$STATUS" = "Success" ]; then
    echo "✅ .env file deployed successfully!"
else
    echo "⚠️  Status: $STATUS"
    echo "Check AWS Console → Systems Manager → Run Command for details"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 3: Test Database Connection"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test connection
aws ssm send-command \
    --region $REGION \
    --instance-ids $INSTANCE_ID \
    --document-name "AWS-RunShellScript" \
    --comment "Test RDS connection" \
    --parameters 'commands=["cd /home/ubuntu/worldclass-erp/backend && source .env && psql \"$DATABASE_URL\" -c \"SELECT version();\" 2>&1 || echo \"Connection test skipped (psql may not be installed)\""]' \
    --output text \
    --query 'Command.CommandId' > /tmp/test_command_id.txt

TEST_COMMAND_ID=$(cat /tmp/test_command_id.txt)
sleep 3

echo "🔍 Testing database connection..."
TEST_OUTPUT=$(aws ssm get-command-invocation \
    --region $REGION \
    --command-id $TEST_COMMAND_ID \
    --instance-id $INSTANCE_ID \
    --query 'StandardOutputContent' \
    --output text 2>/dev/null || echo "")

if echo "$TEST_OUTPUT" | grep -q "PostgreSQL"; then
    echo "✅ Database connection successful!"
    echo ""
    echo "$TEST_OUTPUT"
else
    echo "ℹ️  Database connection test output:"
    echo "$TEST_OUTPUT"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 4: Restart Backend Service"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

aws ssm send-command \
    --region $REGION \
    --instance-ids $INSTANCE_ID \
    --document-name "AWS-RunShellScript" \
    --comment "Restart backend service" \
    --parameters 'commands=["cd /home/ubuntu/worldclass-erp/backend && pm2 restart all --update-env && pm2 save && pm2 list"]' \
    --output text \
    --query 'Command.CommandId' > /tmp/restart_command_id.txt

RESTART_COMMAND_ID=$(cat /tmp/restart_command_id.txt)
sleep 3

echo "🔄 Restarting backend service..."
RESTART_OUTPUT=$(aws ssm get-command-invocation \
    --region $REGION \
    --command-id $RESTART_COMMAND_ID \
    --instance-id $INSTANCE_ID \
    --query 'StandardOutputContent' \
    --output text 2>/dev/null || echo "")

echo "$RESTART_OUTPUT"

echo ""
echo "════════════════════════════════════════"
echo "   ✅ DEPLOYMENT COMPLETE!"
echo "════════════════════════════════════════"
echo ""
echo "📊 Summary:"
echo "   • .env file deployed to EC2"
echo "   • Database: aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com"
echo "   • Backend service restarted"
echo ""
echo "🎯 Next Steps:"
echo "   1. Run: ./migrate-database-schema.sh"
echo "   2. Test document upload"
echo "   3. Check API: curl http://51.21.219.35:3000/health"
echo ""
echo "🔍 View Logs:"
echo "   aws ssm start-session --target $INSTANCE_ID --region $REGION"
echo "   Then run: pm2 logs"
echo ""
