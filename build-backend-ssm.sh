#!/bin/bash

# Build Backend with Increased Memory
INSTANCE_ID="i-0b20fd06fae7e84b1"

echo "🚀 Building Backend with Increased Memory"
echo "Instance: $INSTANCE_ID"
echo ""

COMMAND_ID=$(aws ssm send-command \
    --instance-ids "$INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --comment "Build with increased memory" \
    --parameters 'commands=[
        "#!/bin/bash",
        "set -e",
        "cd /home/ec2-user/backend",
        "echo \"🧹 Cleaning...\"",
        "rm -rf dist node_modules/.cache",
        "echo",
        "echo \"🔨 Building with increased heap size...\"",
        "sudo -u ec2-user NODE_OPTIONS=\"--max-old-space-size=2048\" npm run build 2>&1 | tail -30",
        "echo",
        "if [ -d \"dist\" ] && [ -f \"dist/index.js\" ]; then",
        "    echo \"✅ Build successful!\"",
        "    ls -lh dist/index.js",
        "    echo",
        "    echo \"🚀 Starting with PM2...\"",
        "    sudo -u ec2-user HOME=/home/ec2-user pm2 delete worldclass-erp 2>/dev/null || true",
        "    sudo -u ec2-user HOME=/home/ec2-user pm2 start dist/index.js --name worldclass-erp --node-args=\"--max-old-space-size=1024\"",
        "    echo",
        "    sleep 2",
        "    echo \"📊 PM2 Status:\"",
        "    sudo -u ec2-user HOME=/home/ec2-user pm2 list",
        "    echo",
        "    echo \"📝 Logs:\"",
        "    sudo -u ec2-user HOME=/home/ec2-user pm2 logs worldclass-erp --lines 10 --nostream",
        "    echo",
        "    echo \"🧪 Testing health endpoint...\"",
        "    sleep 2",
        "    curl -s http://localhost:3000/api/health || echo \"Not responding yet\"",
        "else",
        "    echo \"❌ Build failed - dist/index.js not found\"",
        "    exit 1",
        "fi"
    ]' \
    --output text \
    --query 'Command.CommandId')

echo "📤 Command sent: $COMMAND_ID"
echo "⏳ Waiting 30 seconds for build..."
sleep 30

echo ""
echo "📊 Results:"
echo "=========================================="
aws ssm get-command-invocation \
    --command-id "$COMMAND_ID" \
    --instance-id "$INSTANCE_ID" \
    --query 'StandardOutputContent' \
    --output text

echo "=========================================="
echo ""

STATUS=$(aws ssm get-command-invocation \
    --command-id "$COMMAND_ID" \
    --instance-id "$INSTANCE_ID" \
    --query 'Status' \
    --output text)

if [ "$STATUS" = "Success" ]; then
    echo "✅ Build and Start SUCCESSFUL!"
    echo ""
    echo "Backend is now running at:"
    echo "  - http://51.21.219.35:3000"
    echo "  - http://172.31.23.159:3000"
    echo ""
    echo "Test it:"
    echo "  curl http://51.21.219.35:3000/api/health"
else
    echo "⚠️  Status: $STATUS"
    echo ""
    echo "Check errors:"
    aws ssm get-command-invocation \
        --command-id "$COMMAND_ID" \
        --instance-id "$INSTANCE_ID" \
        --query 'StandardErrorContent' \
        --output text | tail -20
fi
