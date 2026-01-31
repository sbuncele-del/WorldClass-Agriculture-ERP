#!/bin/bash

# Restart Backend with SystemD via SSM - Fix JWT Environment Loading
INSTANCE_ID="i-0b20fd06fae7e84b1"

echo "🔄 Restarting Backend SystemD Service via SSM"
echo "Instance: $INSTANCE_ID"
echo ""

# Restart systemd service to reload environment
COMMAND_ID=$(aws ssm send-command \
    --instance-ids "$INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --comment "Restart backend systemd service" \
    --parameters 'commands=[
        "#!/bin/bash",
        "set -e",
        "echo \"🛑 Stopping backend service...\"",
        "sudo systemctl stop aetheros-backend.service || true",
        "echo",
        "echo \"🧹 Killing any lingering node processes...\"",
        "sudo pkill -9 node || true",
        "sleep 3",
        "echo",
        "echo \"🔄 Reloading systemd daemon...\"",
        "sudo systemctl daemon-reload",
        "echo",
        "echo \"✅ Checking .env file exists...\"",
        "ls -lh /home/ec2-user/backend/.env",
        "echo",
        "echo \"🔍 Checking environment file configuration...\"",
        "sudo systemctl cat aetheros-backend.service | grep -i environment",
        "echo",
        "echo \"🚀 Starting backend service...\"",
        "sudo systemctl start aetheros-backend.service",
        "sleep 5",
        "echo",
        "echo \"📊 Service Status:\"",
        "sudo systemctl status aetheros-backend.service --no-pager -l",
        "echo",
        "echo \"📝 Recent Service Logs:\"",
        "sudo journalctl -u aetheros-backend.service -n 30 --no-pager",
        "echo",
        "echo \"🔍 Checking if process is running...\"",
        "ps aux | grep \"node dist/index.js\" | grep -v grep || echo \"No node process found!\"",
        "echo",
        "echo \"🌐 Checking port 3000...\"",
        "sudo netstat -tlnp | grep 3000 || echo \"Port 3000 not listening!\"",
        "echo",
        "echo \"🧪 Testing API...\"",
        "sleep 2",
        "echo \"Testing signup endpoint...\"",
        "curl -s -X POST http://localhost:3000/api/auth/signup -H \"Content-Type: application/json\" -d \"{\\\"email\\\": \\\"test$(date +%s)@example.com\\\", \\\"password\\\": \\\"TestPass123\\\", \\\"firstName\\\": \\\"Test\\\", \\\"lastName\\\": \\\"User\\\", \\\"companyName\\\": \\\"Test Co\\\", \\\"plan\\\": \\\"starter\\\"}\" > /tmp/signup_response.json",
        "echo",
        "cat /tmp/signup_response.json | python3 -m json.tool || cat /tmp/signup_response.json",
        "echo",
        "echo \"Extracting token...\"",
        "TOKEN=$(cat /tmp/signup_response.json | python3 -c \"import json,sys; print(json.load(sys.stdin).get('\'data\'',{}).get('\'tokens\'',{}).get('\'accessToken\'','\''\''))\")",
        "echo \"Token: ${TOKEN:0:50}...\"",
        "echo",
        "echo \"Testing modules API with token...\"",
        "curl -s -H \"Authorization: Bearer $TOKEN\" http://localhost:3000/api/modules/available | python3 -m json.tool",
        "echo",
        "echo \"✅ Restart complete!\""
    ]' \
    --output text \
    --query 'Command.CommandId')

echo "📤 Command sent: $COMMAND_ID"
echo "⏳ Waiting 25 seconds for restart and tests..."
sleep 25

echo ""
echo "📊 Restart Results:"
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

if [ ! -z "$ERRORS" ] && echo "$ERRORS" | grep -v "None" > /dev/null 2>&1; then
    echo "⚠️  Restart Errors:"
    echo "$ERRORS" | head -30
fi

echo ""
echo "================================================================"
echo "SYSTEMD RESTART COMPLETE"
echo "================================================================"
echo ""

# Check if working
if echo "$OUTPUT" | grep -q '"success": true'; then
    echo "✅✅✅ Backend is WORKING! Token authentication fixed! ✅✅✅"
    echo ""
    echo "Your ERP system is now fully operational at:"
    echo "  http://51.21.219.35:3000"
else
    echo "⚠️  Still seeing issues. Check the output above for details."
    echo ""
    echo "To connect and debug:"
    echo "  aws ssm start-session --target $INSTANCE_ID"
fi
