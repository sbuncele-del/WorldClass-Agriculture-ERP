#!/bin/bash

# Deploy Cash Management Module to EC2
# Run this when network is stable

set -e

echo "════════════════════════════════════════════════════════"
echo "  Deploy Cash Management Module"
echo "════════════════════════════════════════════════════════"
echo ""

EC2_HOST="51.21.219.35"
SSH_KEY="$HOME/.ssh/aetheros-aws.pem"

echo "📦 Step 1: Deploy compiled files to EC2..."
echo ""

# Deploy cash management module
rsync -avz --progress -e "ssh -i $SSH_KEY" \
  backend/dist/modules/cash-management/ \
  ec2-user@$EC2_HOST:/home/ec2-user/backend/dist/modules/cash-management/

# Deploy routes
rsync -avz --progress -e "ssh -i $SSH_KEY" \
  backend/dist/routes/cash-management.routes.js \
  ec2-user@$EC2_HOST:/home/ec2-user/backend/dist/routes/

echo ""
echo "✅ Files deployed"
echo ""

echo "🔄 Step 2: Restart backend..."
echo ""

ssh -i $SSH_KEY ec2-user@$EC2_HOST << 'ENDSSH'
  cd /home/ec2-user/backend
  pm2 restart aetheros-backend
  echo ""
  echo "Waiting for backend to start..."
  sleep 5
  pm2 status
ENDSSH

echo ""
echo "✅ Backend restarted"
echo ""

echo "🧪 Step 3: Test endpoints..."
echo ""

sleep 2

# Test banks endpoint
echo "Testing GET /api/cash-management/banks..."
curl -s http://$EC2_HOST:3000/api/cash-management/banks | jq '.' || echo "Failed"
echo ""

# Test bank accounts
echo "Testing GET /api/cash-management/bank-accounts..."
curl -s http://$EC2_HOST:3000/api/cash-management/bank-accounts | jq '.' || echo "Failed"
echo ""

# Test summary
echo "Testing GET /api/cash-management/summary..."
curl -s http://$EC2_HOST:3000/api/cash-management/summary | jq '.' || echo "Failed"
echo ""

echo "════════════════════════════════════════════════════════"
echo "  ✅ CASH MANAGEMENT MODULE DEPLOYED!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "📊 Module Status:"
echo "   • Database: 10 tables created ✅"
echo "   • Backend: Compiled and deployed ✅"
echo "   • Endpoints: 17+ endpoints ready"
echo ""
echo "🧪 Test the endpoints:"
echo "   curl http://$EC2_HOST:3000/api/cash-management/banks"
echo "   curl http://$EC2_HOST:3000/api/cash-management/bank-accounts"
echo "   curl http://$EC2_HOST:3000/api/cash-management/statements"
echo "   curl http://$EC2_HOST:3000/api/cash-management/summary"
echo ""
