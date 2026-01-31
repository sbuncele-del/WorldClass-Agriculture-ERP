# AWS FREE TIER Deployment Guide - AetherOS ERP
## 100% FREE for 12 Months (New AWS Accounts)

---

## 🆓 FREE TIER Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     CloudFront CDN                      │
│                  (FREE: 50GB/month)                     │
└────────────────────┬────────────────────────────────────┘
                     │
      ┌──────────────┴──────────────┐
      │                             │
┌─────▼─────┐                ┌─────▼──────┐
│ S3 Bucket │                │   EC2      │
│ (Frontend)│                │ t3.micro   │
│FREE: 5GB  │                │ (Backend)  │
└───────────┘                │ FREE 24/7  │
                             └─────┬──────┘
                                   │
                          ┌────────▼────────┐
                          │ RDS PostgreSQL  │
                          │   db.t3.micro   │
                          │ FREE: 20GB      │
                          └─────────────────┘
```

**Total Monthly Cost: $0** (for first 12 months)

---

## 📋 What's Included in FREE TIER

✅ **EC2 t3.micro**: 750 hours/month (run 1 server 24/7)
✅ **RDS db.t3.micro**: 750 hours/month + 20GB storage
✅ **S3**: 5GB storage + 20,000 GET + 2,000 PUT requests
✅ **CloudFront**: 50GB data transfer + 2,000,000 requests
✅ **Elastic IP**: FREE when attached to running instance
✅ **EBS Storage**: 30GB General Purpose SSD
✅ **Data Transfer**: 15GB outbound per month

---

## 🚀 Step-by-Step FREE Tier Deployment

### Prerequisites

1. **New AWS Account** (created within last 12 months)
2. **AWS CLI** installed: `brew install awscli`
3. **SSH Key** for EC2 access
4. **Domain name** (optional, can use AWS domain)

---

## Step 1: Create EC2 Instance (FREE)

### Via AWS Console:

1. Go to **EC2** → **Launch Instance**
2. **Name**: `aetheros-erp-server`
3. **AMI**: Amazon Linux 2023 (FREE tier eligible)
4. **Instance Type**: `t3.micro` (FREE tier eligible) ⚠️
5. **Key Pair**: Create new or use existing
6. **Network Settings**:
   - Allow SSH (port 22) from your IP
   - Allow HTTP (port 80) from anywhere
   - Allow HTTPS (port 443) from anywhere
   - Allow Custom TCP (port 3000) from anywhere
7. **Storage**: 20GB gp3 (FREE tier: 30GB available)
8. **Launch Instance**

### Via AWS CLI:

```bash
# Create security group
aws ec2 create-security-group \
  --group-name aetheros-erp-sg \
  --description "AetherOS ERP Security Group"

# Add rules
aws ec2 authorize-security-group-ingress \
  --group-name aetheros-erp-sg \
  --protocol tcp --port 22 --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-name aetheros-erp-sg \
  --protocol tcp --port 80 --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-name aetheros-erp-sg \
  --protocol tcp --port 443 --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-name aetheros-erp-sg \
  --protocol tcp --port 3000 --cidr 0.0.0.0/0

# Launch t3.micro instance
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.micro \
  --key-name your-key-pair \
  --security-groups aetheros-erp-sg \
  --block-device-mappings '[{"DeviceName":"/dev/xvda","Ebs":{"VolumeSize":20}}]' \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=aetheros-erp-server}]'
