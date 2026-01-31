# AWS Deployment Guide - AetherOS ERP
## Complete Cloud Infrastructure Setup

---

## 🎯 Architecture Overview

```
                           ┌─────────────────┐
                           │   CloudFront    │
                           │   (CDN/SSL)     │
                           └────────┬────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
            ┌───────▼────────┐            ┌────────▼───────┐
            │   S3 Bucket    │            │  Application   │
            │  (Frontend)    │            │  Load Balancer │
            └────────────────┘            └────────┬───────┘
                                                   │
                                    ┌──────────────┴──────────────┐
                                    │                             │
                            ┌───────▼────────┐          ┌────────▼───────┐
                            │   ECS Fargate  │          │   ECS Fargate  │
                            │   (Backend)    │          │   (Backend)    │
                            │   Container 1  │          │   Container 2  │
                            └───────┬────────┘          └────────┬───────┘
                                    │                             │
                                    └──────────────┬──────────────┘
                                                   │
                                          ┌────────▼────────┐
                                          │   RDS PostgreSQL│
                                          │   (Multi-AZ)    │
                                          └─────────────────┘
```

---

## 📋 Prerequisites

1. **AWS Account** with billing enabled
2. **AWS CLI** installed and configured
3. **Docker** installed locally
4. **Node.js 18+** and npm
5. **Domain name** (optional but recommended)

---

## 🚀 Step 1: Install AWS CLI & Configure

### Install AWS CLI (macOS)
```bash
# Using Homebrew
brew install awscli

# Verify installation
aws --version
```

### Configure AWS Credentials
```bash
aws configure

# Enter:
# AWS Access Key ID: [Your Access Key]
# AWS Secret Access Key: [Your Secret Key]
# Default region: us-east-1 (or your preferred region)
# Default output format: json
```

---

## 🗄️ Step 2: Create RDS PostgreSQL Database

### Using AWS Console:
1. Go to **RDS** → **Create database**
2. Choose **PostgreSQL** version 15+
3. Templates: **Production** (or Dev/Test for testing)
4. Settings:
   - DB instance identifier: `aetheros-erp-db`
   - Master username: `postgres`
   - Master password: [Strong password - save it!]
5. Instance configuration:
   - DB instance class: `db.t3.medium` (can scale later)
6. Storage:
   - Allocated storage: 100 GB
   - Storage autoscaling: Enable (max 1000 GB)
7. Connectivity:
   - VPC: Default VPC (or create new)
   - Public access: **No** (for security)
   - VPC security group: Create new
   - Security group name: `aetheros-erp-db-sg`
8. Database authentication: Password authentication
9. Additional configuration:
   - Initial database name: `aetheros_erp`
   - Backup retention: 7 days
   - Enable encryption
10. **Create database**

### Save Database Details:
```bash
# After creation, note down:
DB_HOST=aetheros-erp-db.xxxxxxxxxxxx.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=aetheros_erp
DB_USER=postgres
DB_PASSWORD=[your-password]
```

---

## 🐳 Step 3: Containerize Backend

### Create Dockerfile (if not exists)
Already exists at `/backend/Dockerfile` - verify it:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### Build and Test Locally
```bash
cd backend
docker build -t aetheros-backend:latest .
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://postgres:password@host.docker.internal:5432/aetheros_erp" \
  aetheros-backend:latest
```

---

## 📦 Step 4: Push Backend to Amazon ECR

### Create ECR Repository
```bash
# Create repository
aws ecr create-repository \
  --repository-name aetheros-erp-backend \
  --region us-east-1

# Get login command
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  [YOUR_AWS_ACCOUNT_ID].dkr.ecr.us-east-1.amazonaws.com
```

### Tag and Push Image
```bash
# Tag image
docker tag aetheros-backend:latest \
  [YOUR_AWS_ACCOUNT_ID].dkr.ecr.us-east-1.amazonaws.com/aetheros-erp-backend:latest

# Push to ECR
docker push [YOUR_AWS_ACCOUNT_ID].dkr.ecr.us-east-1.amazonaws.com/aetheros-erp-backend:latest
```

