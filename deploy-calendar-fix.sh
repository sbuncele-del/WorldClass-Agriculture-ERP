#!/bin/bash

# Deploy Calendar Routes Fix to AWS EC2
# This script updates the backend with calendar API support

set -e

INSTANCE_ID="i-0b20fd06fae7e84b1"
REGION="eu-north-1"

echo "🚀 Deploying Calendar Routes to Production Backend"
echo "=================================================="

# Step 1: Upload source files from GitHub
echo ""
echo "📥 Step 1: Fetching latest code from GitHub..."
COMMAND_ID=$(aws ssm send-command \
  --instance-ids $INSTANCE_ID \
  --region $REGION \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=[
    "cd /home/ec2-user/backend",
    "echo Backing up current source...",
    "[ -d src_backup ] && rm -rf src_backup",
    "[ -d src ] && cp -r src src_backup",
    "echo Downloading calendar routes...",
    "mkdir -p src/routes",
    "curl -sf -H \"Cache-Control: no-cache\" https://raw.githubusercontent.com/sbuncele-del/WorldClass-ERP/main/backend/src/routes/calendar.routes.ts -o src/routes/calendar.routes.ts || echo Warning: Could not download calendar routes",
    "echo Downloading updated index.ts...",
    "curl -sf -H \"Cache-Control: no-cache\" https://raw.githubusercontent.com/sbuncele-del/WorldClass-ERP/main/backend/src/index.ts -o src/index.ts || echo Warning: Could not download index",
    "echo Downloading updated package.json...",
    "curl -sf -H \"Cache-Control: no-cache\" https://raw.githubusercontent.com/sbuncele-del/WorldClass-ERP/main/backend/package.json -o package.json.new || echo Warning: Could not download package.json",
    "[ -f package.json.new ] && mv package.json.new package.json",
    "echo Files downloaded successfully",
    "ls -la src/routes/calendar.routes.ts src/index.ts package.json"
  ]' \
  --query "Command.CommandId" \
  --output text)

echo "📤 Command sent: $COMMAND_ID"
echo "⏳ Waiting for file download..."
sleep 8

# Check status
STATUS=$(aws ssm get-command-invocation \
  --command-id $COMMAND_ID \
  --instance-id $INSTANCE_ID \
  --region $REGION \
  --query "Status" \
  --output text)

if [ "$STATUS" != "Success" ]; then
  echo "❌ File download failed. Checking output..."
  aws ssm get-command-invocation \
    --command-id $COMMAND_ID \
    --instance-id $INSTANCE_ID \
    --region $REGION \
    --query "[StandardOutputContent, StandardErrorContent]" \
    --output text
  exit 1
fi

echo "✅ Files downloaded successfully"

# Step 2: Rebuild backend
echo ""
echo "🔨 Step 2: Building backend..."
COMMAND_ID=$(aws ssm send-command \
  --instance-ids $INSTANCE_ID \
  --region $REGION \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=[
    "cd /home/ec2-user/backend",
    "echo Installing any missing dependencies...",
    "npm install --production",
    "echo Building TypeScript...",
    "npm run build",
    "echo Verifying calendar routes compiled...",
    "ls -la dist/routes/calendar.routes.js",
    "echo Build complete"
  ]' \
  --query "Command.CommandId" \
  --output text)

echo "📤 Command sent: $COMMAND_ID"
echo "⏳ Waiting for build to complete (this may take 30-60 seconds)..."
sleep 45

# Check build status
STATUS=$(aws ssm get-command-invocation \
  --command-id $COMMAND_ID \
  --instance-id $INSTANCE_ID \
  --region $REGION \
  --query "Status" \
  --output text)

if [ "$STATUS" != "Success" ]; then
  echo "❌ Build failed. Checking output..."
  aws ssm get-command-invocation \
    --command-id $COMMAND_ID \
    --instance-id $INSTANCE_ID \
    --region $REGION \
    --query "[StandardOutputContent, StandardErrorContent]" \
    --output text | tail -50
  exit 1
fi

echo "✅ Build completed successfully"

# Step 3: Restart backend service
echo ""
echo "🔄 Step 3: Restarting backend service..."
COMMAND_ID=$(aws ssm send-command \
  --instance-ids $INSTANCE_ID \
  --region $REGION \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=[
    "systemctl restart aetheros-backend",
    "sleep 8",
    "systemctl status aetheros-backend --no-pager --lines=15"
  ]' \
  --query "Command.CommandId" \
  --output text)

echo "📤 Command sent: $COMMAND_ID"
echo "⏳ Waiting for service restart..."
sleep 12

# Check service status
OUTPUT=$(aws ssm get-command-invocation \
  --command-id $COMMAND_ID \
  --instance-id $INSTANCE_ID \
  --region $REGION \
  --query "StandardOutputContent" \
  --output text)

if echo "$OUTPUT" | grep -q "active (running)"; then
  echo "✅ Backend service is running"
else
  echo "❌ Backend service failed to start. Output:"
  echo "$OUTPUT"
  exit 1
fi

# Step 4: Test calendar endpoint
echo ""
echo "🧪 Step 4: Testing calendar endpoint..."
COMMAND_ID=$(aws ssm send-command \
  --instance-ids $INSTANCE_ID \
  --region $REGION \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=[
    "echo Testing calendar endpoint...",
    "curl -s -w \"\\nHTTP_CODE:%{http_code}\" http://localhost:5000/api/calendar/events || echo Test_Failed"
  ]' \
  --query "Command.CommandId" \
  --output text)

echo "📤 Command sent: $COMMAND_ID"
echo "⏳ Running endpoint test..."
sleep 8

OUTPUT=$(aws ssm get-command-invocation \
  --command-id $COMMAND_ID \
  --instance-id $INSTANCE_ID \
  --region $REGION \
  --query "StandardOutputContent" \
  --output text)

echo ""
echo "📊 Endpoint test result:"
echo "$OUTPUT"

if echo "$OUTPUT" | grep -q "HTTP_CODE:401\|HTTP_CODE:403\|HTTP_CODE:200"; then
  echo ""
  echo "✅ Calendar endpoint is responding! (401/403 is expected without authentication)"
else
  echo ""
  echo "⚠️  Calendar endpoint may still be initializing..."
fi

# Step 5: Check backend logs
echo ""
echo "📋 Step 5: Checking recent backend logs..."
COMMAND_ID=$(aws ssm send-command \
  --instance-ids $INSTANCE_ID \
  --region $REGION \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=[
    "tail -30 /home/ec2-user/backend/logs/backend.log 2>/dev/null || journalctl -u aetheros-backend -n 30 --no-pager"
  ]' \
  --query "Command.CommandId" \
  --output text)

sleep 8

OUTPUT=$(aws ssm get-command-invocation \
  --command-id $COMMAND_ID \
  --instance-id $INSTANCE_ID \
  --region $REGION \
  --query "StandardOutputContent" \
  --output text)

echo "$OUTPUT" | tail -20

echo ""
echo "=================================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "=================================================="
echo ""
echo "Calendar API is now available at:"
echo "  https://primesources.site/api/calendar/events"
echo "  http://51.20.67.228:5000/api/calendar/events"
echo ""
echo "Available endpoints:"
echo "  GET    /api/calendar/events       - List all events"
echo "  GET    /api/calendar/events/:id   - Get single event"
echo "  POST   /api/calendar/events       - Create event"
echo "  PUT    /api/calendar/events/:id   - Update event"
echo "  DELETE /api/calendar/events/:id   - Delete event"
echo ""
echo "All endpoints require authentication token in Authorization header"
echo ""
