#!/bin/bash

# ===========================================
# FULL DEPLOYMENT SCRIPT - Frontend & Backend
# ===========================================

set -e

INSTANCE_ID="i-0b20fd06fae7e84b1"
EC2_IP="51.21.219.35"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}➜${NC} $1"; }
print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }

echo ""
echo "=========================================="
echo "  WorldClass ERP - Full AWS Deployment"
echo "=========================================="
echo ""

# Step 1: Check AWS CLI
print_status "Checking AWS CLI..."
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI not installed"
    exit 1
fi
print_success "AWS CLI available"

# Step 2: Build Frontend
print_status "Building frontend for production..."
cd frontend
npm run build
if [ $? -eq 0 ]; then
    print_success "Frontend built successfully"
else
    print_error "Frontend build failed"
    exit 1
fi
cd ..

# Step 3: Create deployment package
print_status "Creating deployment package..."
rm -rf /tmp/erp-deploy
mkdir -p /tmp/erp-deploy

# Copy backend
cp -r backend/src /tmp/erp-deploy/
cp backend/package.json /tmp/erp-deploy/
cp backend/tsconfig.json /tmp/erp-deploy/
cp simple-auth-server.js /tmp/erp-deploy/

# Create backend .env for production
cat > /tmp/erp-deploy/.env << 'EOF'
NODE_ENV=production
PORT=3000

# Database - RDS
DATABASE_URL=postgresql://erp_admin:SecurePassword123!@aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com:5432/aetheros_erp

# JWT
JWT_SECRET=worldclass-erp-production-secret-2025-very-long-and-secure
JWT_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=7d

# Demo Mode
DEMO_MODE=true

# CORS
CORS_ORIGIN=*
EOF

# Create tar package
cd /tmp/erp-deploy
tar -czf /tmp/erp-backend.tar.gz .
cd -

# Copy frontend build
tar -czf /tmp/erp-frontend.tar.gz -C frontend/dist .

print_success "Deployment packages created"

# Step 4: Upload to S3 (we'll use S3 as intermediate storage)
print_status "Uploading to S3..."

BUCKET_NAME="aetheros-erp-deploy"

# Check if bucket exists, create if not
if ! aws s3 ls "s3://${BUCKET_NAME}" 2>&1 | grep -q 'NoSuchBucket'; then
    print_success "S3 bucket exists"
else
    print_status "Creating S3 bucket..."
    aws s3 mb "s3://${BUCKET_NAME}" --region eu-north-1
fi

# Upload packages
aws s3 cp /tmp/erp-backend.tar.gz "s3://${BUCKET_NAME}/deploy/erp-backend.tar.gz"
aws s3 cp /tmp/erp-frontend.tar.gz "s3://${BUCKET_NAME}/deploy/erp-frontend.tar.gz"

print_success "Packages uploaded to S3"

# Step 5: Deploy to EC2 via SSM
print_status "Deploying to EC2 via SSM..."

DEPLOY_COMMAND=$(cat << 'SSMEOF'
#!/bin/bash
set -e

echo "=== Starting Deployment ==="

# Download from S3
cd /home/ec2-user
aws s3 cp s3://aetheros-erp-deploy/deploy/erp-backend.tar.gz /tmp/
aws s3 cp s3://aetheros-erp-deploy/deploy/erp-frontend.tar.gz /tmp/

# Deploy Backend
echo "Deploying backend..."
rm -rf /home/ec2-user/backend-new
mkdir -p /home/ec2-user/backend-new
cd /home/ec2-user/backend-new
tar -xzf /tmp/erp-backend.tar.gz

# Install dependencies
npm install --production
npm install typescript ts-node-dev

# Stop existing backend
pm2 stop all || true

# Swap directories
cd /home/ec2-user
rm -rf backend-old
mv backend backend-old 2>/dev/null || true
mv backend-new backend

# Start backend
cd /home/ec2-user/backend
pm2 start npm --name "erp-backend" -- run dev
pm2 save

echo "Backend deployed!"

# Deploy Frontend (to nginx html directory)
echo "Deploying frontend..."
sudo rm -rf /var/www/html/*
sudo tar -xzf /tmp/erp-frontend.tar.gz -C /var/www/html/
sudo chown -R nginx:nginx /var/www/html/

# Restart nginx
sudo systemctl restart nginx

echo "Frontend deployed!"

# Health check
sleep 3
curl -s http://localhost:3000/health || echo "Backend health check..."

echo "=== Deployment Complete ==="
SSMEOF
)

COMMAND_ID=$(aws ssm send-command \
    --instance-ids "$INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --comment "Deploy ERP" \
    --parameters "commands=[$DEPLOY_COMMAND]" \
    --timeout-seconds 300 \
    --output text \
    --query 'Command.CommandId')

print_status "SSM Command ID: $COMMAND_ID"
print_status "Waiting for deployment..."

# Wait for completion
sleep 30

# Get result
echo ""
echo "=========================================="
echo "  Deployment Output"
echo "=========================================="
aws ssm get-command-invocation \
    --command-id "$COMMAND_ID" \
    --instance-id "$INSTANCE_ID" \
    --query 'StandardOutputContent' \
    --output text || echo "Command still running..."

echo ""
echo "=========================================="
echo ""

# Step 6: Test
print_status "Testing deployment..."
sleep 5

HEALTH=$(curl -s "http://${EC2_IP}:3000/health" || echo "failed")

if [[ "$HEALTH" == *"OK"* ]]; then
    print_success "Backend is running!"
else
    print_warning "Backend may still be starting..."
fi

echo ""
echo "=========================================="
echo "  DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "URLs:"
echo "  Frontend: http://${EC2_IP}"
echo "  Backend:  http://${EC2_IP}:3000"
echo ""
echo "Login credentials:"
echo "  Email: admin@demo.com"
echo "  Password: admin123"
echo ""
echo "Test health: curl http://${EC2_IP}:3000/health"
echo "=========================================="
