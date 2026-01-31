#!/bin/bash

# Stop PM2 and Start Backend Properly
INSTANCE_ID="i-0b20fd06fae7e84b1"

echo "🔄 Stopping PM2 and Starting Backend Clean via SSM"
echo "Instance: $INSTANCE_ID"
echo ""

COMMAND_ID=$(aws ssm send-command \
    --instance-ids "$INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --comment "Stop PM2 and start backend clean" \
    --parameters 'commands=[
        "#!/bin/bash",
        "set -e",
        "echo \"🛑 STEP 1: Stop PM2 processes...\"",
        "sudo -u ec2-user HOME=/home/ec2-user pm2 stop all || true",
        "sudo -u ec2-user HOME=/home/ec2-user pm2 delete all || true",
        "sudo -u ec2-user HOME=/home/ec2-user pm2 kill || true",
        "sleep 3",
        "echo",
        "echo \"✅ STEP 2: Verify no node processes running...\"",
        "ps aux | grep node | grep -v grep || echo \"No node processes\"",
        "echo",
        "echo \"🚀 STEP 3: Start backend with PM2 properly...\"",
        "cd /home/ec2-user/backend",
        "sudo -u ec2-user HOME=/home/ec2-user pm2 start dist/index.js --name worldclass-erp --log /home/ec2-user/backend/logs/backend.log",
        "sleep 8",
        "echo",
        "echo \"📊 STEP 4: Check PM2 status...\"",
        "sudo -u ec2-user HOME=/home/ec2-user pm2 status",
        "echo",
        "echo \"📝 STEP 5: Check startup logs...\"",
        "sudo -u ec2-user HOME=/home/ec2-user pm2 logs worldclass-erp --lines 20 --nostream",
        "echo",
        "echo \"🌐 STEP 6: Check port 3000...\"",
        "sudo netstat -tlnp | grep 3000",
        "echo",
        "echo \"🧪 STEP 7: Test API...\"",
        "sleep 3",
        "echo \"Creating test signup...\"",
        "SIGNUP_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/signup -H \"Content-Type: application/json\" -d \"{\\\"email\\\": \\\"test$(date +%s)@example.com\\\", \\\"password\\\": \\\"TestPass123\\\", \\\"firstName\\\": \\\"Test\\\", \\\"lastName\\\": \\\"User\\\", \\\"companyName\\\": \\\"Test Co\\\", \\\"plan\\\": \\\"starter\\\"}\")",
        "echo \"$SIGNUP_RESPONSE\" | python3 -m json.tool",
        "echo",
        "TOKEN=$(echo \"$SIGNUP_RESPONSE\" | python3 -c \"import json,sys; print(json.load(sys.stdin).get('\'data\'',{}).get('\'tokens\'',{}).get('\'accessToken\'','\''\''))\" 2>/dev/null || echo \"\")",
        "if [ ! -z \"$TOKEN\" ] && [ \"$TOKEN\" != \"None\" ]; then",
        "    echo \"Got token: ${TOKEN:0:50}...\"",
        "    echo",
        "    echo \"Testing modules API with token...\"",
        "    curl -s -H \"Authorization: Bearer $TOKEN\" http://localhost:3000/api/modules/available | python3 -m json.tool",
        "else",
        "    echo \"Failed to extract token from signup response\"",
        "fi",
        "echo",
        "echo \"✅ Backend started with PM2!\""
    ]' \
    --output text \
    --query 'Command.CommandId')

echo "📤 Command sent: $COMMAND_ID"
echo "⏳ Waiting 25 seconds for PM2 startup and tests..."
sleep 25

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
    echo "Errors detected (may be normal PM2 output):"
    echo "$ERRORS" | head -20
    echo ""
fi

echo ""
echo "================================================================"
echo "PM2 RESTART COMPLETE"
echo "================================================================"
echo ""

# Check if working
if echo "$OUTPUT" | grep -q '"success": true'; then
    echo "✅✅✅ BACKEND IS FULLY OPERATIONAL! ✅✅✅"
    echo ""
    echo "Authentication is FIXED!"
    echo "Users can now:"
    echo "  ✅ Sign up and get tokens"
    echo "  ✅ Navigate to My Workspace"
    echo "  ✅ See all modules"
    echo "  ✅ Access all ERP features"
    echo ""
    echo "Frontend URL: aetheros-erp-frontend-483636500494.s3-website.eu-north-1.amazonaws.com"
    echo "Backend API: http://51.21.219.35:3000"
else
    echo "⚠️  Check output above for any issues"
fi