---

## 🚢 Step 5: Deploy Backend on ECS Fargate

### Create ECS Cluster
```bash
aws ecs create-cluster \
  --cluster-name aetheros-erp-cluster \
  --region us-east-1
```

### Create Task Definition
Create `backend-task-definition.json`:

```json
{
  "family": "aetheros-backend-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::[YOUR_AWS_ACCOUNT_ID]:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "aetheros-backend",
      "image": "[YOUR_AWS_ACCOUNT_ID].dkr.ecr.us-east-1.amazonaws.com/aetheros-erp-backend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        { "name": "NODE_ENV", "value": "production" },
        { "name": "PORT", "value": "3000" }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:[ACCOUNT_ID]:secret:aetheros/db-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/aetheros-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Register Task Definition
```bash
aws ecs register-task-definition \
  --cli-input-json file://backend-task-definition.json
```

### Create ECS Service
```bash
aws ecs create-service \
  --cluster aetheros-erp-cluster \
  --service-name aetheros-backend-service \
  --task-definition aetheros-backend-task \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=aetheros-backend,containerPort=3000"
```

---

## 🌐 Step 6: Deploy Frontend to S3 + CloudFront

### Build Frontend
```bash
cd frontend
npm run build
# Creates /dist folder with optimized files
```

### Create S3 Bucket
```bash
aws s3 mb s3://aetheros-erp-frontend --region us-east-1

# Enable static website hosting
aws s3 website s3://aetheros-erp-frontend \
  --index-document index.html \
  --error-document index.html
```

### Upload Frontend Files
```bash
aws s3 sync dist/ s3://aetheros-erp-frontend \
  --delete \
  --cache-control "max-age=31536000,public" \
  --exclude index.html

# Upload index.html separately with no cache
aws s3 cp dist/index.html s3://aetheros-erp-frontend/index.html \
  --cache-control "max-age=0,no-cache,no-store,must-revalidate"
```

### Create CloudFront Distribution
```bash
aws cloudfront create-distribution \
  --origin-domain-name aetheros-erp-frontend.s3.amazonaws.com \
  --default-root-object index.html
```

---

## 🔐 Step 7: Store Secrets in AWS Secrets Manager

```bash
# Store database credentials
aws secretsmanager create-secret \
  --name aetheros/db-url \
  --secret-string "postgresql://postgres:PASSWORD@aetheros-erp-db.xxxx.rds.amazonaws.com:5432/aetheros_erp"

# Store JWT secret
aws secretsmanager create-secret \
  --name aetheros/jwt-secret \
  --secret-string "your-super-secret-jwt-key-change-this"
```

---

## 📊 Step 8: Run Database Migrations

### Connect to RDS via Bastion Host or VPN
```bash
# Option 1: Use AWS Systems Manager Session Manager
# Option 2: SSH tunnel through EC2 bastion

# Once connected, run migrations
psql -h aetheros-erp-db.xxxx.rds.amazonaws.com \
     -U postgres \
     -d aetheros_erp \
     -f backend/migrations/001_initial_schema.sql
```

---

## 🔧 Step 9: Configure Environment Variables

### Backend Environment (.env for ECS)
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres:PASSWORD@aetheros-erp-db.xxxx.rds.amazonaws.com:5432/aetheros_erp
JWT_SECRET=[from-secrets-manager]
CORS_ORIGIN=https://your-cloudfront-url.cloudfront.net
LOG_LEVEL=info
```

### Frontend Environment (.env.production)
```env
VITE_API_URL=https://api.aetheros-erp.com
VITE_APP_NAME=AetherOS ERP
```

---

## 📈 Step 10: Set Up Monitoring & Logging

