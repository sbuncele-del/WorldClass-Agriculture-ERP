# WorldClass ERP - Production Deployment Guide

## 🎯 Current Status (January 7, 2026)

- **Backend**: Running on EC2 at `51.20.67.228:3000` (HTTP)
- **Database**: AWS RDS PostgreSQL (connected)
- **API Endpoints**: 77/77 passing
- **Frontend**: Built and deployable
- **Security**: Currently HTTP only ⚠️

---

## 📋 Beta Deployment Checklist

### Phase 1: Docker Setup ✅ READY

Files created:
- `docker/backend/Dockerfile` - Production-ready backend image
- `docker-compose.production.yml` - Full stack with nginx, redis
- `docker/nginx/nginx.conf` - Reverse proxy with SSL
- `.env.production.example` - Environment template

### Phase 2: HTTPS/SSL Setup ⏳ PENDING

**Step 1: Get a Domain**
```bash
# Point your domain's DNS to EC2 IP: 51.20.67.228
# A record: yourdomain.com -> 51.20.67.228
# A record: www.yourdomain.com -> 51.20.67.228
```

**Step 2: Setup SSL Certificate**
```bash
# SSH to EC2
ssh -i your-key.pem ec2-user@51.20.67.228

# Run the SSL setup script
chmod +x scripts/setup-ssl.sh
./scripts/setup-ssl.sh
```

**Step 3: Update Configuration**
```bash
# Update .env.production
CORS_ORIGIN=https://yourdomain.com
```

### Phase 3: Docker Deployment

**On EC2 Instance:**
```bash
# Install Docker
sudo yum update -y
sudo yum install -y docker
sudo service docker start
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone repo and deploy
git clone https://github.com/sbuncele-del/WorldClass-ERP.git
cd WorldClass-ERP

# Copy environment file
cp .env.production.example .env.production
# Edit with your actual values
nano .env.production

# Start services
docker-compose -f docker-compose.production.yml up -d --build
```

---

## 🔒 Security Checklist

| Item | Status | Priority |
|------|--------|----------|
| HTTPS/SSL | ⏳ | HIGH |
| Environment variables secured | ✅ | HIGH |
| Non-root Docker user | ✅ | HIGH |
| Rate limiting | ✅ | MEDIUM |
| CORS configured | ⏳ | MEDIUM |
| Security headers | ✅ | MEDIUM |
| Database credentials not in code | ⏳ | HIGH |
| JWT secret rotated | ⏳ | HIGH |

---

## 🧪 Testing with Postman

Import the collection from:
```
/postman/WorldClass-ERP-API.postman_collection.json
```

**Steps:**
1. Open Postman/Insomnia
2. Import collection
3. Set environment variable `baseUrl` to your API URL
4. Run "Login" request first (saves token automatically)
5. Test other endpoints

---

## 📊 Monitoring & Observability

### PM2 Process Manager (Current)
```bash
pm2 status
pm2 logs erp-backend
pm2 monit
```

### Recommended Additions
- **Sentry** - Error tracking (DSN configured in .env)
- **CloudWatch** - AWS native monitoring
- **Grafana + Prometheus** - Metrics dashboard

---

## 🔄 Deployment Commands

### Current (Manual via PM2)
```bash
# Build locally
cd backend && npm run build
tar -czvf backend.tar.gz dist/ package.json

# Deploy to EC2
aws s3 cp backend.tar.gz s3://aetheros-erp-deployments/
aws ssm send-command --instance-ids "i-0b20fd06fae7e84b1" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["cd /home/ec2-user/erp-production && aws s3 cp s3://aetheros-erp-deployments/backend.tar.gz . && tar -xzf backend.tar.gz && pm2 restart erp-backend"]' \
  --region eu-north-1
```

### Docker (Recommended)
```bash
# Build and push image
docker build -t worldclass-erp-backend:latest -f docker/backend/Dockerfile .
docker tag worldclass-erp-backend:latest your-registry/worldclass-erp-backend:latest
docker push your-registry/worldclass-erp-backend:latest

# On server
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d
```

---

## 📁 Directory Structure

```
WorldClass-ERP/
├── docker/
│   ├── backend/
│   │   └── Dockerfile          # Backend container
│   └── nginx/
│       ├── nginx.conf          # Reverse proxy config
│       ├── ssl/                # SSL certificates (auto-generated)
│       └── certbot/            # Let's Encrypt challenge
├── docker-compose.production.yml
├── .env.production.example
├── postman/
│   └── WorldClass-ERP-API.postman_collection.json
└── scripts/
    └── setup-ssl.sh
```

---

## ⚡ Quick Start (Beta Launch)

```bash
# 1. Get a domain and point DNS to 51.20.67.228

# 2. SSH to EC2
ssh -i key.pem ec2-user@51.20.67.228

# 3. Clone and setup
git clone https://github.com/sbuncele-del/WorldClass-ERP.git
cd WorldClass-ERP
cp .env.production.example .env.production

# 4. Edit environment
nano .env.production
# Update: DB_PASSWORD, JWT_SECRET, CORS_ORIGIN, domain name

# 5. Get SSL certificate
./scripts/setup-ssl.sh

# 6. Start with Docker
docker-compose -f docker-compose.production.yml up -d

# 7. Verify
curl https://yourdomain.com/health
```

---

## 🚨 Known Issues

1. **Calendar Create Button** - Fixed in this commit (was missing onFinish handler)
2. **Some API endpoints return empty data** - Database needs seeding for demo data
3. **HTTP only** - HTTPS setup pending domain registration

---

## 📞 Support

- Repository: https://github.com/sbuncele-del/WorldClass-ERP
- Backend: `/workspaces/WorldClass-ERP/backend`
- Frontend: `/workspaces/WorldClass-ERP/frontend`
