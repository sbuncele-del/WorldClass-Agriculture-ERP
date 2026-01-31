cd /home/ssm-user/WorldClass-ERP/backend
cat backend.log | tail -50# 🔑 AWS Credentials Setup Guide

## Step 1: Get Your AWS Credentials (5 minutes)

### Option A: Create New Access Keys (Recommended)

1. **Open AWS Console** in your browser
2. **Go to IAM** (Search for "IAM" in the top search bar)
3. **Click "Users"** in the left sidebar
4. **Find your username** (the one you use to login - likely something like "sbuncele" or "admin")
5. **Click on your username**
6. **Click "Security credentials" tab**
7. **Scroll down to "Access keys" section**
8. **Click "Create access key"**
9. **Select use case:** Choose "Command Line Interface (CLI)"
10. **Check the confirmation box** and click "Next"
11. **Add description:** "Codespace CLI Access" (optional)
12. **Click "Create access key"**
13. **⚠️ IMPORTANT:** You'll see:
    - **Access key ID** (starts with AKIA...)
    - **Secret access key** (long random string)
    
    **COPY BOTH NOW!** You won't be able to see the secret key again!

### Option B: Use Existing Keys

If you already have access keys:
1. Go to IAM → Users → Your username → Security credentials
2. Find "Access keys" section
3. If you see an active key, you need the secret key (which you should have saved)
4. If you don't have the secret key, you'll need to create a new one (Option A)

---

## Step 2: Install AWS CLI in Codespace

Copy and paste these commands **one at a time** in your Codespace terminal:

```bash
# Download AWS CLI installer
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"

# Unzip the installer
unzip awscliv2.zip

# Install AWS CLI
sudo ./aws/install

# Verify installation
aws --version
```

You should see something like: `aws-cli/2.x.x Python/3.x.x Linux/x.x.x`

---

## Step 3: Configure AWS Credentials

Run this command:

```bash
aws configure
```

It will ask you 4 questions. Enter these values:

### Question 1: AWS Access Key ID
```
AWS Access Key ID [None]: AKIA... (paste the Access Key ID from Step 1)
```

### Question 2: AWS Secret Access Key
```
AWS Secret Access Key [None]: (paste the Secret Access Key from Step 1)
```

### Question 3: Default region name
```
Default region name [None]: eu-north-1
```
**Important:** Your EC2 instance is in Stockholm (eu-north-1), so use this region!

### Question 4: Default output format
```
Default output format [None]: json
```

---

## Step 4: Test Your Setup

Run these commands to verify everything works:

```bash
# Test 1: Check your identity
aws sts get-caller-identity

# You should see:
# {
#     "UserId": "...",
#     "Account": "481533690489",
#     "Arn": "arn:aws:iam::481533690489:user/YOUR_USERNAME"
# }
```

```bash
# Test 2: Check your EC2 instance
aws ec2 describe-instances \
    --instance-ids i-0b20fd06fae7e84b1 \
    --region eu-north-1 \
    --query 'Reservations[0].Instances[0].State.Name'

# You should see: "running"
```

```bash
# Test 3: Connect to your EC2 instance
aws ssm start-session --target i-0b20fd06fae7e84b1 --region eu-north-1

# This should open a terminal on your EC2 instance
# Type 'exit' to close the connection when done
```

---

## Step 5: Make Credentials Persistent (Optional but Recommended)

Codespaces can reset, so save your credentials as GitHub Secrets:

1. **Go to GitHub** → Your profile picture → **Settings**
2. Click **Codespaces** in left sidebar
3. Click **Codespaces secrets**
4. Click **New secret**
5. Add these 3 secrets:

   **Secret 1:**
   - Name: `AWS_ACCESS_KEY_ID`
   - Value: Your access key ID from Step 1
   - Select: "sbuncele-del/WorldClass-ERP" repository

   **Secret 2:**
   - Name: `AWS_SECRET_ACCESS_KEY`
   - Value: Your secret access key from Step 1
   - Select: "sbuncele-del/WorldClass-ERP" repository

   **Secret 3:**
   - Name: `AWS_DEFAULT_REGION`
   - Value: `eu-north-1`
   - Select: "sbuncele-del/WorldClass-ERP" repository

Next time your Codespace restarts, these will be available automatically!

---

## Troubleshooting

### ❌ "Unable to locate credentials"

**Problem:** AWS CLI can't find your credentials

**Solution:**
```bash
# Check if credentials file exists
cat ~/.aws/credentials

# If empty or missing, run:
aws configure
```

### ❌ "Access Denied"

**Problem:** Your IAM user doesn't have necessary permissions

**Solution:**
1. Go to AWS Console → IAM → Users → Your username
2. Click "Add permissions" → "Attach policies directly"
3. Add these policies:
   - `AmazonEC2FullAccess`
   - `AmazonSSMManagedInstanceCore`
   - `AmazonS3FullAccess`
   - `AmazonRDSFullAccess`

### ❌ "Region not specified"

**Problem:** AWS doesn't know which region to use

**Solution:**
```bash
# Set default region
aws configure set region eu-north-1

# Or add --region to every command:
aws ec2 describe-instances --instance-ids i-0b20fd06fae7e84b1 --region eu-north-1
```

### ❌ "Target not connected"

**Problem:** SSM can't connect to EC2 instance

**Solution:**
1. Go to AWS Console → EC2 → Instance: i-0b20fd06fae7e84b1
2. Click **Connect** → **Session Manager**
3. Use the web-based terminal instead

---

## Quick Reference: Your AWS Info

```
Account ID:      481533690489
EC2 Instance ID: i-0b20fd06fae7e84b1
EC2 Public IP:   51.20.92.38
Region:          eu-north-1 (Stockholm)
RDS Endpoint:    aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com
```

---

## What To Do After Setup

Once AWS CLI is configured, you can deploy your frontend:

```bash
# Make the script executable
chmod +x deploy-frontend-ssm.sh

# Run deployment
./deploy-frontend-ssm.sh
```

---

## Security Notes

⚠️ **Never commit AWS credentials to Git!**

Your `.gitignore` should include:
```
.aws/
*.pem
.env
.env.local
.env.production
```

⚠️ **Rotate keys regularly**
- Go to IAM → Users → Your username → Security credentials
- Delete old keys after creating new ones

---

*Last Updated: November 30, 2025*