### Enable CloudWatch Logs
```bash
# Create log group
aws logs create-log-group --log-group-name /ecs/aetheros-backend

# Set retention
aws logs put-retention-policy \
  --log-group-name /ecs/aetheros-backend \
  --retention-in-days 30
```

### Set Up CloudWatch Alarms
```bash
# High CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name aetheros-backend-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

---

## 🚀 Quick Deploy Script

Create `deploy-to-aws.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Deploying AetherOS ERP to AWS..."

# Variables
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPO="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/aetheros-erp-backend"
S3_BUCKET="aetheros-erp-frontend"

# 1. Build and push backend
echo "📦 Building backend Docker image..."
cd backend
docker build -t aetheros-backend:latest .

echo "🔐 Logging into ECR..."
aws ecr get-login-password --region ${AWS_REGION} | \
  docker login --username AWS --password-stdin ${ECR_REPO}

echo "⬆️ Pushing to ECR..."
docker tag aetheros-backend:latest ${ECR_REPO}:latest
docker push ${ECR_REPO}:latest

# 2. Update ECS service
echo "🔄 Updating ECS service..."
aws ecs update-service \
  --cluster aetheros-erp-cluster \
  --service aetheros-backend-service \
  --force-new-deployment \
  --region ${AWS_REGION}

# 3. Build and deploy frontend
echo "🎨 Building frontend..."
cd ../frontend
npm run build

echo "⬆️ Uploading to S3..."
aws s3 sync dist/ s3://${S3_BUCKET} --delete

echo "🔄 Invalidating CloudFront cache..."
DISTRIBUTION_ID=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Origins.Items[?DomainName=='${S3_BUCKET}.s3.amazonaws.com']].Id" \
  --output text)

aws cloudfront create-invalidation \
  --distribution-id ${DISTRIBUTION_ID} \
  --paths "/*"

echo "✅ Deployment complete!"
echo "🌐 Frontend: https://${DISTRIBUTION_ID}.cloudfront.net"
echo "🔌 Backend: Check ECS service status in AWS Console"
```

Make it executable:
```bash
chmod +x deploy-to-aws.sh
```

---

## 💰 Cost Estimation (Monthly)

### ⚠️ PRODUCTION SETUP (NOT FREE):
- **RDS db.t3.medium**: ~$60-80
- **ECS Fargate (2 tasks)**: ~$50-70
- **S3 + CloudFront**: ~$5-15
- **Application Load Balancer**: ~$20
- **Data Transfer**: ~$10-30
- **CloudWatch**: ~$5
- **Total**: **~$150-220/month**

### 🆓 FREE TIER SETUP (12 MONTHS):
- **EC2 t3.micro**: **$0** (750 hours/month free)
- **RDS db.t3.micro**: **$0** (750 hours/month + 20GB free)
- **S3 (5GB)**: **$0** (5GB storage + 20,000 requests free)
- **CloudFront (50GB)**: **$0** (50GB data transfer free)
- **Elastic IP**: **$0** (if attached to running instance)
- **Total**: **$0/month for first 12 months**

**⚠️ Important**: 
- Free tier is valid for **12 months** from AWS account creation
- Must stay within limits (1 t3.micro instance, 20GB RDS storage)
- After 12 months, costs will apply unless you upgrade plan

---

## 🎯 Next Steps After Deployment

1. **Set up custom domain** with Route 53
2. **Enable SSL certificate** with ACM
3. **Configure auto-scaling** for ECS
4. **Set up CI/CD pipeline** with CodePipeline
5. **Enable WAF** for security
6. **Set up database backups** automated snapshots
7. **Configure CloudWatch dashboards** for monitoring

---

## 📞 Support Resources

- AWS Documentation: https://docs.aws.amazon.com/
- AWS Free Tier: https://aws.amazon.com/free/
- AWS Calculator: https://calculator.aws/

---

**Ready to deploy?** Run `./deploy-to-aws.sh` after setting up your AWS infrastructure!

*Last updated: November 8, 2025*
