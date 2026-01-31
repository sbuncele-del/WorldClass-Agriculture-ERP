#!/bin/bash
# deploy-frontend-docker.sh - Push and deploy dockerized frontend
# 
# Usage: ./deploy-frontend-docker.sh [tag]
# Example: ./deploy-frontend-docker.sh v1

set -e

TAG=${1:-latest}
REGION="eu-north-1"
AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
ECR_REPO="erp-frontend"
ECR_URI="${AWS_ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com/${ECR_REPO}"
EC2_INSTANCE="i-0b20fd06fae7e84b1"

echo "========================================"
echo "SiyaBusa ERP - Frontend Docker Deploy"
echo "========================================"
echo "Tag: $TAG"
echo "ECR: $ECR_URI"
echo ""

# Step 1: Create ECR repository if it doesn't exist
echo "📦 Creating ECR repository (if not exists)..."
aws ecr create-repository --repository-name $ECR_REPO --region $REGION 2>/dev/null || echo "Repository already exists"

# Step 2: Login to ECR
echo "🔐 Logging into ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_URI

# Step 3: Build the image
echo "🔨 Building Docker image..."
cd /workspaces/WorldClass-ERP/frontend
docker build -t ${ECR_REPO}:${TAG} .

# Step 4: Tag and push
echo "📤 Pushing to ECR..."
docker tag ${ECR_REPO}:${TAG} ${ECR_URI}:${TAG}
docker push ${ECR_URI}:${TAG}

# Step 5: Deploy to EC2
echo "🚀 Deploying to EC2..."
DEPLOY_COMMANDS=$(cat << EOF
# Pull and run frontend container
aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ECR_URI}
docker pull ${ECR_URI}:${TAG}
docker stop erp-frontend 2>/dev/null || true
docker rm erp-frontend 2>/dev/null || true
docker run -d --name erp-frontend --restart always -p 8080:80 ${ECR_URI}:${TAG}
echo "Frontend container deployed!"
docker ps | grep erp-frontend
EOF
)

aws ssm send-command \
    --instance-ids "$EC2_INSTANCE" \
    --document-name "AWS-RunShellScript" \
    --parameters "commands=[\"$DEPLOY_COMMANDS\"]" \
    --region $REGION \
    --output text

echo ""
echo "✅ Frontend Docker deployment initiated!"
echo "Container will be available at: http://51.20.67.228:8080"
echo ""
echo "Note: You may need to update nginx on EC2 to proxy to port 8080"
echo "Or update the nginx.conf in this container to serve directly on port 80"
