#!/bin/bash

# Simple Compliance Module Deployment
# Run this on EC2 after uploading all files

echo "======================================"
echo "Compliance Module Deployment"
echo "======================================"
echo ""

# Step 1: Deploy Schema
echo "[1/4] Deploying database schema..."
PGPASSWORD="Worldclass2025" psql \
  -h aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com \
  -U worldclass_admin \
  -d aetheros_erp \
  -f /home/ec2-user/compliance-deployment/015_compliance_governance_module.sql

if [ $? -eq 0 ]; then
  echo "✅ Schema deployed (44 tables created)"
else
  echo "❌ Schema deployment failed"
  exit 1
fi

echo ""

# Step 2: Copy Controllers
echo "[2/4] Copying controllers..."
cp /home/ec2-user/compliance-deployment/*.controller.ts /home/ec2-user/backend/src/controllers/
echo "✅ Controllers copied"

echo ""

# Step 3: Copy Routes
echo "[3/4] Copying routes..."
cp /home/ec2-user/compliance-deployment/*.routes.ts /home/ec2-user/backend/src/routes/
echo "✅ Routes copied"

echo ""

# Step 4: Copy index.ts
echo "[4/4] Copying main app file..."
cp /home/ec2-user/compliance-deployment/index.ts /home/ec2-user/backend/src/
echo "✅ Main app file copied"

echo ""

# Step 5: Build and Restart
echo "[5/5] Building and restarting..."
cd /home/ec2-user/backend
npm run build

if [ $? -eq 0 ]; then
  echo "✅ Build successful"
  pm2 restart aetheros-backend
  echo "✅ Backend restarted"
else
  echo "❌ Build failed"
  exit 1
fi

echo ""
echo "======================================"
echo "✅ Deployment Complete!"
echo "======================================"
echo ""
echo "Test endpoints:"
echo "curl http://localhost:3000/api/compliance/frameworks"
echo "curl http://localhost:3000/api/sars-sentinel/dashboard/stats"
echo "curl http://localhost:3000/api/audit/engagements"
echo ""
