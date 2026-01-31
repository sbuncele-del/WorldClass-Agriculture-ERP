#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 AetherOS ERP - AWS Deployment Script${NC}"
echo -e "${BLUE}=========================================${NC}\n"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install it first:${NC}"
    echo "brew install awscli"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Please install Docker Desktop first.${NC}"
    exit 1
fi

# Variables
AWS_REGION="${AWS_REGION:-us-east-1}"
PROJECT_NAME="aetheros-erp"
ECR_REPO_NAME="${PROJECT_NAME}-backend"

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "Region: ${AWS_REGION}"
echo "Project: ${PROJECT_NAME}"
echo ""

# Get AWS Account ID
echo -e "${YELLOW}🔍 Getting AWS Account ID...${NC}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null)

if [ -z "$AWS_ACCOUNT_ID" ]; then
    echo -e "${RED}❌ Failed to get AWS Account ID. Please run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ AWS Account ID: ${AWS_ACCOUNT_ID}${NC}\n"

ECR_REPO="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}"

# Step 1: Create ECR Repository if it doesn't exist
echo -e "${YELLOW}📦 Step 1: Setting up ECR Repository...${NC}"
if aws ecr describe-repositories --repository-names ${ECR_REPO_NAME} --region ${AWS_REGION} &> /dev/null; then
    echo -e "${GREEN}✓ ECR repository already exists${NC}"
else
    echo "Creating ECR repository..."
    aws ecr create-repository \
        --repository-name ${ECR_REPO_NAME} \
        --region ${AWS_REGION} \
        --image-scanning-configuration scanOnPush=true \
        --encryption-configuration encryptionType=AES256
    echo -e "${GREEN}✓ ECR repository created${NC}"
fi
echo ""

# Step 2: Build Backend Docker Image
echo -e "${YELLOW}🔨 Step 2: Building Backend Docker Image...${NC}"
cd backend

if [ ! -f "Dockerfile" ]; then
    echo -e "${RED}❌ Dockerfile not found in backend directory${NC}"
    exit 1
fi

docker build -t ${PROJECT_NAME}-backend:latest . --platform linux/amd64
echo -e "${GREEN}✓ Docker image built successfully${NC}\n"

# Step 3: Login to ECR
echo -e "${YELLOW}🔐 Step 3: Logging into Amazon ECR...${NC}"
aws ecr get-login-password --region ${AWS_REGION} | \
    docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
echo -e "${GREEN}✓ Successfully logged into ECR${NC}\n"

# Step 4: Tag and Push Image
echo -e "${YELLOW}⬆️  Step 4: Pushing Docker Image to ECR...${NC}"
docker tag ${PROJECT_NAME}-backend:latest ${ECR_REPO}:latest
docker tag ${PROJECT_NAME}-backend:latest ${ECR_REPO}:$(date +%Y%m%d-%H%M%S)
docker push ${ECR_REPO}:latest
docker push ${ECR_REPO}:$(date +%Y%m%d-%H%M%S)
echo -e "${GREEN}✓ Image pushed successfully${NC}\n"

# Step 5: Create ECS Cluster (if needed)
echo -e "${YELLOW}🚢 Step 5: Setting up ECS Cluster...${NC}"
CLUSTER_NAME="${PROJECT_NAME}-cluster"

if aws ecs describe-clusters --clusters ${CLUSTER_NAME} --region ${AWS_REGION} 2>/dev/null | grep -q "ACTIVE"; then
    echo -e "${GREEN}✓ ECS cluster already exists${NC}"
else
    echo "Creating ECS cluster..."
    aws ecs create-cluster \
        --cluster-name ${CLUSTER_NAME} \
        --region ${AWS_REGION} \
        --capacity-providers FARGATE FARGATE_SPOT \
        --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1
    echo -e "${GREEN}✓ ECS cluster created${NC}"
fi
echo ""

# Step 6: Build and Deploy Frontend
echo -e "${YELLOW}🎨 Step 6: Building Frontend...${NC}"
cd ../frontend

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found in frontend directory${NC}"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build frontend
npm run build
echo -e "${GREEN}✓ Frontend built successfully${NC}\n"

# Step 7: Create S3 Bucket
echo -e "${YELLOW}☁️  Step 7: Setting up S3 Bucket...${NC}"
S3_BUCKET="${PROJECT_NAME}-frontend-${AWS_ACCOUNT_ID}"

if aws s3 ls "s3://${S3_BUCKET}" 2>&1 | grep -q 'NoSuchBucket'; then
    echo "Creating S3 bucket..."
    aws s3 mb s3://${S3_BUCKET} --region ${AWS_REGION}
    
    # Configure bucket for static website hosting
    aws s3 website s3://${S3_BUCKET} \
        --index-document index.html \
        --error-document index.html
    
    # Set bucket policy for public read
    cat > /tmp/bucket-policy.json <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::${S3_BUCKET}/*"
        }
    ]
}
EOF
    aws s3api put-bucket-policy --bucket ${S3_BUCKET} --policy file:///tmp/bucket-policy.json
    rm /tmp/bucket-policy.json
    
    echo -e "${GREEN}✓ S3 bucket created and configured${NC}"
else
    echo -e "${GREEN}✓ S3 bucket already exists${NC}"
fi
echo ""

# Step 8: Upload Frontend to S3
echo -e "${YELLOW}⬆️  Step 8: Uploading Frontend to S3...${NC}"
aws s3 sync dist/ s3://${S3_BUCKET} \
    --delete \
    --cache-control "max-age=31536000,public" \
    --exclude index.html

aws s3 cp dist/index.html s3://${S3_BUCKET}/index.html \
    --cache-control "max-age=0,no-cache,no-store,must-revalidate" \
    --content-type "text/html"

echo -e "${GREEN}✓ Frontend uploaded successfully${NC}\n"

# Summary
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}=========================================${NC}\n"

echo -e "${BLUE}📊 Deployment Summary:${NC}"
echo -e "Frontend URL: ${YELLOW}http://${S3_BUCKET}.s3-website-${AWS_REGION}.amazonaws.com${NC}"
echo -e "ECR Repository: ${YELLOW}${ECR_REPO}${NC}"
echo -e "ECS Cluster: ${YELLOW}${CLUSTER_NAME}${NC}"
echo ""

echo -e "${BLUE}📝 Next Steps:${NC}"
echo "1. Set up RDS PostgreSQL database in AWS Console"
echo "2. Create ECS Task Definition with database credentials"
echo "3. Create ECS Service to run backend containers"
echo "4. Set up Application Load Balancer"
echo "5. Create CloudFront distribution for HTTPS and global CDN"
echo "6. Configure custom domain with Route 53"
echo ""

echo -e "${YELLOW}📖 For detailed instructions, see: docs/AWS-DEPLOYMENT-GUIDE.md${NC}"
echo ""

cd ..
