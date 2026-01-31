#!/bin/bash

# Nuclear Option: Force Clean Port and Start Once
INSTANCE_ID="i-0b20fd06fae7e84b1"

echo "💣 Nuclear Option: Force Clean Everything via SSM"
echo "Instance: $INSTANCE_ID"
echo ""

COMMAND_ID=$(aws ssm send-command \
    --instance-ids "$INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --comment "Nuclear clean and single start" \
    --parameters 'commands=[
        "#!/bin/bash",
        "echo \"💣 NUCLEAR CLEAN: Killing everything...\"",
        "sudo -u ec2-user HOME=/home/ec2-user pm2 kill 2>/dev/null || true",
        "sudo systemctl stop aetheros-backend.service 2>/dev/null || true",
        "sudo systemctl disable aetheros-backend.service 2>/dev/null || true",
        "sleep 2",
        "sudo killall -9 node 2>/dev/null || true",
        "sleep 5",
        "echo",
        "echo \"✅ Verify port 3000 is free...\"",
        "sudo netstat -tlnp | grep 3000 || echo \"Port 3000 is FREE!\"",
        "echo",
        "echo \"🚀 Starting backend ONCE with simple nohup...\"",
        "cd /home/ec2-user/backend",
        "nohup node dist/index.js > logs/backend-final.log 2>&1 &",
        "BACKEND_PID=$!",
        "echo \"Started backend with PID: $BACKEND_PID\"",
        "echo $BACKEND_PID > /tmp/backend.pid",
        "sleep 10",
        "echo",
        "echo \"📊 Check if running...\"",
        "ps aux | grep \"node dist/index.js\" | grep -v grep",
        "echo",
        "echo \"🌐 Check port...\"",
        "sudo netstat -tlnp | grep 3000",
        "echo",
        "echo \"📝 Check startup logs...\"",
        "tail -50 logs/backend-final.log",
        "echo",
        "echo \"🧪 Full API Test...\"",
        "sleep 3",
        "curl -X POST http://localhost:3000/api/auth/signup -H \"Content-Type: application/json\" -d \"{\\\"email\\\": \\\"nuclear$(date +%s)@example.com\\\", \\\"password\\\": \\\"Test123\\\", \\\"firstName\\\": \\\"Test\\\", \\\"lastName\\\": \\\"User\\\", \\\"companyName\\\": \\\"Test Co\\\", \\\"plan\\\": \\\"starter\\\"}\" -o /tmp/signup.json -w \"\\\\nHTTP Status: %{http_code}\\\\n\" -s",
        "echo",
        "cat /tmp/signup.json | python3 -m json.tool",
        "echo",
        "TOKEN=$(cat /tmp/signup.json | python3 -c \"import sys, json; data=json.load(open('/tmp/signup.json')); print(data['\'data\'']['\'tokens\'']['\'accessToken\''])\" 2>/dev/null)",
        "if [ ! -z \"$TOKEN\" ]; then",
        "    echo \"Token: ${TOKEN:0:50}...\"",
        "    echo",
        "    echo \"Testing modules API...\"",
        "    curl -H \"Authorization: Bearer $TOKEN\" http://localhost:3000/api/modules/available -w \"\\\\nHTTP: %{http_code}\\\\n\" | python3 -m json.tool",
        "fi",
        "echo",
        "echo \"✅ DONE!\""
    ]' \
    --output text \
    --query 'Command.CommandId')

echo "📤 Command sent: $COMMAND_ID"
echo "⏳ Waiting 35 seconds for everything..."
sleep 35

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

if echo "$OUTPUT" | grep -q '"success".*:.*true'; then
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║   🎉🎉🎉  AUTHENTICATION IS WORKING!  🎉🎉🎉   ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Backend is operational and accepting requests!"
    echo ""
    echo "Frontend: aetheros-erp-frontend-483636500494.s3-website.eu-north-1.amazonaws.com"
    echo "Backend:  http://51.21.219.35:3000"
else
    echo "Check logs above"
fi
