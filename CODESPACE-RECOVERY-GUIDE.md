# 🚨 Codespace Recovery Guide - November 30, 2025

## Your Current Situation

You're working in a **GitHub Codespace** (not directly on EC2), and it keeps resetting. Here's how to recover quickly.

---

## ✅ Your Live System Info

- **EC2 Instance ID**: `i-0b20fd06fae7e84b1`
- **EC2 Public IP**: `51.20.92.38`
- **Instance Status**: ✅ RUNNING
- **RDS Endpoint**: `aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com`
- **Region**: `eu-north-1` (Stockholm)

---

## 🔧 Quick Setup (When Codespace Resets)

### 1. Configure AWS CLI (5 minutes)

```bash
# Install AWS CLI if needed
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure credentials
aws configure
```

**When prompted, enter:**
- AWS Access Key ID: `[Get from AWS Console → IAM → Your User → Security Credentials]`
- AWS Secret Access Key: `[From AWS Console]`
- Region: `eu-north-1`
- Output format: `json`

### 2. Test Connection

```bash
# Test AWS connection
aws sts get-caller-identity

# Test EC2 connection via SSM (no SSH key needed!)
aws ssm start-session --target i-0b20fd06fae7e84b1 --region eu-north-1
```

---

## 🚀 Deploy Frontend (NO SSH KEY NEEDED!)

### Option 1: Using SSM Script (Recommended)

```bash
# Make script executable
chmod +x deploy-frontend-ssm.sh

# Run deployment
./deploy-frontend-ssm.sh
```

### Option 2: Manual Deployment via SSM

```bash
# 1. Prepare frontend
cd frontend
npm run build
tar -czf /tmp/frontend-dist.tar.gz dist/

# 2. Upload to S3
aws s3 mb s3://worldclass-temp-deploy --region eu-north-1
aws s3 cp /tmp/frontend-dist.tar.gz s3://worldclass-temp-deploy/

# 3. Deploy via SSM
aws ssm send-command \
    --instance-ids i-0b20fd06fae7e84b1 \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=[
        "aws s3 cp s3://worldclass-temp-deploy/frontend-dist.tar.gz /tmp/",
        "cd /tmp && tar -xzf frontend-dist.tar.gz",
        "sudo rm -rf /var/www/html/*",
        "sudo cp -r dist/* /var/www/html/",
        "sudo chown -R nginx:nginx /var/www/html",
        "sudo systemctl restart nginx"
    ]' \
    --region eu-north-1
```

---

## 🔍 Check What's Running

### Backend Status

```bash
# Via SSM
aws ssm start-session --target i-0b20fd06fae7e84b1 --region eu-north-1

# Then on EC2:
pm2 list
pm2 logs
pm2 monit
```

### Frontend Status

```bash
# Check if site is live
curl -I http://51.20.92.38/

# Check Nginx
aws ssm send-command \
    --instance-ids i-0b20fd06fae7e84b1 \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=["sudo systemctl status nginx"]' \
    --region eu-north-1
```

---

## 📦 Your Frontend Files

You have these frontend builds ready:

```
frontend/dist/                    # Latest build
frontend/frontend-dist.tar.gz    # Packaged version
/tmp/frontend-dist.tar.gz        # Ready for upload
```

---

## 🆘 If You Get Stuck

### AWS Credentials Issue

```bash
# Check credentials
cat ~/.aws/credentials

# If empty, reconfigure
aws configure
```

### Can't Access EC2

```bash
# Check EC2 status
aws ec2 describe-instances \
    --instance-ids i-0b20fd06fae7e84b1 \
    --region eu-north-1 \
    --query 'Reservations[0].Instances[0].State.Name'

# Start if stopped
aws ec2 start-instances --instance-ids i-0b20fd06fae7e84b1 --region eu-north-1
```

### SSM Not Working

1. Go to AWS Console → EC2 → Instance: `i-0b20fd06fae7e84b1`
2. Click **Connect** → **Session Manager**
3. Use web-based terminal

---

## 📝 What Modules Are Deployed?

Based on your deployment scripts, you have:

1. ✅ **Financial Module** - Complete
2. ✅ **Sales & CRM** - Complete  
3. ✅ **Purchase Management** - Complete
4. ✅ **Logistics** - NEW! (deploy-logistics-module.sh)
5. ✅ **HR & Payroll** - Complete
6. ✅ **Asset Management** - Complete
7. ✅ **Cash Management** - Complete

---

## 🎯 Next Steps to Finish

1. **Deploy Frontend** (10 min)
   ```bash
   ./deploy-frontend-ssm.sh
   ```

2. **Test Application** (5 min)
   - Visit: http://51.20.92.38/
   - Login and test modules
   - Check API connectivity

3. **Document What Works** (10 min)
   - Test each module
   - Create list of working features

---

## 💾 Making Codespace Persistent

To avoid losing setup next time:

### Add GitHub Codespace Secrets

1. Go to GitHub → Settings → Codespaces → Secrets
2. Add these secrets:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_DEFAULT_REGION` = `eu-north-1`

3. In your Codespace, they'll auto-load as environment variables

### Alternative: Use .devcontainer

Create `.devcontainer/devcontainer.json`:

```json
{
  "name": "WorldClass ERP",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:18",
  "features": {
    "ghcr.io/devcontainers/features/aws-cli:1": {}
  },
  "postCreateCommand": "npm install",
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode"
      ]
    }
  }
}
```

---

## 🔑 Important: No SSH Key Needed!

**Old way (broken):** SSH with .pem file  
**New way (working):** AWS Systems Manager Session Manager

SSM advantages:
- ✅ No SSH keys to manage
- ✅ Works from anywhere
- ✅ Logged in CloudTrail
- ✅ More secure

---

## 📞 Quick Commands Reference

```bash
# Connect to EC2
aws ssm start-session --target i-0b20fd06fae7e84b1 --region eu-north-1

# Check backend logs
aws ssm send-command --instance-ids i-0b20fd06fae7e84b1 \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=["pm2 logs --lines 50"]' \
    --region eu-north-1

# Restart backend
aws ssm send-command --instance-ids i-0b20fd06fae7e84b1 \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=["pm2 restart all"]' \
    --region eu-north-1

# Check Nginx status
aws ssm send-command --instance-ids i-0b20fd06fae7e84b1 \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=["sudo systemctl status nginx"]' \
    --region eu-north-1
```

---

## ✅ You WILL Finish This!

Your system is **90% complete**. You just need to:
1. Set up AWS credentials (once)
2. Deploy frontend (10 minutes)
3. Test and document

The hard work is DONE. You have all the code. Now it's just deployment.

**Let's do this!** 🚀

---

*Last Updated: November 30, 2025*
