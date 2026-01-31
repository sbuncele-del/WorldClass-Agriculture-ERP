#!/bin/bash

# Start Backend Application on EC2 via SSM
INSTANCE_ID="i-0b20fd06fae7e84b1"

echo "🚀 Starting Backend Application via SSM"
echo "Instance: $INSTANCE_ID"
echo ""

# Build and start the application
COMMAND_ID=$(aws ssm send-command \
    --instance-ids "$INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --comment "Build and start backend" \
    --parameters 'commands=[
        "#!/bin/bash",
        "set -e",
        "echo \"📁 Navigating to backend directory...\"",
        "cd /home/ec2-user/backend",
        "pwd",
        "echo",
        "echo \"🧹 Cleaning old build...\"",
        "rm -rf dist",
        "echo",
        "echo \"🔨 Building TypeScript...\"",
        "sudo -u ec2-user npm run build 2>&1 | tail -20",
        "echo",
        "echo \"✅ Build completed\"",
        "ls -lh dist/",
        "echo",
        "echo \"🔍 Checking PM2 status...\"",
        "pm2 list",
        "echo",
        "echo \"🚀 Starting application with PM2...\"",
        "cd /home/ec2-user/backend",
        "sudo -u ec2-user HOME=/home/ec2-user pm2 start dist/index.js --name worldclass-erp || sudo -u ec2-user HOME=/home/ec2-user pm2 restart worldclass-erp",
        "echo",
        "echo \"📊 Application Status:\"",
        "sudo -u ec2-user HOME=/home/ec2-user pm2 status",
        "echo",
        "echo \"📝 Recent Logs:\"",
        "sudo -u ec2-user HOME=/home/ec2-user pm2 logs worldclass-erp --lines 15 --nostream",
        "echo",
        "echo \"🎯 Testing endpoints...\"",
        "sleep 3",
        "curl -s http://localhost:3000/api/health || echo \"Health endpoint not responding\"",
        "echo",
        "echo \"✅ Deployment complete!\""
    ]' \
    --output text \
    --query 'Command.CommandId')

echo "📤 Command sent: $COMMAND_ID"
echo "⏳ Waiting 20 seconds for build and start..."
sleep 20

echo ""
echo "📊 Deployment Results:"
echo "=========================================="
OUTPUT=$(aws ssm get-command-invocation \
    --command-id "$COMMAND_ID" \
    --instance-id "$INSTANCE_ID" \
    --query 'StandardOutputContent' \
    --output text)

echo "$OUTPUT"

echo "=========================================="
echo ""

# Check for errors
ERRORS=$(aws ssm get-command-invocation \
    --command-id "$COMMAND_ID" \
    --instance-id "$INSTANCE_ID" \
    --query 'StandardErrorContent' \
    --output text)

if echo "$ERRORS" | grep -q "error" 2>/dev/null; then
    echo "⚠️  Build/Start Errors:"
    echo "$ERRORS" | head -30
else
    echo "✅ No critical errors detected"
fi

echo ""
echo "================================================================"
echo "BACKEND DEPLOYMENT COMPLETE"
echo "================================================================"
echo ""

# Check if app is running
if echo "$OUTPUT" | grep -q "online"; then
    echo "✅ Application Status: RUNNING"
    echo ""
    echo "Access your backend at:"
    echo "  - Public: http://51.21.219.35:3000"
    echo "  - Private: http://172.31.23.159:3000"
    echo ""
    echo "Test health endpoint:"
    echo "  curl http://51.21.219.35:3000/api/health"
else
    echo "⚠️  Application may not be running. Check logs:"
    echo "  aws ssm start-session --target $INSTANCE_ID"
    echo "  pm2 logs worldclass-erp"
fi

echo ""
echo "To manage the application:"
echo "  - View logs: aws ssm start-session --target $INSTANCE_ID then 'pm2 logs'"
echo "  - Restart: aws ssm start-session --target $INSTANCE_ID then 'pm2 restart worldclass-erp'"
echo "  - Stop: aws ssm start-session --target $INSTANCE_ID then 'pm2 stop worldclass-erp'"
