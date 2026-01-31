# WorldClass ERP - System Architecture Document
## Version: 2.2 | Date: January 12, 2026 (UPDATED)

> ⚠️ **PRODUCTION STATUS**: Cape Town (af-south-1) deployment  
> ⚠️ **CRITICAL ISSUE**: Backend DATABASE_URL misconfigured - pointing to localhost instead of RDS  
> ⚠️ **DEPENDENCY STATUS: LOCKED** - All 110 dependencies pinned to exact versions. See DEPENDENCIES-LOCKED.md

---

# CURRENT PRODUCTION INFRASTRUCTURE (January 12, 2026)

## PRIMARY: Cape Town (af-south-1)

| Component | Details | Status |
|-----------|---------|--------|
| **Domain** | siyabusaerp.co.za | ✅ Working |
| **ECS Cluster** | worldclass-erp-cluster | ✅ Running |
| **Frontend Service** | frontend-service (2 tasks) | ✅ Working |
| **Backend Service** | worldclass-erp-backend | ⚠️ DB Connection Issue |
| **ALB** | worldclass-erp-alb-1149802512.af-south-1.elb.amazonaws.com | ✅ Working |
| **RDS Database** | worldclass-erp-db.c92ou2c2e43l.af-south-1.rds.amazonaws.com | ✅ Running |
| **ECR (Frontend)** | 483636500494.dkr.ecr.af-south-1.amazonaws.com/worldclass-erp-frontend | ✅ |
| **ECR (Backend)** | 483636500494.dkr.ecr.af-south-1.amazonaws.com/worldclass-erp-backend | ⚠️ Needs env fix |

### Cape Town Database
```
Host: worldclass-erp-db.c92ou2c2e43l.af-south-1.rds.amazonaws.com
Port: 5432
Database: erp_database
Username: erpadmin
Password: WorldClass2024SecureDB
```

### Admin User
```
Email: admin@siyabusaerp.co.za
Password: Admin123!
Tenant ID: d0a49212-96f5-46c7-9d69-fec0f235a90c
```

## LEGACY: EU-North (eu-north-1)

| Component | Details | Status |
|-----------|---------|--------|
| **EC2** | i-0b20fd06fae7e84b1 (51.20.67.228) | 🔶 Legacy |
| **RDS** | aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com | 🔶 Legacy |

---

# CRITICAL FIX REQUIRED

The backend ECS task needs DATABASE_URL environment variable updated:

```bash
# WRONG (current):
DATABASE_URL=postgresql://postgres:password@127.0.0.1:5432/erp_database

# CORRECT (needed):
DATABASE_URL=postgresql://erpadmin:WorldClass2024SecureDB@worldclass-erp-db.c92ou2c2e43l.af-south-1.rds.amazonaws.com:5432/erp_database
```

To fix:
1. Update ECS task definition with correct DATABASE_URL
2. Redeploy backend service

---

# TABLE OF CONTENTS

