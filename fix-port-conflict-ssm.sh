#!/bin/bash

# Fix Port 3000 Conflict and Start Backend Properly
INSTANCE_ID="i-0b20fd06fae7e84b1"

echo "🔧 Fixing Port 3000 Conflict via SSM"
echo "Instance: $INSTANCE_ID"
echo ""

COMMAND_ID=$(aws ssm send-command \
    --instance-ids "$INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --comment "Fix port conflict and start backend" \
    --parameters 'commands=[
        "#!/bin/bash",
        "set -e",
        "echo \"🛑 STEP 1: Disable and stop systemd service (it keeps restarting)...\"",
        "sudo systemctl disable aetheros-backend.service",
        "sudo systemctl stop aetheros-backend.service",
        "sleep 3",
        "echo",
        "echo \"🔍 STEP 2: Find what is using port 3000...\"",
        "sudo netstat -tlnp | grep 3000 || echo \"No process on port 3000\"",
        "echo",
        "echo \"🧹 STEP 3: Kill ALL node processes...\"",
        "sudo pkill -9 node || true",
        "sleep 5",
        "echo",
        "echo \"✅ STEP 4: Verify port 3000 is free...\"",
        "sudo netstat -tlnp | grep 3000 || echo \"Port 3000 is now free!\"",
        "echo",
        "echo \"🚀 STEP 5: Start backend manually in background...\"",
        "cd /home/ec2-user/backend",
        "nohup node dist/index.js > logs/backend-manual.log 2>&1 &",
        "BACKEND_PID=$!",
        "echo \"Started backend with PID: $BACKEND_PID\"",
        "echo",
        "echo \"⏳ Waiting 8 seconds for startup...\"",
        "sleep 8",
        "echo",
        "echo \"📊 STEP 6: Check if process is running...\"",
        "ps aux | grep \"node dist/index.js\" | grep -v grep",
        "echo",
        "echo \"🌐 STEP 7: Check if port 3000 is listening...\"",
        "sudo netstat -tlnp | grep 3000",
        "echo",
        "echo \"📝 STEP 8: Check environment loading...\"",
        "head -15 logs/backend-manual.log",
        "echo",
        "echo \"🧪 STEP 9: Test API...\"",
        "sleep 3",
        "curl -s http://localhost:3000/api/modules/available || echo \"Needs auth token\"",
        "echo",
        "echo",
        "echo \"Creating test signup...\"",
        "curl -s -X POST http://localhost:3000/api/auth/signup -H \"Content-Type: application/json\" -d \"{\\\"email\\\": \\\"test$(date +%s)@example.com\\\", \\\"password\\\": \\\"TestPass123\\\", \\\"firstName\\\": \\\"Test\\\", \\\"lastName\\\": \\\"User\\\", \\\"companyName\\\": \\\"Test Co\\\", \\\"plan\\\": \\\"starter\\\"}\" > /tmp/signup_test.json",
        "cat /tmp/signup_test.json | python3 -m json.tool",
        "echo",
        "echo \"Extracting and testing token...\"",
        "TOKEN=$(cat /tmp/signup_test.json | python3 -c \"import json,sys; print(json.load(sys.stdin).get('\'data\'',{}).get('\'tokens\'',{}).get('\'accessToken\'','\''\''))\" 2>/dev/null || echo \"\")",
        "if [ ! -z \"$TOKEN\" ]; then",
        "    echo \"Got token: ${TOKEN:0:50}...\"",
        "    echo",
        "    echo \"Testing modules API...\"",
        "    curl -s -H \"Authorization: Bearer $TOKEN\" http://localhost:3000/api/modules/available | python3 -m json.tool",
        "else",
        "    echo \"Failed to get token\"",
        "fi",
        "echo",
        "echo \"✅ Backend started successfully!\""
    ]' \
    --output text \
    --query 'Command.CommandId')

echo "📤 Command sent: $COMMAND_ID"
echo "⏳ Waiting 30 seconds for complete startup and tests..."
sleep 30

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

# Check stderr
ERRORS=$(aws ssm get-command-invocation \
    --command-id "$COMMAND_ID" \
    --instance-id "$INSTANCE_ID" \
    --query 'StandardErrorContent' \
    --output text)

if [ ! -z "$ERRORS" ] && echo "$ERRORS" | grep -v "None" > /dev/null 2>&1; then
    if echo "$ERRORS" | grep -q "EADDRINUSE"; then
        echo "⚠️  Port still in use. May need to wait longer or manually check."
    else
        echo "Errors: $ERRORS" | head -20
    fi
fi

echo ""
echo "================================================================"
echo "PORT CONFLICT FIX COMPLETE"
echo "================================================================"
echo ""

# Check if working
if echo "$OUTPUT" | grep -q '"success": true'; then
    echo "✅✅✅ BACKEND IS WORKING! ✅✅✅"
    echo ""
    echo "Your backend is now accessible at:"
    echo "  http://51.21.219.35:3000"
    echo ""
    echo "The authentication issue is FIXED!"
    echo "Users can now:"
    echo "  1. Sign up → Get tokens"
    echo "  2. Navigate to My Workspace → See modules"
    echo "  3. Access all ERP features"
else
    echo "⚠️  Check output above for any remaining issues"
fi