```

---

## Step 2: Create RDS Database (FREE)

### Via AWS Console:

1. Go to **RDS** → **Create database**
2. **Engine**: PostgreSQL 15
3. **Templates**: **Free tier** ⚠️ (automatically selects db.t3.micro)
4. **Settings**:
   - DB identifier: `aetheros-erp-db`
   - Master username: `postgres`
   - Master password: [Create strong password]
5. **Instance configuration**: db.t3.micro (auto-selected)
6. **Storage**: 20GB (FREE tier eligible)
7. **Connectivity**:
   - VPC: Same as EC2
   - Public access: **No**
   - VPC security group: Create new → `aetheros-db-sg`
8. **Database name**: `aetheros_erp`
9. **Backup**: 7 days retention (FREE)
10. **Click**: Create database

### Configure Database Security Group:

```bash
# Allow EC2 to connect to RDS
aws ec2 authorize-security-group-ingress \
  --group-name aetheros-db-sg \
  --protocol tcp \
  --port 5432 \
  --source-group aetheros-erp-sg
```

---

## Step 3: Setup EC2 Server

### SSH into EC2:

```bash
# Get EC2 public IP from AWS Console
ssh -i your-key.pem ec2-user@YOUR_EC2_PUBLIC_IP
```

### Install Node.js, PostgreSQL Client, PM2:

```bash
# Update system
sudo yum update -y

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install PostgreSQL client
sudo yum install -y postgresql15

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Git
sudo yum install -y git

# Verify installations
node --version
npm --version
psql --version
pm2 --version
```

---

## Step 4: Deploy Backend to EC2

### Clone Repository (or upload files):

```bash
# Option 1: Clone from Git (if you have repo)
git clone https://github.com/yourusername/aetheros-erp.git
cd aetheros-erp/backend

# Option 2: Upload via SCP from local machine
# (Run this on your Mac, not on EC2)
scp -i your-key.pem -r backend/ ec2-user@YOUR_EC2_IP:/home/ec2-user/
```

### Setup Backend:

```bash
cd ~/backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@aetheros-erp-db.xxxxx.us-east-1.rds.amazonaws.com:5432/aetheros_erp
JWT_SECRET=$(openssl rand -base64 32)
CORS_ORIGIN=*
EOF

# Build TypeScript
npm run build

# Run database migrations
psql -h aetheros-erp-db.xxxxx.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d aetheros_erp \
     -f migrations/001_initial_schema.sql

# Start with PM2
pm2 start dist/server.js --name aetheros-backend
pm2 save
pm2 startup
```

### Test Backend:

```bash
curl http://localhost:3000/health
# Should return: {"status":"ok"}
```

---

## Step 5: Deploy Frontend to S3 (FREE)

### Build Frontend Locally:

```bash
# On your Mac
cd frontend

# Update API URL in .env.production
cat > .env.production << EOF
VITE_API_URL=http://YOUR_EC2_PUBLIC_IP:3000
EOF

# Build
npm run build
```

### Create S3 Bucket:

```bash
# Create bucket (must be globally unique name)
aws s3 mb s3://aetheros-erp-frontend-YOUR_AWS_ACCOUNT_ID

# Enable static website hosting
aws s3 website s3://aetheros-erp-frontend-YOUR_AWS_ACCOUNT_ID \
  --index-document index.html \
  --error-document index.html