1. [System Overview](#1-system-overview)
2. [Technology Stack](#2-technology-stack)
3. [Infrastructure Architecture](#3-infrastructure-architecture)
4. [Application Architecture](#4-application-architecture)
5. [Database Schema](#5-database-schema)
6. [API Architecture](#6-api-architecture)
7. [Module Structure](#7-module-structure)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Deployment Architecture](#9-deployment-architecture)
10. [Deployment Commands Reference](#10-deployment-commands-reference)
11. [File Structure](#11-file-structure)

---

# 1. SYSTEM OVERVIEW

WorldClass ERP is a comprehensive, multi-tenant Enterprise Resource Planning system designed for South African businesses. It provides:

- **25+ Business Modules** covering all aspects of business operations
- **Multi-Tenant Architecture** with complete data isolation
- **Industry Verticals** for Healthcare, Mining, Construction, Property, Agriculture
- **SARS Compliance** built-in for South African tax requirements
- **Real-time Dashboards** with AI-powered insights

## 1.1 Key Design Principles

1. **Tenant Isolation**: Every database query includes `tenant_id`
2. **API-First**: All functionality exposed via RESTful APIs
3. **Module Independence**: Each module can operate independently
4. **Audit Trail**: All changes are logged for compliance

---

# 2. TECHNOLOGY STACK

## 2.1 Backend
```
┌─────────────────────────────────────┐
│           BACKEND STACK             │
├─────────────────────────────────────┤
│ Runtime      │ Node.js 18.x LTS     │
│ Language     │ TypeScript 5.x       │
│ Framework    │ Express.js 4.x       │
│ ORM/Query    │ Raw SQL (pg pool)    │
│ Validation   │ Joi / Zod            │
│ Auth         │ JWT (jsonwebtoken)   │
└─────────────────────────────────────┘
```

## 2.2 Frontend
```
┌─────────────────────────────────────┐
│          FRONTEND STACK             │
├─────────────────────────────────────┤
│ Framework    │ React 18.x           │
│ Language     │ TypeScript 5.x       │
│ Build Tool   │ Vite                 │
│ State        │ React Context/Zustand│
│ Styling      │ Tailwind CSS         │
│ Components   │ Shadcn/UI            │
└─────────────────────────────────────┘
```

## 2.3 Database
```
┌─────────────────────────────────────┐
│          DATABASE STACK             │
├─────────────────────────────────────┤
│ Primary DB   │ PostgreSQL 15        │
│ Hosting      │ AWS RDS              │
│ Cache        │ Redis (planned)      │
│ Schemas      │ Multi-schema design  │
└─────────────────────────────────────┘
```

## 2.4 Infrastructure
```
┌─────────────────────────────────────┐
│       INFRASTRUCTURE STACK          │
├─────────────────────────────────────┤
│ Compute      │ AWS ECS Fargate      │
│ Container    │ Docker               │
│ Database     │ AWS RDS PostgreSQL   │
│ Storage      │ AWS S3               │
│ CDN          │ AWS ALB              │
│ Cache        │ Redis (planned)      │
│ Web Server   │ nginx (in container) │
│ SSL          │ AWS ACM              │
│ Region       │ af-south-1 (Cape Town)│
└─────────────────────────────────────┘
```

---

# 3. INFRASTRUCTURE ARCHITECTURE

```
                      ┌─────────────────┐
                      │    INTERNET     │
                      └────────┬────────┘
                               │
                      ┌────────▼────────┐
                      │  siyabusaerp.co.za  │
                      │  (DNS → 51.20.67.228)  │
                      └────────┬────────┘
                               │ HTTPS :443
                      ┌────────▼────────┐
                      │     nginx       │
                      │   (SSL termination)  │
                      └────────┬────────┘
                               │
          ┌────────────────────┴────────────────────┐
          │                                          │
 ┌────────▼────────┐                      ┌─────────▼─────────┐
 │   Static Files  │                      │  Proxy to :3000   │
 │  /var/www/html  │                      │   /api/*          │
 │                 │                      │                   │
 │  React Frontend │                      │  Docker Container │
 │  (Vite build)   │                      │  erp-backend      │
 └─────────────────┘                      └─────────┬─────────┘
                                                    │
                    ┌───────────────────────────────┴──────┐
                    │                                      │
           ┌────────▼────────┐                   ┌─────────▼────────┐
           │   Redis Docker  │                   │     AWS RDS      │
           │   Port 6379     │                   │    PostgreSQL    │
           │                 │                   │                  │
           │  Session/Cache  │                   │  aetheros_erp    │
           └─────────────────┘                   └──────────────────┘
```

## 3.1 PRODUCTION DEPLOYMENT LOCATIONS (CURRENT - JANUARY 2026)

### 🌐 DOMAIN & SSL
| Property | Value |
|----------|-------|
| **Production URL** | `https://siyabusaerp.co.za` |
| **SSL Certificate** | Let's Encrypt (auto-renewed) |
| **DNS Provider** | CloudFlare or registrar |
| **IP Address** | `51.20.67.228` |

### 🖥️ BACKEND (Node.js + Docker)
| Property | Value |
|----------|-------|
| **Platform** | AWS EC2 + Docker |
| **Instance ID** | `i-0b20fd06fae7e84b1` |
| **Public IP** | `51.20.67.228` |
| **API URL** | `https://siyabusaerp.co.za/api` |
| **Container Name** | `erp-backend` |
| **Docker Image** | `erp-backend:dashboard-v4` (current) |
| **Internal Port** | `3000` |
| **Network** | `erp-net` (Docker bridge) |
| **Process Manager** | Systemd (`erp-backend.service`) |
| **Region** | eu-north-1 (Stockholm) |

### 🎨 FRONTEND (React + Vite)
| Property | Value |
|----------|-------|
| **Platform** | AWS S3 → EC2 (nginx serves static) |
| **S3 Bucket** | `s3://aetheros-erp-frontend` |
| **Server Directory** | `/var/www/html/` |
| **Build Tool** | Vite |
| **Build Output** | `frontend/dist/` |
| **Web Server** | nginx (serves static files) |

### 🗄️ DATABASE (PostgreSQL)
| Property | Value |
|----------|-------|
| **Platform** | AWS RDS |
| **Endpoint** | `aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com` |
| **Port** | `5432` |
| **Database Name** | `aetheros_erp` |
| **Username** | `postgres` |
| **Password** | `caxMex-0putca-dyjnah` |
| **Engine** | PostgreSQL 15 |

### 📦 S3 BUCKETS
| Bucket | Purpose |
|--------|---------|
| `s3://aetheros-erp-deployments` | Backend Docker images (tar.gz) |
| `s3://aetheros-erp-frontend` | Frontend static files |

### 🐳 DOCKER CONTAINERS ON EC2
| Container | Image | Port | Purpose |
|-----------|-------|------|---------|
| `erp-backend` | `erp-backend:dashboard-v4` | 3000 | Node.js API |
| `redis` | `redis:alpine` | 6379 | Cache/Session |

## 3.2 EC2 Instance Details
- **Instance ID**: `i-0b20fd06fae7e84b1`
- **Type**: t3.medium (2 vCPU, 4GB RAM)
- **OS**: Amazon Linux 2
- **Storage**: 30GB gp3 SSD
- **Docker**: Installed and running
- **nginx**: Serving frontend + reverse proxy

## 3.3 RDS Instance Details
- **Identifier**: aetheros-erp-db
- **Engine**: PostgreSQL 15
- **Instance Class**: db.t3.micro
- **Storage**: 20GB gp2 SSD
- **Multi-AZ**: No (single region)
- **Public Access**: No (private subnet)

### 🗄️ DATABASE (PostgreSQL)
| Property | Value |
|----------|-------|
| **Platform** | AWS RDS |
| **Endpoint** | `aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com` |
| **Port** | 5432 |
| **Database** | `aetheros_erp` |
| **Username** | `postgres` |
| **Password** | `caxMex-0putca-dyjnah` |
| **Engine** | PostgreSQL 15 |

### 📁 SOURCE CODE LOCATIONS
| Component | Local Path | On Server |
|-----------|------------|-----------|
| Backend Source | `/workspaces/WorldClass-ERP/backend/src` | Inside Docker image |
| Backend Compiled | `/workspaces/WorldClass-ERP/backend/dist` | `/app/dist` (in container) |
| Frontend Source | `/workspaces/WorldClass-ERP/frontend/src` | N/A |
| Frontend Built | `/workspaces/WorldClass-ERP/frontend/dist` | `/var/www/html` |
| Docker Images | Built locally | Loaded from S3 tar.gz |

---

# 4. APPLICATION ARCHITECTURE

## 4.1 Request Flow

```
┌──────────────────────────────────────────────────────────────┐
│                     REQUEST LIFECYCLE                         │
└──────────────────────────────────────────────────────────────┘

  Client Request
       │
       ▼
┌──────────────┐
│   Express    │
│   Server     │
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐
│  Security    │────►│   CORS       │
│  Middleware  │     │   Headers    │
└──────┬───────┘     └──────────────┘
       │
       ▼
┌──────────────┐
│    Auth      │ ◄── JWT Verification
│  Middleware  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Tenant     │ ◄── Extract tenant_id from token
│  Middleware  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Router     │ ◄── v2.routes.ts
│              │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Controller  │ ◄── Business Logic
│              │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Database   │ ◄── PostgreSQL (with tenant_id)
│              │
└──────┬───────┘
       │
       ▼
  JSON Response
```

## 4.2 Multi-Tenant Request Pattern

```typescript
// Every V2 controller follows this pattern:
export const getResource = async (req: TenantRequest, res: Response) => {
  try {
    // 1. Extract tenant context (MANDATORY)
    const { tenantId } = getTenantContext(req);
    
    // 2. Query with tenant_id filter (MANDATORY)
    const result = await pool.query(
      `SELECT * FROM table WHERE tenant_id = $1`,
      [tenantId]
    );
    
    // 3. Return success response
    res.json({ success: true, data: result.rows });
  } catch (error) {
    // 4. Handle errors
    res.status(500).json({ success: false, error: 'Failed' });
  }
};
```

---

# 5. DATABASE SCHEMA

## 5.1 Schema Organization

```
PostgreSQL Database: postgres
├── public (default schema)
│   ├── tenants
│   ├── users
│   ├── customers
│   ├── invoices
│   ├── projects
│   └── ... (most tables)
│
├── hr (HR module schema)
│   ├── employees
│   ├── departments
│   ├── leave_types
│   ├── leave_requests
│   └── payroll_runs
│
├── inventory (Inventory schema)
│   ├── items
│   ├── categories
│   ├── warehouses
│   └── stock_levels
│
├── manufacturing (Manufacturing schema)
│   ├── boms
│   ├── wo│
└── compliance (Compliance schema)
    ├── requirements
    ├── sars_submissions
    └── filings
├── sars (SARS Sentinel schema)
    ├── tax_returns
    ├── vat_returns
    ├── paye_submissions
    └── tax_certificates

├── healthcare (Healthcare Hub schema)
    ├── patients
    ├── practitioners
    ├── appointments
    ├── prescriptions
    └── medical_records```

## 5.2 Core Tables

### tenants
```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    settings JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);
```

## 5.3 Multi-Tenant Rule

**CRITICAL**: Every table that stores tenant data MUST have:
1. A `tenant_id UUID NOT NULL` column
2. A reference to `tenants(id)` (when possible)
3. An index on `tenant_id` for query performance

---

# 6. API ARCHITECTURE

## 6.1 API Versioning

```
/api/auth/*          → Authentication (no version)
/api/v2/*            → V2 API (tenant-hardened) ✅ USE THIS
/api/superadmin/*    → Super admin endpoints
```

## 6.2 Standard Response Format

### Success Response
```json
{
  "success": true,
  "data": [...],
  "total": 100,
  "page": 1,
  "totalPages": 10
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "message": "Human readable message"
}
```

## 6.3 Authentication

### Login Request
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@tenant.com",
  "password": "password123"
}
```

### Login Response
```json
{
  "success": true,
  "data": {
    "tokens": {
      "accessToken": "eyJ...",
      "refreshToken": "eyJ...",
      "expiresIn": 3600
    },
    "tenant": {
      "id": "uuid",
      "name": "Tenant Name"
    },
    "user": {
      "id": "uuid",
      "email": "user@tenant.com"
    }
  }
}
```

### Using the Token
```bash
GET /api/v2/inventory/items
Authorization: Bearer eyJ...
```

---

# 7. MODULE STRUCTURE

## 7.1 Backend Modules

```
backend/src/
├── auth/                    # Authentication
├── config/                  # Database & environment
├── controllers/             # V2 Controllers
│   ├── admin.controller.v2.ts
│   ├── assets.controller.v2.ts
│   ├── inventory.controller.v2.ts
│   ├── sales.controller.v2.ts
│   ├── purchase.controller.v2.ts
│   ├── healthcare.controller.v2.ts
│   ├── mining.controller.v2.ts
│   ├── construction.controller.v2.ts
│   ├── property.controller.v2.ts
│   ├── agriculture.controller.v2.ts
│   └── ...
├── middleware/              # Express middleware
│   ├── auth.ts
│   ├── tenant.ts
│   └── security.ts
├── modules/                 # Domain modules
│   ├── hr/
│   ├── financial/
│   ├── manufacturing/
│   ├── compliance/
│   └── logistics/
├── routes/                  # Route definitions
│   └── v2.routes.ts        # MAIN ROUTE FILE
├── services/               # Business logic services
└── types/                  # TypeScript types
    └── index.ts            # TenantRequest type
```

## 7.2 Key Files Reference

| Purpose | File Path |
|---------|-----------|
| Main routes | `backend/src/routes/v2.routes.ts` |
| Tenant middleware | `backend/src/middleware/tenant.ts` |
| Auth middleware | `backend/src/middleware/auth.ts` |
| Database config | `backend/src/config/database.ts` |
| Type definitions | `backend/src/types/index.ts` |

---

# 8. AUTHENTICATION & AUTHORIZATION

## 8.1 JWT Token Structure

```json
{
  "userId": "uuid",
  "tenantId": "uuid",
  "email": "user@tenant.com",
  "role": "admin",
  "type": "access",
  "iat": 1234567890,
  "exp": 1234571490
}
```

## 8.2 Middleware Chain

```
Request → auth.ts → tenant.ts → Controller
           │           │
           │           └── Extracts tenantId, attaches to req.tenant
           │
           └── Verifies JWT, attaches user to req.user
```

## 8.3 Role-Based Access

```
admin       → Full access to tenant
manager     → Department-level access
user        → Personal data only
readonly    → View only
```

---

# 9. DEPLOYMENT ARCHITECTURE

## 9.1 Backend Deployment Flow (Docker)

```
┌─────────────────────────────────────────────────────────────────────┐
│                   BACKEND DEPLOYMENT PIPELINE                        │
└─────────────────────────────────────────────────────────────────────┘

  Developer Machine (GitHub Codespace)
       │
       │ 1. npm run build (TypeScript → JavaScript)
       ▼
  ┌──────────────┐
  │   backend/   │
  │   dist/      │ ← Compiled JavaScript
  └──────┬───────┘
         │
         │ 2. docker build -t erp-backend:tag .
         ▼
  ┌──────────────┐
  │   Docker     │ ← Local Docker image
  │   Image      │   (includes dist/, node_modules, package.json)
  └──────┬───────┘
         │
         │ 3. docker save | gzip > /tmp/erp-backend.tar.gz
         ▼
  ┌──────────────┐
  │   Tarball    │ ← ~98MB compressed image
  │   (.tar.gz)  │
  └──────┬───────┘
         │
         │ 4. aws s3 cp /tmp/erp-backend.tar.gz s3://aetheros-erp-deployments/docker/
         ▼
  ┌──────────────┐
  │   AWS S3     │ ← Docker image stored in S3
  │   Bucket     │
  └──────┬───────┘
         │
         │ 5. aws ssm send-command (to EC2)
         ▼
  ┌──────────────┐
  │   EC2        │ 
  │   Instance   │ ← Downloads from S3
  │              │ ← docker load < tarball
  │              │ ← Updates systemd service
  │              │ ← systemctl restart erp-backend
  └──────────────┘
```

## 9.2 Frontend Deployment Flow (S3 + nginx)

```
┌─────────────────────────────────────────────────────────────────────┐
│                  FRONTEND DEPLOYMENT PIPELINE                        │
└─────────────────────────────────────────────────────────────────────┘

  Developer Machine (GitHub Codespace)
       │
       │ 1. npm run build (Vite build)
       ▼
  ┌──────────────┐
  │  frontend/   │
  │  dist/       │ ← Static HTML/JS/CSS files
  └──────┬───────┘
         │
         │ 2. aws s3 sync frontend/dist s3://aetheros-erp-frontend --delete
         ▼
  ┌──────────────┐
  │   AWS S3     │ ← Frontend files in S3 bucket
  │   Bucket     │
  └──────┬───────┘
         │
         │ 3. aws ssm send-command (to EC2)
         ▼
  ┌──────────────┐
  │   EC2        │
  │   Instance   │ ← aws s3 sync s3://bucket /var/www/html --delete
  │              │ ← nginx already configured to serve
  └──────────────┘
```

## 9.3 Systemd Service Configuration

The backend runs as a Docker container managed by systemd:

**File: `/etc/systemd/system/erp-backend.service`**
```ini
[Unit]
Description=ERP Backend Container
After=docker.service erp-redis.service
Requires=docker.service erp-redis.service

[Service]
Type=simple
Restart=always
RestartSec=10
ExecStartPre=-/usr/bin/docker rm -f erp-backend
ExecStart=/usr/bin/docker run --rm --name erp-backend \
  --network erp-net \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://postgres:caxMex-0putca-dyjnah@aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com:5432/aetheros_erp \
  -e DB_HOST=aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com \
  -e DB_PORT=5432 \
  -e DB_NAME=aetheros_erp \
  -e DB_USER=postgres \
  -e DB_PASSWORD=caxMex-0putca-dyjnah \
  -e REDIS_HOST=redis \
  -e REDIS_PORT=6379 \
  -e REDIS_URL=redis://redis:6379 \
  -e JWT_SECRET=worldclass-erp-jwt-secret-2024 \
  -e NODE_ENV=production \
  erp-backend:healthcare-v7
ExecStop=/usr/bin/docker stop erp-backend

[Install]
WantedBy=multi-user.target
```

## 9.4 nginx Configuration

**File: `/etc/nginx/conf.d/erp.conf`**
```nginx
server {
    listen 443 ssl;
    server_name siyabusaerp.co.za www.siyabusaerp.co.za;
    
    ssl_certificate /etc/letsencrypt/live/siyabusaerp.co.za/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/siyabusaerp.co.za/privkey.pem;
    
    # Frontend - serve static files
    root /var/www/html;
    index index.html;
    
    # API proxy to Docker container
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Socket.IO for real-time features
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # SPA fallback - serve index.html for client-side routes
    location / {
        try_files $uri $uri/ /index.html;
    }
}

server {
    listen 80;
    server_name siyabusaerp.co.za www.siyabusaerp.co.za;
    return 301 https://$server_name$request_uri;
}
```

---

# 10. DEPLOYMENT COMMANDS REFERENCE

## 10.1 Backend Deployment (Complete Process)

```bash
# Step 1: Build TypeScript
cd /workspaces/WorldClass-ERP/backend
npm run build

# Step 2: Build Docker image (increment version tag)
docker build -t erp-backend:healthcare-v7 .

# Step 3: Save and compress Docker image
docker save erp-backend:healthcare-v7 | gzip > /tmp/erp-backend-v7.tar.gz

# Step 4: Upload to S3
aws s3 cp /tmp/erp-backend-v7.tar.gz s3://aetheros-erp-deployments/docker/

# Step 5: Deploy to EC2 (all in one SSM command)
aws ssm send-command \
  --instance-ids "i-0b20fd06fae7e84b1" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=[
    "cd /tmp",
    "aws s3 cp s3://aetheros-erp-deployments/docker/erp-backend-v7.tar.gz .",
    "gunzip -c erp-backend-v7.tar.gz | docker load",
    "sudo sed -i s/healthcare-v6/healthcare-v7/g /etc/systemd/system/erp-backend.service",
    "sudo systemctl daemon-reload",
    "sudo systemctl restart erp-backend",
    "sleep 8",
    "docker ps",
    "curl -s http://localhost:3000/health"
  ]' \
  --region eu-north-1
```

## 10.2 Frontend Deployment (Complete Process)

```bash
# Step 1: Build frontend
cd /workspaces/WorldClass-ERP/frontend
npm run build

# Step 2: Sync to S3
aws s3 sync dist s3://aetheros-erp-frontend --delete

# Step 3: Sync from S3 to EC2
aws ssm send-command \
  --instance-ids "i-0b20fd06fae7e84b1" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["aws s3 sync s3://aetheros-erp-frontend /var/www/html/ --delete"]' \
  --region eu-north-1
```

## 10.3 Check Deployment Status

```bash
# Check container status
aws ssm send-command \
  --instance-ids "i-0b20fd06fae7e84b1" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["docker ps && curl -s http://localhost:3000/health"]' \
  --region eu-north-1

# Get SSM command result
aws ssm get-command-invocation \
  --command-id "COMMAND_ID" \
  --instance-id "i-0b20fd06fae7e84b1" \
  --region eu-north-1
```

## 10.4 View Backend Logs

```bash
aws ssm send-command \
  --instance-ids "i-0b20fd06fae7e84b1" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["docker logs erp-backend 2>&1 | tail -100"]' \
  --region eu-north-1
```

## 10.5 Restart Backend Only

```bash
aws ssm send-command \
  --instance-ids "i-0b20fd06fae7e84b1" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["sudo systemctl restart erp-backend && sleep 5 && docker ps"]' \
  --region eu-north-1
```

## 10.6 Connect to Production Database

```bash
# Via SSM (RDS is in private subnet, not publicly accessible)
aws ssm send-command \
  --instance-ids "i-0b20fd06fae7e84b1" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["PGPASSWORD=caxMex-0putca-dyjnah psql -h aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com -U postgres -d aetheros_erp -c \"SELECT version();\""]' \
  --region eu-north-1
```

## 10.7 List Docker Images on EC2

```bash
aws ssm send-command \
  --instance-ids "i-0b20fd06fae7e84b1" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["docker images | grep erp-backend"]' \
  --region eu-north-1
```

## 10.8 Update Systemd Service Image Version

```bash
# Replace old version with new version in service file
aws ssm send-command \
  --instance-ids "i-0b20fd06fae7e84b1" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=[
    "sudo sed -i s/OLD_TAG/NEW_TAG/g /etc/systemd/system/erp-backend.service",
    "sudo systemctl daemon-reload",
    "sudo systemctl restart erp-backend"
  ]' \
  --region eu-north-1
```

---

# 11. FILE STRUCTURE

## 11.1 Repository Root
```
WorldClass-ERP/
├── backend/                      # Node.js backend
│   ├── src/                     # TypeScript source
│   ├── dist/                    # Compiled JavaScript
│   ├── Dockerfile               # Docker build configuration
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                    # React frontend
│   ├── src/
│   │   └── modules/             # Feature modules
│   │       ├── healthcare/      # Healthcare Hub
│   │       ├── mining/          # Mining Hub
│   │       ├── logistics/       # Logistics Hub
│   │       └── ...
│   ├── public/
│   └── package.json
│
├── migrations/                  # SQL migrations
│   └── COMPLETE-SCHEMA-JAN-2026.sql
│
├── scripts/                     # Utility scripts
│   └── test-all-endpoints.sh
│
├── docs/                        # Documentation
│
├── SYSTEM-STATUS-JAN-2026.md   # Current status
├── ARCHITECTURE.md              # This file
└── .github/
    └── copilot-instructions.md
```

## 11.2 Important Configuration Files

| File | Purpose |
|------|---------|
| `backend/Dockerfile` | Docker image build instructions |
| `backend/.env` | Environment variables (local only) |
| `backend/tsconfig.json` | TypeScript configuration |
| `backend/package.json` | Dependencies |
| `.github/copilot-instructions.md` | AI assistant context |

## 11.3 Key Backend Files

| File | Purpose |
|------|---------|
| `backend/src/server.ts` | Express server entry point |
| `backend/src/routes/v2.routes.ts` | Main API routes |
| `backend/src/middleware/tenant.ts` | Tenant isolation middleware |
| `backend/src/middleware/auth.ts` | JWT authentication |
| `backend/src/config/database.ts` | PostgreSQL connection pool |
| `backend/src/controllers/*.v2.ts` | V2 tenant-aware controllers |

---

# APPENDIX A: QUICK REFERENCE

## A.1 Production URLs

| Service | URL |
|---------|-----|
| **Frontend** | https://siyabusaerp.co.za |
| **API** | https://siyabusaerp.co.za/api |
| **Health Check** | https://siyabusaerp.co.za/api/health |

## A.2 Test Credentials

| Email | Password | Tenant |
|-------|----------|--------|
| `miningtestx@test.co.za` | `Mining@12345` | Mining Test |

## A.3 Current Docker Image Tags

| Module | Image Tag | Date |
|--------|-----------|------|
| Mining | `erp-backend:mining-v1.0.0` | Jan 2026 |
| Logistics | `erp-backend:logistics-v1.2.0` | Jan 2026 |
| Healthcare | `erp-backend:healthcare-v7` | Jan 9, 2026 |
| **SARS Sentinel** | `erp-backend:healthcare-v7` (patched) | Jan 9, 2026 |
| Dashboard | `erp-backend:dashboard-v4` | Jan 9, 2026 |
| **AI Agent** | `erp-backend:ai-v4` | Jan 10, 2026 |

## A.4 Implemented Industry Modules

| Module | Status | Controllers | Notes |
|--------|--------|-------------|-------|
| **SARS Sentinel** | ✅ Live | `sars-sentinel.controller.v2.ts` | ISV Application Ready |
| **Healthcare Hub** | ✅ Live | `healthcare.controller.v2.ts` | Medical Practice Management |
| **Mining Hub** | ✅ Live | `mining.controller.v2.ts` | Mineral Tracking, Safety |
| **Construction Hub** | ✅ Live | `construction.controller.v2.ts` | Project Costing |
| **Property Hub** | ✅ Live | `property.controller.v2.ts` | Lease Management |
| **Agriculture Hub** | ✅ Live | `agriculture.controller.v2.ts` | Farm Operations |
| **Logistics Hub** | ✅ Live | `logistics.controller.v2.ts` | Fleet Management |

## A.5 AWS Resources Summary

| Resource | Identifier | Region |
|----------|------------|--------|
| EC2 Instance | `i-0b20fd06fae7e84b1` | eu-north-1 |
| RDS Database | `aetheros-erp-db` | eu-north-1 |
| S3 Deployments | `aetheros-erp-deployments` | eu-north-1 |
| S3 Frontend | `aetheros-erp-frontend` | eu-north-1 |

## A.5 AWS Resources Summary

| Resource | Identifier | Region |
|----------|------------|--------|
| EC2 Instance | `i-0b20fd06fae7e84b1` | eu-north-1 |
| RDS Database | `aetheros-erp-db` | eu-north-1 |
| S3 Deployments | `aetheros-erp-deployments` | eu-north-1 |
| S3 Frontend | `aetheros-erp-frontend` | eu-north-1 |

## A.6 SARS Sentinel Database Tables

| Table | Schema | Purpose |
|-------|--------|---------|
| `sars_correspondence` | public | SARS letters, queries, audit notices |
| `sars_correspondence_types` | public | 16 predefined SARS notice types |
| `sars_workflows` | public | Workflow tracking for responses |
| `sars_workflow_steps` | public | Individual workflow steps |
| `sars_submission_history` | public | Response submission log |
| `sars_deadline_calendar` | public | Statutory deadline tracking |
| `sars_correspondence_comments` | public | Internal notes on items |
| `sars.tax_returns` | sars | ITR12, ITA34 returns |
| `sars.vat_returns` | sars | VAT201 returns |
| `sars.paye_submissions` | sars | EMP201, EMP501 |
| `sars.tax_certificates` | sars | IT3, IRP5 certificates |

## A.7 Troubleshooting Commands

### Backend not responding
```bash
# Check container status
aws ssm send-command --instance-ids "i-0b20fd06fae7e84b1" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["docker ps -a | grep erp-backend"]' \
  --region eu-north-1

# Check logs for errors
aws ssm send-command --instance-ids "i-0b20fd06fae7e84b1" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["docker logs erp-backend 2>&1 | tail -50"]' \
  --region eu-north-1

# Restart service
aws ssm send-command --instance-ids "i-0b20fd06fae7e84b1" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["sudo systemctl restart erp-backend"]' \
  --region eu-north-1
```

### Database connection issues
```bash
# Test database connectivity from EC2
aws ssm send-command --instance-ids "i-0b20fd06fae7e84b1" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["PGPASSWORD=caxMex-0putca-dyjnah psql -h aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com -U postgres -d aetheros_erp -c \"SELECT 1\""]' \
  --region eu-north-1
```

### Check nginx status
```bash
aws ssm send-command --instance-ids "i-0b20fd06fae7e84b1" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["sudo systemctl status nginx && sudo nginx -t"]' \
  --region eu-north-1
```

---

**Document Version**: 2.1  
**Last Updated**: January 9, 2026  
**Author**: GitHub Copilot

---

# APPENDIX B: DEPENDENCY LOCK STATUS

## ✅ ALL DEPENDENCIES LOCKED (January 2, 2026)

### Summary
- **Total Dependencies Locked**: 110 packages
- **Backend**: 54 packages (exact versions)
- **Frontend**: 43 packages (exact versions)
- **Lock File**: 857 KB (package-lock.json)

### Key Locked Versions
```
Node.js          >= 18.0.0
TypeScript       5.7.3
Express          4.18.2
React            19.1.1
Vite             5.x
PostgreSQL       pg 8.x
```

### How It's Locked
1. ✅ All `package.json` use exact versions (no `^` or `~`)
2. ✅ `package-lock.json` present and committed
3. ✅ `.npmrc` configured with `save-exact=true`
4. ✅ Docker images bake dependencies at build time
5. ✅ `npm ci` used in production (not `npm install`)

### Will It Change?
**NO** - unless you explicitly run `npm update` or modify `package.json`.

The dependencies are **permanently locked** and will not auto-update.

See `DEPENDENCIES-LOCKED.md` for full details.
