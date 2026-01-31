#!/bin/bash
# =============================================================
# AetherOS ERP - Complete Deployment Script for EC2
# Date: December 9, 2025
# Run this via AWS SSM Session Manager on the EC2 instance
# =============================================================

set -e

echo "=============================================="
echo "   AetherOS ERP Deployment - December 2025"
echo "=============================================="
echo ""

# Configuration
S3_BUCKET="aetheros-erp-deployments"
BACKEND_PACKAGE="backend-dec9-2025.tar.gz"
FRONTEND_PACKAGE="frontend-dec9-2025.tar.gz"
BACKEND_DIR="/home/ec2-user/backend"
FRONTEND_DIR="/var/www/aetheros"

# Step 1: Download packages from S3
echo "📥 Step 1: Downloading deployment packages from S3..."
cd /tmp
aws s3 cp s3://$S3_BUCKET/$BACKEND_PACKAGE /tmp/$BACKEND_PACKAGE
aws s3 cp s3://$S3_BUCKET/$FRONTEND_PACKAGE /tmp/$FRONTEND_PACKAGE
echo "✅ Downloads complete"
echo ""

# Step 2: Backup current deployment
echo "💾 Step 2: Backing up current deployment..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
if [ -d "$BACKEND_DIR/src" ]; then
    cp -r $BACKEND_DIR/src $BACKEND_DIR/src.backup.$TIMESTAMP
    echo "   Backend backup: src.backup.$TIMESTAMP"
fi
if [ -d "$FRONTEND_DIR/dist" ]; then
    cp -r $FRONTEND_DIR/dist $FRONTEND_DIR/dist.backup.$TIMESTAMP 2>/dev/null || true
    echo "   Frontend backup created"
fi
echo "✅ Backups complete"
echo ""

# Step 3: Deploy Backend
echo "🔧 Step 3: Deploying Backend..."
cd $BACKEND_DIR

# Extract new backend code
echo "   Extracting backend code..."
tar -xzf /tmp/$BACKEND_PACKAGE

# Install dependencies
echo "   Installing dependencies (this may take a minute)..."
npm install --production=false

# Build TypeScript
echo "   Building TypeScript..."
npm run build

echo "✅ Backend deployed"
echo ""

# Step 4: Deploy Frontend
echo "🎨 Step 4: Deploying Frontend..."
sudo mkdir -p $FRONTEND_DIR
cd $FRONTEND_DIR

# Remove old dist if exists
sudo rm -rf dist 2>/dev/null || true

# Extract new frontend
sudo tar -xzf /tmp/$FRONTEND_PACKAGE
sudo chown -R nginx:nginx dist 2>/dev/null || sudo chown -R www-data:www-data dist 2>/dev/null || true

echo "✅ Frontend deployed"
echo ""

# Step 5: Restart Services
echo "🔄 Step 5: Restarting services..."

# Restart backend with PM2
cd $BACKEND_DIR
pm2 delete all 2>/dev/null || true
pm2 start dist/index.js --name "aetheros-backend" --env production
pm2 save
pm2 startup 2>/dev/null || true

# Restart Nginx
sudo systemctl reload nginx 2>/dev/null || sudo service nginx reload 2>/dev/null || echo "   Note: Nginx reload may need manual intervention"

echo "✅ Services restarted"
echo ""

# Step 6: Verify deployment
echo "🔍 Step 6: Verifying deployment..."
echo ""
echo "PM2 Status:"
pm2 status

echo ""
echo "Backend Health Check:"
sleep 3
curl -s http://localhost:3000/health || echo "   Waiting for backend to start..."

echo ""
echo "=============================================="
echo "   ✅ DEPLOYMENT COMPLETE!"
echo "=============================================="
echo ""
echo "Access your application at:"
echo "   Frontend: https://app.aetheros.co.za (or your domain)"
echo "   Backend API: https://api.aetheros.co.za/api/v1/health"
echo ""
echo "Useful commands:"
echo "   pm2 logs         - View backend logs"
echo "   pm2 monit        - Monitor backend"
echo "   pm2 restart all  - Restart backend"
echo ""
