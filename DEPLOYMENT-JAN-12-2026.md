# Cape Town Production Deployment - January 12, 2026

## Summary
Successfully deployed WorldClass ERP frontend to Cape Town (af-south-1) ECS cluster, with working authentication against Cape Town RDS database.

---

## Infrastructure

### Cape Town Region (af-south-1) - PRIMARY PRODUCTION

| Component | Details |
|-----------|---------|
| **ECS Cluster** | worldclass-erp-cluster |
| **Frontend Service** | frontend-service (2 tasks running) |
| **Backend Service** | worldclass-erp-backend |
| **ALB** | worldclass-erp-alb-1149802512.af-south-1.elb.amazonaws.com |
| **ECR Repository** | 483636500494.dkr.ecr.af-south-1.amazonaws.com/worldclass-erp-frontend |
| **RDS Database** | worldclass-erp-db.c92ou2c2e43l.af-south-1.rds.amazonaws.com |
| **Database Name** | erp_database |

### EU-North Region (eu-north-1) - BACKUP/LEGACY

| Component | Details |
|-----------|---------|
| **EC2 Instance** | i-0b20fd06fae7e84b1 |
| **Public IP** | 51.20.67.228 |
| **Nginx Root** | /var/www/aetheros-erp |
| **RDS Database** | aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com |
| **Database Name** | aetheros_erp |

---

## Domain Configuration

| Domain | Points To |
|--------|-----------|
| **siyabusaerp.co.za** | Cape Town ALB (worldclass-erp-alb-1149802512.af-south-1.elb.amazonaws.com) |
| **investor.siyabusa.co.za** | (Needs verification - separate deployment) |

---

## Docker Images Deployed

### Frontend (Jan 12, 2026)
- **Image**: worldclass-erp-frontend:v3 (also tagged as :latest)
- **Built from**: /workspaces/WorldClass-ERP/frontend/dist (Jan 11 01:09 build)
- **Task Definition**: worldclass-erp-frontend:2

### Dockerfile Fix Applied
Removed problematic `server_tokens off;` line that was causing nginx to crash:
```dockerfile
# REMOVED: RUN echo 'server_tokens off;' >> /etc/nginx/nginx.conf
```

### nginx.conf Updated
API proxy configured to point to Cape Town ALB:
```nginx
location /api/ {
    proxy_pass http://worldclass-erp-alb-1149802512.af-south-1.elb.amazonaws.com/api/;
    ...
}
```

---

## Database Credentials

### Cape Town RDS (PRODUCTION)
```
Host: worldclass-erp-db.c92ou2c2e43l.af-south-1.rds.amazonaws.com
Port: 5432
Database: erp_database
Username: erpadmin
Password: WorldClass2024SecureDB
```

### EU-North RDS (LEGACY)
```
Host: aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com
Port: 5432
Database: aetheros_erp
Username: postgres
Password: caxMex-0putca-dyjnah
```

---

## Admin User Created

| Field | Value |
|-------|-------|
| **Email** | admin@siyabusaerp.co.za |
| **Password** | Admin123! |
| **Tenant** | SiyaBusa Group |
| **Tenant ID** | d0a49212-96f5-46c7-9d69-fec0f235a90c |
| **User ID** | 3657bbaa-9097-4305-9c3c-957189fbc5ce |
| **Status** | trial (until 2026-01-26) |

---

## Verified Working

- ✅ Frontend loads at https://siyabusaerp.co.za
- ✅ Landing page displays correctly
- ✅ Login API works (`/api/auth/login`)
- ✅ Signup API works (`/api/auth/signup`)
- ✅ Auth/me API works (`/api/auth/me`)
- ✅ JWT tokens issued correctly
- ✅ ECS tasks running (2 frontend tasks)

---

## Deployment Commands Used

### 1. Build Docker Image
```bash
cd /workspaces/WorldClass-ERP/frontend
docker build -t worldclass-erp-frontend:jan12-v3 .
```

### 2. Tag and Push to ECR
```bash
aws ecr get-login-password --region af-south-1 | docker login --username AWS --password-stdin 483636500494.dkr.ecr.af-south-1.amazonaws.com

docker tag worldclass-erp-frontend:jan12-v3 483636500494.dkr.ecr.af-south-1.amazonaws.com/worldclass-erp-frontend:v3
docker tag worldclass-erp-frontend:jan12-v3 483636500494.dkr.ecr.af-south-1.amazonaws.com/worldclass-erp-frontend:latest

docker push 483636500494.dkr.ecr.af-south-1.amazonaws.com/worldclass-erp-frontend:v3
docker push 483636500494.dkr.ecr.af-south-1.amazonaws.com/worldclass-erp-frontend:latest
```

### 3. Update ECS Task Definition
Created new task definition (worldclass-erp-frontend:2) with explicit image tag :v3

### 4. Deploy to ECS
```bash
aws ecs update-service --cluster worldclass-erp-cluster --service frontend-service --task-definition worldclass-erp-frontend:2 --force-new-deployment --region af-south-1
```

---

## Issues Encountered & Resolved

### Issue 1: Blank Frontend Page
**Cause**: index.html referenced wrong JS files (mismatched build)
**Fix**: Redeployed correct frontend/dist build from Jan 11

### Issue 2: Wrong nginx root on EU-North EC2
**Cause**: Deployed to /var/www/html instead of /var/www/aetheros-erp
**Fix**: Deployed to correct /var/www/aetheros-erp folder

### Issue 3: Docker container exit code 1
**Cause**: `server_tokens off;` directive in wrong location broke nginx
**Fix**: Removed the problematic RUN line from Dockerfile

### Issue 4: ECS pulling old cached image
**Cause**: Using :latest tag which was cached
**Fix**: Created explicit :v3 tag and new task definition revision

### Issue 5: Two separate databases
**Discovery**: Cape Town and EU-North use completely different RDS instances
**Decision**: Use Cape Town database fresh, created new admin user

---

## Next Steps

1. [ ] Verify investor portal at investor.siyabusa.co.za
2. [ ] Update investor portal content (25 modules, remove AI/Aetheros references)
3. [ ] Test all ERP modules through frontend
4. [ ] Set up proper CI/CD pipeline
5. [ ] Configure proper SSL certificates

---

## AWS IAM User

| Field | Value |
|-------|-------|
| **User** | ERPWorldclassconsole |
| **Access Key** | (stored in ~/.aws/credentials) |
| **Permissions** | ECR, ECS (Cape Town region) |

---

**Document Created**: January 12, 2026
**Author**: GitHub Copilot (automated deployment session)
