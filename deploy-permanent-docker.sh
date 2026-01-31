#!/bin/bash
# ============================================
# PERMANENT DEPLOYMENT - DOCKER BASED
# This script builds and deploys a Docker image
# that has EVERYTHING locked in permanently
# ============================================

set -e

EC2_INSTANCE="i-0b20fd06fae7e84b1"
ECR_REPO="483636500494.dkr.ecr.eu-north-1.amazonaws.com/erp-backend"
REGION="eu-north-1"

echo "=========================================="
echo "BUILDING PERMANENT DOCKER DEPLOYMENT"
echo "=========================================="

# Step 1: Build TypeScript
echo ""
echo "1. Building TypeScript..."
cd /workspaces/WorldClass-ERP/backend
npm run build 2>/dev/null || npx tsc

# Step 2: Create ECR repository if it doesn't exist
echo ""
echo "2. Setting up ECR repository..."
aws ecr describe-repositories --repository-names erp-backend --region $REGION 2>/dev/null || \
aws ecr create-repository --repository-name erp-backend --region $REGION

# Step 3: Login to ECR
echo ""
echo "3. Logging into ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin 483636500494.dkr.ecr.eu-north-1.amazonaws.com

# Step 4: Build Docker image
echo ""
echo "4. Building Docker image with ALL dependencies baked in..."
docker build -f Dockerfile.production -t erp-backend:latest .

# Step 5: Tag and push to ECR
echo ""
echo "5. Pushing to ECR..."
docker tag erp-backend:latest $ECR_REPO:latest
docker push $ECR_REPO:latest

# Step 6: Deploy to EC2
echo ""
echo "6. Deploying to EC2..."
aws ssm send-command \
    --instance-ids "$EC2_INSTANCE" \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=[
        "aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin 483636500494.dkr.ecr.eu-north-1.amazonaws.com",
        "docker pull 483636500494.dkr.ecr.eu-north-1.amazonaws.com/erp-backend:latest",
        "docker stop erp-backend 2>/dev/null || true",
        "docker rm erp-backend 2>/dev/null || true",
        "docker run -d --name erp-backend --restart always -p 3000:3000 483636500494.dkr.ecr.eu-north-1.amazonaws.com/erp-backend:latest",
        "sleep 5",
        "docker ps",
        "curl -s http://localhost:3000/health"
    ]' \
    --region $REGION \
    --output json

echo ""
echo "=========================================="
echo "DEPLOYMENT COMPLETE"
echo "=========================================="
echo ""
echo "The Docker container will:"
echo "  - AUTO-RESTART if it crashes"
echo "  - AUTO-RESTART on server reboot"
echo "  - NEVER lose dependencies (baked in image)"
echo "  - NEVER lose config (baked in image)"
echo ""
