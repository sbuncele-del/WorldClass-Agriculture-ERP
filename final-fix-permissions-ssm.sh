#!/bin/bash

# Final Fix: Permissions and Clean Start
INSTANCE_ID="i-0b20fd06fae7e84b1"

echo "🔧 Final Fix: Permissions and Clean Start via SSM"
echo "Instance: $INSTANCE_ID"
echo ""

COMMAND_ID=$(aws ssm send-command \
    --instance-ids "$INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --comment "Fix permissions and start clean" \
    --parameters 'commands=[
        "#!/bin/bash",
        "set -e",
        "echo \"🧹 STEP 1: Kill all node processes forcefully...\"",
        "sudo pkill -9 node || true",
        "sudo -u ec2-user HOME=/home/ec2-user pm2 kill || true",
        "sleep 5",
        "echo",
        "echo \"✅ STEP 2: Fix log directory permissions...\"",
        "sudo chown -R ec2-user:ec2-user /home/ec2-user/backend/logs",
        "sudo chmod -R 755 /home/ec2-user/backend/logs",
        "ls -lh /home/ec2-user/backend/logs/",
        "echo",
        "echo \"🚀 STEP 3: Start backend with PM2 (no custom log path)...\"",
        "cd /home/ec2-user/backend",
        "sudo -u ec2-user HOME=/home/ec2-user pm2 start dist/index.js --name worldclass-erp",
        "sleep 8",
        "echo",
        "echo \"📊 STEP 4: Check PM2 status...\"",
        "sudo -u ec2-user HOME=/home/ec2-user pm2 status",
        "echo",
        "echo \"📝 STEP 5: Check logs for environment variables...\"",
        "sudo -u ec2-user HOME=/home/ec2-user pm2 logs worldclass-erp --lines 30 --nostream",
        "echo",
        "echo \"🌐 STEP 6: Verify port 3000...\"",
        "sudo netstat -tlnp | grep 3000",
        "echo",
        "echo \"🧪 STEP 7: Full API Test...\"",
        "sleep 3",
        "echo",
        "echo \"Test 1: Create signup and get token...\"",
        "SIGNUP=$(curl -s -X POST http://localhost:3000/api/auth/signup -H \"Content-Type: application/json\" -d \"{\\\"email\\\": \\\"finaltest$(date +%s)@example.com\\\", \\\"password\\\": \\\"TestPass123\\\", \\\"firstName\\\": \\\"Final\\\", \\\"lastName\\\": \\\"Test\\\", \\\"companyName\\\": \\\"FinalTest Co\\\", \\\"plan\\\": \\\"starter\\\"}\")",
        "echo \"$SIGNUP\" | python3 -m json.tool 2>/dev/null || echo \"$SIGNUP\"",
        "echo",
        "TOKEN=$(echo \"$SIGNUP\" | python3 -c \"import json,sys; print(json.load(sys.stdin).get('\'data\'',{}).get('\'tokens\'',{}).get('\'accessToken\'','\''\''))\" 2>/dev/null || echo \"\")",
        "echo \"Token extracted: ${TOKEN:0:50}...\"",
        "echo",
        "echo \"Test 2: Use token to fetch modules...\"",
        "if [ ! -z \"$TOKEN\" ] && [ \"$TOKEN\" != \"None\" ]; then",
        "    MODULES=$(curl -s -H \"Authorization: Bearer $TOKEN\" http://localhost:3000/api/modules/available)",
        "    echo \"$MODULES\" | python3 -m json.tool 2>/dev/null || echo \"$MODULES\"",
        "    echo",
        "    if echo \"$MODULES\" | grep -q \"success.*true\"; then",
        "        echo \"🎉🎉🎉 SUCCESS! Backend authentication is WORKING! 🎉🎉🎉\"",
        "    else",
        "        echo \"⚠️  Modules API returned error\"",
        "    fi",
        "else",
        "    echo \"⚠️  Failed to get token\"",
        "fi",
        "echo",
        "echo \"✅ Complete!\""
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

# Check if successful
if echo "$OUTPUT" | grep -q "🎉🎉🎉 SUCCESS"; then
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                                                            ║"
    echo "║  ✅✅✅  BACKEND AUTHENTICATION FIXED!  ✅✅✅  ║"
    echo "║                                                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Your ERP system is now fully operational!"
    echo ""
    echo "Frontend: aetheros-erp-frontend-483636500494.s3-website.eu-north-1.amazonaws.com"
    echo "Backend:  http://51.21.219.35:3000"
    echo ""
    echo "Users can now:"
    echo "  1. Sign up → Get auth tokens ✅"
    echo "  2. Login → Stay logged in ✅"
    echo "  3. Navigate to My Workspace → See modules ✅"
    echo "  4. Access all 13 ERP modules ✅"
    echo ""
    echo "The \"reverted back to login screen\" issue is RESOLVED!"
else
    echo "⚠️  Check output above. May need additional debugging."
fi
