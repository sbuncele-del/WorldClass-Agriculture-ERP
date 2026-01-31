#!/bin/bash

# Simple SSM Connection Script for Backend Deployment
INSTANCE_ID="i-0b20fd06fae7e84b1"

echo "🔍 Step 1: Checking EC2 instance status..."
aws ssm describe-instance-information \
    --filters "Key=InstanceIds,Values=$INSTANCE_ID" \
    --query 'InstanceInformationList[*].[InstanceId,PingStatus,PlatformName,PlatformVersion]' \
    --output table

echo ""
echo "🔍 Step 2: Checking backend directory..."

COMMAND_ID=$(aws ssm send-command \
    --instance-ids "$INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --comment "Check backend status" \
    --parameters 'commands=[
        "#!/bin/bash",
        "echo \"=== Current User ===\"",
        "whoami",
        "echo",
        "echo \"=== Home Directory ===\"",
        "pwd",
        "ls -la ~",
        "echo",
        "echo \"=== Backend Directory ===\"",
        "if [ -d /home/ec2-user/backend ]; then",
        "    ls -la /home/ec2-user/backend",
        "    echo",
        "    echo \"=== Node.js Version ===\"",
        "    node --version",
        "    npm --version",
        "else",
        "    echo \"Backend directory does not exist\"",
        "fi",
        "echo",
        "echo \"=== Environment File ===\"",
        "if [ -f /home/ec2-user/backend/.env ]; then",
        "    echo \".env file exists\"",
        "    cat /home/ec2-user/backend/.env | grep -v PASSWORD | grep -v SECRET | head -5",
        "else",
        "    echo \"No .env file found\"",
        "fi"
    ]' \
    --output text \
    --query 'Command.CommandId')

echo "📤 Command sent: $COMMAND_ID"
echo "⏳ Waiting 5 seconds for execution..."
sleep 5

echo ""
echo "📊 Results:"
echo "=========================================="
aws ssm get-command-invocation \
    --command-id "$COMMAND_ID" \
    --instance-id "$INSTANCE_ID" \
    --query 'StandardOutputContent' \
    --output text

echo ""
echo "=========================================="
echo ""
echo "✅ Status check complete!"
echo ""
echo "Next steps:"
echo "1. If backend directory exists, we can deploy code"
echo "2. If not, we need to set it up first"
echo ""
echo "To set up backend, run: ./setup-backend-ssm.sh"
echo "To deploy code, run: ./deploy-code-ssm.sh"
