#!/bin/bash

# Kill Specific Process and Start Clean
INSTANCE_ID="i-0b20fd06fae7e84b1"

echo "🎯 Targeting Zombie Process 361079 via SSM"
echo "Instance: $INSTANCE_ID"
echo ""

COMMAND_ID=$(aws ssm send-command \
    --instance-ids "$INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --comment "Kill zombie process and start clean" \
    --parameters 'commands=[
        "#!/bin/bash",
        "echo \"🎯 Finding and killing process on port 3000...\"",
        "PORT_PID=$(sudo lsof -t -i:3000)",
        "echo \"Process on port 3000: $PORT_PID\"",
        "if [ ! -z \"$PORT_PID\" ]; then",
        "    echo \"Killing PID: $PORT_PID\"",
        "    sudo kill -9 $PORT_PID",
        "    sleep 5",
        "else",
        "    echo \"No process on port 3000\"",
        "fi",
        "echo",
        "echo \"✅ Verify port is free...\"",
        "sudo netstat -tlnp | grep 3000 || echo \"Port 3000 is FREE!\"",
        "echo",
        "echo \"🚀 Starting backend...\"",
        "cd /home/ec2-user/backend",
        "nohup node dist/index.js > logs/backend-clean.log 2>&1 &",
        "NEW_PID=$!",
        "echo \"Started with PID: $NEW_PID\"",
        "sleep 12",
        "echo",
        "echo \"📊 Check status...\"",
        "ps -p $NEW_PID || echo \"Process died\"",
        "echo",
        "echo \"🌐 Port status...\"",
        "sudo netstat -tlnp | grep 3000",
        "echo",
        "echo \"📝 Startup logs...\"",
        "tail -30 logs/backend-clean.log",
        "echo",
        "echo \"🧪 API Test with correct password...\"",
        "sleep 3",
        "curl -s -X POST http://localhost:3000/api/auth/signup -H \"Content-Type: application/json\" -d \"{\\\"email\\\": \\\"workingtest$(date +%s)@example.com\\\", \\\"password\\\": \\\"TestPass123\\\", \\\"firstName\\\": \\\"Work\\\", \\\"lastName\\\": \\\"Test\\\", \\\"companyName\\\": \\\"WorkTest Co\\\", \\\"plan\\\": \\\"starter\\\"}\" | python3 -m json.tool > /tmp/final_signup.json",
        "cat /tmp/final_signup.json",
        "echo",
        "TOKEN=$(python3 -c \"import json; data=json.load(open('/tmp/final_signup.json')); print(data['\'data\'']['\'tokens\'']['\'accessToken\''])\" 2>/dev/null)",
        "if [ ! -z \"$TOKEN\" ]; then",
        "    echo \"Got token: ${TOKEN:0:50}...\"",
        "    echo",
        "    echo \"Testing modules API...\"",
        "    curl -s -H \"Authorization: Bearer $TOKEN\" http://localhost:3000/api/modules/available | python3 -m json.tool",
        "fi"
    ]' \
    --output text \
    --query 'Command.CommandId')

echo "📤 Command sent: $COMMAND_ID"
echo "⏳ Waiting 35 seconds..."
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

if echo "$OUTPUT" | grep -q '"success".*:.*true.*"data"'; then
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║      ✅✅✅  BACKEND IS WORKING!  ✅✅✅       ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "The authentication issue is RESOLVED!"
    echo "Frontend: aetheros-erp-frontend-483636500494.s3-website.eu-north-1.amazonaws.com"
    echo "Backend:  http://51.21.219.35:3000"
fi
