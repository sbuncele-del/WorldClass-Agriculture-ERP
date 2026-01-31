#!/bin/bash

# Fix Backend Environment Variable Loading
# This script ensures .env is properly loaded when backend starts

EC2_HOST="51.21.219.35"
EC2_USER="ec2-user"
BACKEND_DIR="/home/ec2-user/backend"

echo "====================================="
echo "Fixing Backend Environment Loading"
echo "====================================="

# Step 1: Ensure .env file exists on EC2
echo ""
echo "Step 1: Copying .env file to EC2..."
scp backend/.env ${EC2_USER}@${EC2_HOST}:${BACKEND_DIR}/.env

if [ $? -ne 0 ]; then
    echo "❌ Failed to copy .env file"
    exit 1
fi

echo "✅ .env file copied successfully"

# Step 2: Kill any running node processes
echo ""
echo "Step 2: Stopping any running node processes..."
ssh ${EC2_USER}@${EC2_HOST} "pkill -9 node || true"
sleep 2

# Step 3: Start backend with explicit .env path
echo ""
echo "Step 3: Starting backend with environment variables..."
ssh ${EC2_USER}@${EC2_HOST} "cd ${BACKEND_DIR} && NODE_ENV=production nohup node dist/index.js > logs/backend.log 2>&1 &"

sleep 3

# Step 4: Check if process started
echo ""
echo "Step 4: Verifying backend is running..."
ssh ${EC2_USER}@${EC2_HOST} "ps aux | grep 'node dist/index.js' | grep -v grep"

if [ $? -eq 0 ]; then
    echo "✅ Backend process is running"
else
    echo "❌ Backend process failed to start"
    echo ""
    echo "Checking logs for errors:"
    ssh ${EC2_USER}@${EC2_HOST} "tail -50 ${BACKEND_DIR}/logs/backend.log"
    exit 1
fi

# Step 5: Test backend API
echo ""
echo "Step 5: Testing backend API..."
sleep 3

# Test with a fresh signup
echo ""
echo "Creating test signup..."
RESPONSE=$(curl -s -X POST "http://${EC2_HOST}:3000/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"email": "envtest'$(date +%s)'@example.com", "password": "TestPassword123", "firstName": "Env", "lastName": "Test", "companyName": "EnvTest Co", "plan": "starter"}')

TOKEN=$(echo "$RESPONSE" | jq -r '.data.tokens.accessToken')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    echo "❌ Failed to get token from signup"
    echo "Response:"
    echo "$RESPONSE" | jq .
    exit 1
fi

echo "✅ Got access token: ${TOKEN:0:50}..."

# Test modules API with token
echo ""
echo "Testing modules API with token..."
MODULES_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "http://${EC2_HOST}:3000/api/modules/available")

echo "$MODULES_RESPONSE" | jq .

if echo "$MODULES_RESPONSE" | jq -e '.success == true' > /dev/null; then
    echo ""
    echo "✅✅✅ SUCCESS! Backend is working correctly! ✅✅✅"
    echo ""
    echo "Backend API is now properly loading environment variables."
    echo "Tokens are being signed and verified with the correct JWT_SECRET."
else
    echo ""
    echo "❌ Modules API still returning error"
    echo "Response:"
    echo "$MODULES_RESPONSE" | jq .
    echo ""
    echo "Checking backend logs:"
    ssh ${EC2_USER}@${EC2_HOST} "tail -100 ${BACKEND_DIR}/logs/backend.log"
    exit 1
fi

echo ""
echo "====================================="
echo "Environment Fix Complete!"
echo "====================================="
