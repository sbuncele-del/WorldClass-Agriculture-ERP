#!/bin/bash
set -e

echo "🔧 FIXING DATABASE CONNECTION - LOCKING TO AWS RDS"
echo "=================================================="

EC2_IP="51.20.67.228"
EC2_USER="ec2-user"

# Check if we can reach the EC2 instance
echo ""
echo "1️⃣ Testing EC2 connectivity..."
if curl -s --connect-timeout 5 http://$EC2_IP:3000/health > /dev/null; then
    echo "✅ EC2 instance is reachable"
else
    echo "❌ Cannot reach EC2 instance at $EC2_IP"
    exit 1
fi

# Check if SSH key exists
SSH_KEY=""
if [ -f ~/.ssh/aetheros-aws.pem ]; then
    SSH_KEY=~/.ssh/aetheros-aws.pem
elif [ -f ~/.ssh/id_rsa ]; then
    SSH_KEY=~/.ssh/id_rsa
else
    echo "❌ No SSH key found. Please provide SSH key path."
    echo "   Expected: ~/.ssh/aetheros-aws.pem or ~/.ssh/id_rsa"
    exit 1
fi

echo "✅ Using SSH key: $SSH_KEY"

# Upload ecosystem.config.js
echo ""
echo "2️⃣ Uploading ecosystem.config.js with RDS credentials..."
scp -i $SSH_KEY -o StrictHostKeyChecking=no \
    backend/ecosystem.config.js \
    $EC2_USER@$EC2_IP:/tmp/ecosystem.config.js

# Deploy and restart
echo ""
echo "3️⃣ Deploying to backend directory and restarting PM2..."
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP << 'ENDSSH'
    set -e
    
    # Move ecosystem config to backend directory
    sudo mv /tmp/ecosystem.config.js /home/ec2-user/backend/ecosystem.config.js
    sudo chown ec2-user:ec2-user /home/ec2-user/backend/ecosystem.config.js
    
    # Navigate to backend directory
    cd /home/ec2-user/backend
    
    # Stop current PM2 process
    echo "Stopping current PM2 process..."
    pm2 delete erp-backend 2>/dev/null || echo "No existing process to delete"
    
    # Start with ecosystem config
    echo "Starting PM2 with ecosystem.config.js..."
    pm2 start ecosystem.config.js
    
    # Save PM2 configuration
    pm2 save
    
    # Show status
    echo ""
    echo "PM2 Status:"
    pm2 status
    
    # Wait a moment for startup
    sleep 3
    
    # Show logs
    echo ""
    echo "Recent logs:"
    pm2 logs erp-backend --lines 20 --nostream
ENDSSH

# Test the connection
echo ""
echo "4️⃣ Testing database connection..."
sleep 2

HEALTH_CHECK=$(curl -s http://$EC2_IP:3000/health)
echo "Health check response: $HEALTH_CHECK"

# Test login endpoint
echo ""
echo "5️⃣ Testing login endpoint..."
LOGIN_TEST=$(curl -s -X POST http://$EC2_IP:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test123"}' 2>&1)

if echo "$LOGIN_TEST" | grep -q "ECONNREFUSED"; then
    echo "❌ Still getting database connection errors!"
    echo "Response: $LOGIN_TEST"
    exit 1
elif echo "$LOGIN_TEST" | grep -q "127.0.0.1:5432"; then
    echo "❌ Still trying to connect to localhost!"
    echo "Response: $LOGIN_TEST"
    exit 1
else
    echo "✅ No more localhost connection errors!"
    echo "Response: $LOGIN_TEST"
fi

echo ""
echo "=================================================="
echo "✅ DATABASE CONNECTION FIXED!"
echo "=================================================="
echo ""
echo "Backend is now connected to AWS RDS:"
echo "  Host: aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com"
echo "  Database: postgres"
echo ""
echo "Test your application at: http://primesources.site/login"
echo ""
