#!/bin/bash

# Check Backend Logs via SSM
INSTANCE_ID="i-0b20fd06fae7e84b1"

echo "📝 Fetching Backend Logs via SSM"
echo "Instance: $INSTANCE_ID"
echo ""

COMMAND_ID=$(aws ssm send-command \
    --instance-ids "$INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --comment "Check backend logs" \
    --parameters 'commands=[
        "#!/bin/bash",
        "echo \"📊 SystemD Service Status:\"",
        "sudo systemctl status aetheros-backend.service --no-pager -l",
        "echo",
        "echo \"📝 Last 100 lines of systemd journal:\"",
        "sudo journalctl -u aetheros-backend.service -n 100 --no-pager",
        "echo",
        "echo \"📁 Checking backend directory structure:\"",
        "ls -lh /home/ec2-user/backend/",
        "echo",
        "echo \"📦 Checking dist directory:\"",
        "ls -lh /home/ec2-user/backend/dist/ | head -20",
        "echo",
        "echo \"🔍 Checking if index.js exists:\"",
        "ls -lh /home/ec2-user/backend/dist/index.js",
        "echo",
        "echo \"🧪 Testing manual start:\"",
        "cd /home/ec2-user/backend && node dist/index.js &",
        "BACKEND_PID=$!",
        "echo \"Started with PID: $BACKEND_PID\"",
        "sleep 5",
        "echo",
        "echo \"Checking if process is still running...\"",
        "ps aux | grep $BACKEND_PID",
        "kill $BACKEND_PID 2>/dev/null || true",
        "echo",
        "echo \"✅ Log check complete\""
    ]' \
    --output text \
    --query 'Command.CommandId')

echo "📤 Command sent: $COMMAND_ID"
echo "⏳ Waiting 15 seconds..."
sleep 15

echo ""
echo "📊 Results:"
echo "=========================================="
OUTPUT=$(aws ssm get-command-invocation \
    --command-id "$COMMAND_ID" \
    --instance-id "$INSTANCE_ID" \
    --query 'StandardOutputContent' \
    --output text)

echo "$OUTPUT"

echo "=========================================="
echo ""

ERRORS=$(aws ssm get-command-invocation \
    --command-id "$COMMAND_ID" \
    --instance-id "$INSTANCE_ID" \
    --query 'StandardErrorContent' \
    --output text)

if [ ! -z "$ERRORS" ] && echo "$ERRORS" | grep -v "None" > /dev/null 2>&1; then
    echo "⚠️  Errors:"
    echo "$ERRORS"
fi
