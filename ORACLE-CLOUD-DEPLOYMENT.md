# Oracle Cloud Free Tier Deployment Guide

## Overview

This guide deploys WorldClass ERP on Oracle Cloud's **Always Free** tier - $0/month forever.

## What You Get (FREE)

| Resource | Allocation | Your Usage |
|----------|------------|------------|
| ARM VM | 4 OCPUs, 24GB RAM | Backend + Redis + Frontend |
| Autonomous DB | 20GB PostgreSQL-compatible | Your ERP database |
| Block Storage | 200GB | OS + App data |
| Bandwidth | 10TB/month | More than enough |

## Prerequisites

1. Oracle Cloud account: https://www.oracle.com/cloud/free/
2. Credit card for verification (won't be charged)

---

## Step 1: Create Oracle Cloud Account

1. Go to https://www.oracle.com/cloud/free/
2. Click "Start for free"
3. Fill in your details
4. Verify with credit card (no charge)
5. Select home region (closest to your users)
6. Wait for account activation (usually instant)

---

## Step 2: Create ARM VM (Ampere A1)

### Via Console:

1. **Compute → Instances → Create Instance**
2. **Name:** `worldclass-erp`
3. **Image:** Ubuntu 22.04 (or 24.04)
4. **Shape:** Click "Change Shape"
   - Select "Ampere" (ARM)
   - Choose: **VM.Standard.A1.Flex**
   - OCPUs: **4** (max free)
   - Memory: **24 GB** (max free)
5. **Networking:** Create new VCN or use default
6. **Add SSH Key:** Upload your public key or generate new
7. **Boot Volume:** 100GB (free up to 200GB)
8. Click **Create**

### Save Your Public IP!

Once created, note the **Public IP Address** - you'll need it.

---

## Step 3: Create Autonomous Database

1. **Oracle Database → Autonomous Database → Create**
2. **Display name:** `worldclass-db`
3. **Database name:** `worldclassdb`
4. **Workload type:** Transaction Processing
5. **Deployment type:** Serverless
6. **⭐ IMPORTANT:** Check **"Always Free"** toggle
7. **Database version:** 19c or 21c
8. **OCPU count:** 1 (free)
9. **Storage:** 20GB (free)
10. **Admin password:** Create strong password (save it!)
11. Click **Create**

### Download Wallet:

1. Once DB is available, click on it
2. Click **"Database Connection"**
3. Click **"Download Wallet"**
4. Create wallet password
5. Save the `Wallet_worldclassdb.zip` file

---

## Step 4: Configure Security (Firewall)

### Open Required Ports:

1. **Networking → Virtual Cloud Networks → Your VCN**
2. **Security Lists → Default Security List**
3. **Add Ingress Rules:**

| Port | Protocol | Source | Description |
|------|----------|--------|-------------|
| 22 | TCP | 0.0.0.0/0 | SSH |
| 80 | TCP | 0.0.0.0/0 | HTTP |
| 443 | TCP | 0.0.0.0/0 | HTTPS |
| 3000 | TCP | 0.0.0.0/0 | Backend API |
| 5173 | TCP | 0.0.0.0/0 | Frontend Dev |

---

## Step 5: Connect to VM & Deploy

### SSH into your VM:

```bash
ssh -i your-private-key ubuntu@YOUR_PUBLIC_IP
```

### Run the deployment script:

```bash
# Download and run setup script
curl -o setup-oracle.sh https://raw.githubusercontent.com/sbuncele-del/WorldClass-ERP/main/deploy-oracle-cloud.sh
chmod +x setup-oracle.sh
./setup-oracle.sh
```

Or manually:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Redis
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Install Nginx (reverse proxy)
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2

# Clone your repo
git clone https://github.com/sbuncele-del/WorldClass-ERP.git
cd WorldClass-ERP

# Install dependencies
cd backend && npm install
cd ../frontend && npm install
cd ..
```

---

## Step 6: Configure Environment

Create `/home/ubuntu/WorldClass-ERP/backend/.env`:

```bash
# Database - Oracle Autonomous DB
# For Oracle, you may need to use their connection string format
# Or use a PostgreSQL-compatible connection

DATABASE_URL=postgresql://ADMIN:YOUR_PASSWORD@YOUR_DB_HOST:1522/worldclassdb?sslmode=require

# Alternative: Use the Oracle wallet connection
# See oracle-db-connect.md for wallet setup

# Redis (local)
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-refresh-secret-change-this

# Server
PORT=3000
NODE_ENV=production

# Frontend URL
FRONTEND_URL=http://YOUR_PUBLIC_IP
```

---

## Step 7: Build & Start

```bash
cd /home/ubuntu/WorldClass-ERP

# Build backend
cd backend
npm run build

# Build frontend
cd ../frontend
npm run build

# Start with PM2
cd ../backend
pm2 start dist/index.js --name "worldclass-api"

# Serve frontend with Nginx (see nginx config below)
```

---

## Step 8: Configure Nginx

Create `/etc/nginx/sites-available/worldclass`:

```nginx
server {
    listen 80;
    server_name YOUR_PUBLIC_IP;

    # Frontend
    location / {
        root /home/ubuntu/WorldClass-ERP/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/worldclass /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Step 9: Access Your ERP

Open in browser:
```
http://YOUR_PUBLIC_IP
```

API endpoint:
```
http://YOUR_PUBLIC_IP/api
```

---

## Oracle DB Note: PostgreSQL Compatibility

Oracle Autonomous Database supports **PostgreSQL wire protocol** via:

1. **Oracle Database API for MongoDB** - For document-style access
2. **ORDS (Oracle REST Data Services)** - REST API to your data

For full PostgreSQL compatibility, you have two options:

### Option A: Use Oracle's PostgreSQL on OCI (Not free)
- Managed PostgreSQL service (paid)

### Option B: Self-host PostgreSQL on your VM (Recommended for testing)
```bash
# Install PostgreSQL on your ARM VM
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Create database
sudo -u postgres createdb worldclass_erp
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'your-password';"

# Update .env
DATABASE_URL=postgresql://postgres:your-password@localhost:5432/worldclass_erp
```

This is actually **better for testing** because:
- Full PostgreSQL compatibility
- Simpler setup
- You have 24GB RAM - plenty for DB + App

---

## Quick Reference

| Service | URL |
|---------|-----|
| Frontend | http://YOUR_IP |
| Backend API | http://YOUR_IP/api |
| Health Check | http://YOUR_IP/api/health |

| Command | Description |
|---------|-------------|
| `pm2 status` | Check app status |
| `pm2 logs` | View logs |
| `pm2 restart all` | Restart app |
| `sudo systemctl status redis` | Check Redis |
| `sudo systemctl status nginx` | Check Nginx |

---

## Cost Summary

| Resource | Cost |
|----------|------|
| ARM VM (4 OCPU, 24GB) | **$0** |
| PostgreSQL (self-hosted) | **$0** |
| Redis (self-hosted) | **$0** |
| Block Storage (100GB) | **$0** |
| Bandwidth (10TB) | **$0** |
| **Total** | **$0/month** |

---

## Troubleshooting

### Can't connect to VM?
- Check security list ingress rules
- Verify SSH key is correct
- Check VM is running

### Database connection issues?
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check connection string in .env
- Test locally: `psql -U postgres -d worldclass_erp`

### App not starting?
- Check logs: `pm2 logs`
- Verify .env file exists and is correct
- Ensure build completed: `ls backend/dist`

### Frontend not loading?
- Check Nginx: `sudo nginx -t`
- Verify frontend build: `ls frontend/dist`
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