# Set public read policy
cat > bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::aetheros-erp-frontend-YOUR_AWS_ACCOUNT_ID/*"
        }
    ]
}
EOF

aws s3api put-bucket-policy \
  --bucket aetheros-erp-frontend-YOUR_AWS_ACCOUNT_ID \
  --policy file://bucket-policy.json

# Upload frontend
aws s3 sync dist/ s3://aetheros-erp-frontend-YOUR_AWS_ACCOUNT_ID --delete
```

---

## Step 6: Setup CloudFront (FREE)

### Via AWS Console:

1. Go to **CloudFront** → **Create Distribution**
2. **Origin domain**: Select your S3 bucket
3. **Origin access**: Public
4. **Viewer protocol policy**: Redirect HTTP to HTTPS
5. **Allowed HTTP methods**: GET, HEAD, OPTIONS
6. **Cache policy**: CachingOptimized
7. **Price class**: Use only North America and Europe (cheapest)
8. **Default root object**: `index.html`
9. **Create distribution**

### Get CloudFront URL:

```bash
# Note the distribution domain name (e.g., d1234567890.cloudfront.net)
# Your frontend will be accessible at: https://d1234567890.cloudfront.net
```

---

## Step 7: Setup NGINX Reverse Proxy on EC2 (Optional)

### Install NGINX:

```bash
sudo yum install -y nginx

# Configure NGINX
sudo tee /etc/nginx/conf.d/aetheros.conf << EOF
server {
    listen 80;
    server_name YOUR_EC2_PUBLIC_IP;

    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Start NGINX
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 📊 FREE TIER Limits & Monitoring

### Stay Within FREE Tier:

✅ **EC2**: 750 hours/month (one t3.micro running 24/7)
✅ **RDS**: 750 hours/month (one db.t3.micro running 24/7)
✅ **S3**: 5GB storage, 20,000 GET, 2,000 PUT
✅ **CloudFront**: 50GB transfer, 2M requests
✅ **Data Transfer**: 15GB outbound

### Monitor Usage:

```bash
# Check AWS Free Tier usage
aws ce get-cost-and-usage \
  --time-period Start=2025-11-01,End=2025-11-30 \
  --granularity MONTHLY \
  --metrics BlendedCost
```

**Set up Billing Alerts**:
1. Go to **Billing** → **Budgets**
2. Create budget: $1/month alert
3. Get email when approaching limits

---

## 🔧 Automated FREE Tier Deployment Script

Create `deploy-free-tier.sh`:

```bash
#!/bin/bash
set -e

echo "🆓 Deploying to AWS FREE TIER..."

# Variables
EC2_IP="YOUR_EC2_PUBLIC_IP"
KEY_FILE="your-key.pem"
S3_BUCKET="aetheros-erp-frontend-$(aws sts get-caller-identity --query Account --output text)"

# Build backend locally
echo "📦 Building backend..."
cd backend
npm run build

# Upload backend to EC2
echo "⬆️  Uploading backend to EC2..."
scp -i $KEY_FILE -r dist/ node_modules/ package.json ec2-user@$EC2_IP:/home/ec2-user/backend/

# Restart backend on EC2
echo "🔄 Restarting backend..."
ssh -i $KEY_FILE ec2-user@$EC2_IP "cd backend && pm2 restart aetheros-backend || pm2 start dist/server.js --name aetheros-backend"

# Build frontend
echo "🎨 Building frontend..."
cd ../frontend
npm run build

# Upload to S3
echo "☁️  Uploading frontend to S3..."
aws s3 sync dist/ s3://$S3_BUCKET --delete

# Invalidate CloudFront cache
echo "🔄 Invalidating CloudFront..."
DIST_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[?DomainName=='$S3_BUCKET.s3.amazonaws.com']].Id" --output text)
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"

echo "✅ Deployment complete!"
echo "🌐 Frontend: https://$DIST_ID.cloudfront.net"
echo "🔌 Backend: http://$EC2_IP:3000"
```

---

## ⚠️ Important FREE TIER Rules

1. **Valid for 12 months** from AWS account creation date
2. **One t3.micro instance only** (multiple instances = charges)
3. **20GB RDS storage max** (more = charges)
4. **Stop instances when not testing** to save hours
5. **Set billing alerts** to avoid surprise charges
6. **After 12 months**: Upgrade or migrate to paid tier

---

## 💡 Cost After FREE TIER Expires

After 12 months, your costs will be:
- EC2 t3.micro: ~$8-10/month
- RDS db.t3.micro: ~$15-20/month
- S3/CloudFront: ~$5/month
- **Total**: ~$28-35/month (still affordable!)

---

## 🎯 Ready to Deploy?

**Checklist**:
- [ ] AWS account less than 12 months old
- [ ] AWS CLI configured (`aws configure`)
- [ ] SSH key pair created
- [ ] Noted down EC2 IP and RDS endpoint
- [ ] Updated .env files with correct values

**Deploy now**: Follow steps 1-6 above!

*Last updated: November 8, 2025*
