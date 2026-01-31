#!/bin/bash

# Identify What is Starting Node Processes
INSTANCE_ID="i-0b20fd06fae7e84b1"

echo "🔍 Identifying Process Manager via SSM"
echo "Instance: $INSTANCE_ID"
echo ""

COMMAND_ID=$(aws ssm send-command \
    --instance-ids "$INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --comment "Identify process manager" \
    --parameters 'commands=[
        "#!/bin/bash",
        "echo \"🔍 STEP 1: Check all systemd services...\"",
        "sudo systemctl list-units --type=service | grep -E \"(backend|aetheros|erp|node)\" || echo \"No matching services\"",
        "echo",
        "echo \"🔍 STEP 2: Check PM2 processes...\"",
        "sudo -u ec2-user HOME=/home/ec2-user pm2 list || echo \"PM2 not running or no processes\"",
        "echo",
        "echo \"🔍 STEP 3: Check for cron jobs...\"",
        "sudo crontab -l 2>/dev/null || echo \"No root cron jobs\"",
        "sudo -u ec2-user crontab -l 2>/dev/null || echo \"No ec2-user cron jobs\"",
        "echo",
        "echo \"🔍 STEP 4: Check parent process of node...\"",
        "ps -ef | grep \"node\" | grep -v grep",
        "echo",
        "echo \"🔍 STEP 5: Find all node processes and their parents...\"",
        "pstree -p | grep node || echo \"No node in process tree\"",
        "echo",
        "echo \"🔍 STEP 6: Check what is listening on port 3000...\"",
        "sudo lsof -i :3000 2>/dev/null || sudo netstat -tlnp | grep 3000",
        "echo",
        "echo \"✅ Investigation complete\""
    ]' \
    --output text \
    --query 'Command.CommandId')

echo "📤 Command sent: $COMMAND_ID"
echo "⏳ Waiting 10 seconds..."
sleep 10

echo ""
echo "📊 Results:"
echo "=========================================="
OUTPUT=$(aws ssm send-command-invocation \
    --command-id "$COMMAND_ID" \
    --instance-id "$INSTANCE_ID" \
    --query 'StandardOutputContent' \
    --output text 2>/dev/null || aws ssm get-command-invocation \
    --command-id "$COMMAND_ID" \
    --instance-id "$INSTANCE_ID" \
    --query 'StandardOutputContent' \
    --output text)

echo "$OUTPUT"

echo "=========================================="
