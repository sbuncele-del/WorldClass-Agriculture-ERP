# Quick Start: Deploy AetherOS ERP to AWS (FREE Tier)
## Simple 10-Step Guide - No AWS CLI Needed!

**Status**: ✅ EC2 Instance Launched - Continue Below

---

## ✅ Step 1: Get Your EC2 Details (DO THIS NOW)

1. Go to **AWS Console** → **EC2** → **Instances**
2. Click on your instance: `aetheros-erp-server`
3. **Copy and save these**:
   - ✏️ **Public IPv4 address**: `___.___.___.___` (write it down!)
   - ✏️ **Instance ID**: `i-xxxxxxxxx`
   - ✏️ **Key pair name**: `your-key-name.pem`

4. **Download your SSH key** (if you haven't):
   - If you created a new key, it should be in your Downloads folder
   - Move it: `mv ~/Downloads/your-key.pem ~/.ssh/`
   - Secure it: `chmod 400 ~/.ssh/your-key.pem`

**Write your Public IP here**: `51.21.219.35`

---

## 📝 Step 2: Create RDS Database (5 minutes)

1. Go to **AWS Console** → **RDS** → **Create database**

2. **Choose configuration**:
   - Engine: **PostgreSQL 15**
   - Templates: **Free tier** ⚠️ (Important!)
   - DB instance identifier: `aetheros-erp-db`
   - Master username: `postgres`
   - Master password: Create a strong password (save it!)

3. **Storage**:
   - Leave at **20 GB** (FREE tier limit)

4. **Connectivity**:
   - VPC: **Same as your EC2** (usually default)
   - Public access: **No** (more secure)
   - VPC security group: Create new → `aetheros-db-sg`

5. **Additional configuration**:
   - Initial database name: `aetheros_erp` ⚠️ (Important!)
   - Backup retention: **7 days**

6. **Click**: Create database (takes ~5 minutes)

7. **After creation, copy these**:
   - ✏️ **Endpoint**: `aetheros-erp-db.xxxxx.us-east-1.rds.amazonaws.com`
   - ✏️ **Port**: `5432`
   - ✏️ **Password**: (you created above)

**Write your RDS Endpoint here**: `aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com`

---

## 🔐 Step 3: Configure Database Security Group (2 minutes)

1. Go to **EC2** → **Security Groups**
2. Find: `aetheros-db-sg` (your RDS security group)
3. Click **Edit inbound rules** → **Add rule**:
   - Type: **PostgreSQL**
   - Port: **5432**
   - Source: **Custom** → Search for your EC2 security group (aetheros-erp-sg)
4. **Save rules**

Now EC2 can talk to RDS! ✅

---

## 💻 Step 4: SSH into EC2 and Setup Server (3 minutes)

Open **Terminal** on your Mac:

```bash
# SSH into your EC2 (replace IP and key name)
ssh -i ~/.ssh/your-key.pem ec2-user@YOUR_EC2_PUBLIC_IP

# You should see: "Amazon Linux 2023"
```

**Inside EC2**, run these commands:

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

# Verify installations
node --version    # Should show v18.x.x
npm --version     # Should show 9.x.x or higher
psql --version    # Should show 15.x

# Create directory for backend
mkdir -p ~/backend
```

**Keep this Terminal window open!** ✅

---

## 📦 Step 5: Upload Backend Code to EC2 (2 minutes)

**Open a NEW Terminal window** on your Mac (keep the EC2 SSH session open):

```bash
# Navigate to your project
cd "/Users/sibusisomavuso/Desktop/Worldclass ERP Software "

# Build backend first
cd backend
npm install
npm run build

# Upload to EC2 (replace IP and key name)
scp -i ~/.ssh/your-key.pem -r dist/ package.json package-lock.json ec2-user@YOUR_EC2_PUBLIC_IP:~/backend/

# Confirm upload
ssh -i ~/.ssh/your-key.pem ec2-user@YOUR_EC2_PUBLIC_IP "ls -la ~/backend"
```

You should see `dist/` and `package.json` listed! ✅

---

## ⚙️ Step 6: Configure Backend Environment (2 minutes)

**Back in your EC2 SSH Terminal**:

```bash
cd ~/backend

# Install production dependencies
npm ci --only=production

# Create .env file (replace with YOUR values)
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_RDS_ENDPOINT:5432/aetheros_erp
JWT_SECRET=$(openssl rand -base64 32)
CORS_ORIGIN=*
LOG_LEVEL=info
EOF

# IMPORTANT: Edit the file and replace YOUR_PASSWORD and YOUR_RDS_ENDPOINT
nano .env
# Press Ctrl+X, then Y, then Enter to save

# Verify .env file
cat .env
```

Make sure your `DATABASE_URL` looks like:
```
postgresql://postgres:MyPass123@aetheros-erp-db.abc123.us-east-1.rds.amazonaws.com:5432/aetheros_erp
```

---

## 🗄️ Step 7: Run Database Migrations (3 minutes)

**Still in EC2 SSH Terminal**:

```bash
# Test database connection
psql -h YOUR_RDS_ENDPOINT -U postgres -d aetheros_erp -c "SELECT version();"
# Enter password when prompted

# If connection works, exit psql
\q

# Now we need to upload migration files from your Mac
```

**In your Mac Terminal** (not EC2):

```bash
cd "/Users/sibusisomavuso/Desktop/Worldclass ERP Software /backend"

# Upload migrations
scp -i ~/.ssh/your-key.pem -r migrations/ ec2-user@YOUR_EC2_PUBLIC_IP:~/backend/
```

**Back in EC2 SSH Terminal**:

```bash
cd ~/backend

# Run migrations (adjust path to your actual migration file)
psql -h YOUR_RDS_ENDPOINT -U postgres -d aetheros_erp -f migrations/001_initial_schema.sql
# Or if you have multiple files:
for file in migrations/*.sql; do
  echo "Running $file..."
  psql -h YOUR_RDS_ENDPOINT -U postgres -d aetheros_erp -f "$file"
done

# Verify tables were created
psql -h YOUR_RDS_ENDPOINT -U postgres -d aetheros_erp -c "\dt"
```

You should see your database tables! ✅

---

## 🚀 Step 8: Start Backend with PM2 (2 minutes)

**In EC2 SSH Terminal**:

```bash
cd ~/backend

# Start backend with PM2
pm2 start dist/server.js --name aetheros-backend

# Save PM2 process list
pm2 save

# Setup PM2 to restart on reboot
pm2 startup
# Copy and run the command it outputs (starts with sudo)

# Check status
pm2 status
pm2 logs aetheros-backend --lines 20

# Test backend API
curl http://localhost:3000/health
# Should return: {"status":"ok"}
```

**Backend is now running!** ✅

Test from your Mac:
```bash
curl http://YOUR_EC2_PUBLIC_IP:3000/health
```

---

## 🎨 Step 9: Build and Deploy Frontend to S3 (5 minutes)

**On your Mac Terminal**:

```bash
cd "/Users/sibusisomavuso/Desktop/Worldclass ERP Software /frontend"

# Create production environment file
cat > .env.production << EOF
VITE_API_URL=http://YOUR_EC2_PUBLIC_IP:3000
VITE_APP_NAME=AetherOS ERP
EOF

# Build frontend
npm run build

# You should see a dist/ folder created
ls -la dist/
```

Now go to **AWS Console** → **S3**:

1. **Create bucket**:
   - Bucket name: `aetheros-erp-YOUR_AWS_ACCOUNT_ID` (must be globally unique)
   - Region: Same as your EC2 (us-east-1)
   - Uncheck "Block all public access" ⚠️
   - Check "I acknowledge..."
   - Click **Create bucket**

2. **Upload files**:
   - Click your bucket name
   - Click **Upload** → **Add folder** → Select `dist` folder
   - Click **Upload**
   - Wait for completion

3. **Enable static website hosting**:
   - Go to **Properties** tab
   - Scroll to **Static website hosting**
   - Click **Edit**
   - Enable: **Enable**
   - Index document: `index.html`
   - Error document: `index.html`
   - Click **Save changes**

4. **Set bucket policy**:
   - Go to **Permissions** tab
   - Scroll to **Bucket policy**
   - Click **Edit**
   - Paste this (replace YOUR-BUCKET-NAME):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
        }
    ]
}
```

   - Click **Save changes**

5. **Get website URL**:
   - Go back to **Properties** tab
   - Scroll to **Static website hosting**
   - Copy the **Bucket website endpoint**
   - Example: `http://aetheros-erp-123456.s3-website-us-east-1.amazonaws.com`

**Frontend is now live!** ✅

---

## 🌐 Step 10: Test Your Application! (2 minutes)

1. **Open the S3 website URL** in your browser
2. You should see your AetherOS ERP login page
3. Try logging in - it should connect to your backend API
4. Navigate through the Financial Management module
5. Check the enhanced pages with purple gradients!

**Your ERP is LIVE on AWS!** 🎉

---

## 🔧 Optional Step 11: Setup CloudFront (for HTTPS)

If you want HTTPS (https://) instead of HTTP:

1. Go to **CloudFront** → **Create Distribution**
2. **Origin domain**: Select your S3 bucket
3. **Viewer protocol policy**: Redirect HTTP to HTTPS
4. **Cache policy**: CachingOptimized
5. **Default root object**: `index.html`
6. **Create distribution** (takes 5-10 minutes)
7. Get CloudFront URL: `https://d1234abcd.cloudfront.net`

Update your frontend `.env.production`:
```bash
VITE_API_URL=http://YOUR_EC2_PUBLIC_IP:3000  # Keep same for now
```

Rebuild and re-upload to S3.

---

## 📊 Summary - What You've Achieved

✅ **EC2 t3.micro** - Backend API running 24/7 (FREE)
✅ **RDS db.t3.micro** - PostgreSQL database (FREE)
✅ **S3 Bucket** - Frontend hosting (FREE)
✅ **Total Cost**: **$0/month** for 12 months!

**Your URLs**:
- Backend API: `http://YOUR_EC2_PUBLIC_IP:3000`
- Frontend: `http://your-bucket.s3-website-region.amazonaws.com`
- CloudFront (optional): `https://your-cloudfront-id.cloudfront.net`

---

## 🆘 Troubleshooting

**Can't SSH into EC2?**
- Check security group allows port 22 from your IP
- Verify key file permissions: `chmod 400 ~/.ssh/your-key.pem`

**Backend won't start?**
- Check logs: `pm2 logs aetheros-backend`
- Verify .env file: `cat ~/backend/.env`
- Test database connection: `psql -h RDS_ENDPOINT -U postgres -d aetheros_erp`

**Frontend can't connect to backend?**
- Verify EC2 security group allows port 3000
- Test API: `curl http://YOUR_EC2_IP:3000/health`
- Check browser console for CORS errors

**Database connection fails?**
- Verify RDS security group allows PostgreSQL (5432) from EC2
- Check RDS endpoint is correct
- Verify password is correct

---

## 🔄 How to Update Your Code

**Update Backend**:
```bash
# On your Mac
cd backend
npm run build
scp -i ~/.ssh/your-key.pem -r dist/ ec2-user@YOUR_EC2_IP:~/backend/

# On EC2
ssh -i ~/.ssh/your-key.pem ec2-user@YOUR_EC2_IP
pm2 restart aetheros-backend
```

**Update Frontend**:
```bash
# On your Mac
cd frontend
npm run build
# Upload dist/ to S3 via AWS Console or CLI
```

---

**Need help? Check the full guide**: `docs/AWS-FREE-TIER-DEPLOYMENT.md`

**Ready? Start with Step 2: Create RDS Database!** 🚀

*Last updated: November 8, 2025*
