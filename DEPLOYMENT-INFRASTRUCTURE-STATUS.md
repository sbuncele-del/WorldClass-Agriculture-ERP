# WorldClass ERP - Deployment & Infrastructure Status

**Last Updated:** January 26, 2026  
**Document Version:** 1.0  
**Status:** Production Ready ✅

---

## Table of Contents
1. [Infrastructure Overview](#infrastructure-overview)
2. [Server Details](#server-details)
3. [Current Deployment Method](#current-deployment-method)
4. [Database Architecture](#database-architecture)
5. [Services & Processes](#services--processes)
6. [API Keys & Integrations](#api-keys--integrations)
7. [Docker Recommendation](#docker-recommendation)
8. [Deployment Commands Reference](#deployment-commands-reference)
9. [Troubleshooting Guide](#troubleshooting-guide)

---

## Infrastructure Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        WORLDCLASS ERP ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────────┐     ┌──────────────────────────────────────┐     │
│   │   FRONTEND   │     │         VULTR VPS SERVER              │     │
│   │   (React)    │────▶│         139.84.243.221                │     │
│   │   Vite Dev   │     │                                       │     │
│   └──────────────┘     │  ┌─────────────────────────────────┐  │     │
│                        │  │      Node.js Backend (PM2)      │  │     │
│   ┌──────────────┐     │  │      Port 3000                  │  │     │
│   │  DEVELOPMENT │     │  │      Express.js + TypeScript    │  │     │
│   │   Codespace  │────▶│  └─────────────────────────────────┘  │     │
│   │   (GitHub)   │     │              │                        │     │
│   └──────────────┘     │              ▼                        │     │
│                        │  ┌─────────────────────────────────┐  │     │
│                        │  │    Docker Container: PostgreSQL │  │     │
│                        │  │    worldclass-db (Port 5432)    │  │     │
│                        │  │    Database: worldclass_erp     │  │     │
│                        │  └─────────────────────────────────┘  │     │
│                        │              │                        │     │
│                        │              ▼                        │     │
│                        │  ┌─────────────────────────────────┐  │     │
│                        │  │    Docker Container: Redis      │  │     │
│                        │  │    worldclass-redis (Port 6379) │  │     │
│                        │  │    Session/Cache Storage        │  │     │
│                        │  └─────────────────────────────────┘  │     │
│                        │                                       │     │
│                        └──────────────────────────────────────┘     │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────┐      │
│   │                    EXTERNAL SERVICES                      │      │
│   │  • x.ai/Grok API (AI Agent)                              │      │
│   │  • Resend (Email Service)                                │      │
│   │  • AWS Textract (Document Processing)                    │      │
│   │  • Daily.co (Video Meetings)                             │      │
│   └──────────────────────────────────────────────────────────┘      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Server Details

### Production Server (Vultr VPS)

| Property | Value |
|----------|-------|
| **Provider** | Vultr |
| **IP Address** | `139.84.243.221` |
| **SSH User** | `root` |
| **SSH Password** | See `CREDENTIALS.md` (not in git) |
| **OS** | Ubuntu 22.04 LTS |
| **Node.js** | v20.x |
| **Location** | (Check Vultr dashboard) |

### Server Directory Structure

```
/root/WorldClass-ERP/
├── backend/
│   ├── dist/                 # Compiled TypeScript (deployed code)
│   ├── src/                  # Source code (for reference)
│   ├── node_modules/         # Dependencies
│   ├── package.json          # Package manifest
│   ├── package-lock.json     # Locked dependency versions
│   └── .env                  # Environment variables (SECRETS!)
├── frontend/                 # (if deployed)
└── migrations/               # SQL migration files
```

### Docker Containers on Server

| Container Name | Image | Port Mapping | Purpose |
|---------------|-------|--------------|---------|
| `worldclass-db` | postgres:15-alpine | 5432:5432 | Primary PostgreSQL database |
| `worldclass-redis` | redis:7-alpine | 6379:6379 | Session cache, pub/sub |

---

## Current Deployment Method

### ⚠️ Current Approach: Manual rsync Deployment

**How we currently deploy:**

1. **Build locally** (in GitHub Codespace):
   ```bash
   cd /workspaces/WorldClass-ERP/backend
   npm run build   # Compiles TypeScript to dist/
   ```

2. **Rsync to server**:
   ```bash
   sshpass -p '$SSH_PASSWORD' rsync -avz --delete \
     /workspaces/WorldClass-ERP/backend/dist/ \
     root@139.84.243.221:/root/WorldClass-ERP/backend/dist/
   ```

3. **Restart PM2**:
   ```bash
   ssh root@139.84.243.221 "pm2 restart worldclass-backend"
   ```

### What Gets Deployed

| Item | Deployed? | Method |
|------|-----------|--------|
| Compiled JS (`dist/`) | ✅ Yes | rsync |
| Source TS (`src/`) | ❌ No | Not needed |
| `node_modules/` | ⚠️ Manual | `npm install` on server |
| `.env` | ⚠️ Manual | Created manually on server |
| Database schema | ⚠️ Manual | SQL migrations run manually |

### Risks with Current Approach

| Risk | Severity | Description |
|------|----------|-------------|
| **Dependency drift** | 🔴 High | Server's `node_modules` may differ from local |
| **Missing packages** | 🔴 High | New dependencies require manual `npm install` |
| **No rollback** | 🟡 Medium | Can't easily revert to previous version |
| **Environment mismatch** | 🟡 Medium | Dev and prod could diverge |
| **Manual process** | 🟡 Medium | Prone to human error |

---

## Database Architecture

### Connection Details

| Property | Value |
|----------|-------|
| **Host** | `localhost` (from server) / `139.84.243.221` (external) |
| **Port** | `5432` |
| **Database** | `worldclass_erp` |
| **User** | `postgres` |
| **Password** | `postgres` (⚠️ Change in production!) |

### Database Statistics

| Metric | Value |
|--------|-------|
| **Total Tables** | 76+ |
| **Schemas** | public, inventory, sales, accounting, hr, manufacturing, logistics, healthcare, mining, construction, property, agriculture |
| **Multi-tenant** | Yes (tenant_id on all tables) |

### Key Tables by Module

| Module | Core Tables |
|--------|-------------|
| **Multi-Entity** | `legal_entities`, `entity_user_permissions`, `intercompany_transactions`, `consolidation_periods` |
| **Cash Management** | `cash_banks`, `cash_bank_accounts`, `cash_bank_statements`, `cash_bank_statement_lines`, `cash_reconciliations` |
| **Accounting** | `gl_accounts`, `gl_journal_entries`, `gl_journal_lines`, `fiscal_periods` |
| **Sales** | `sales.customers`, `sales.invoices`, `sales.invoice_items` |
| **Inventory** | `inventory.items`, `inventory.stock_movements`, `inventory.warehouses` |

---

## Services & Processes

### PM2 Process Manager

```bash
# Check status
pm2 status

# View logs
pm2 logs worldclass-backend --lines 50

# Restart
pm2 restart worldclass-backend

# Full restart (reload env vars)
pm2 delete worldclass-backend
cd /root/WorldClass-ERP/backend
pm2 start dist/index.js --name worldclass-backend
```

### Current PM2 Configuration

| Property | Value |
|----------|-------|
| **Process Name** | `worldclass-backend` |
| **Entry Point** | `dist/index.js` |
| **Port** | `3000` |
| **Mode** | `fork` (single instance) |

---

## API Keys & Integrations

### Environment Variables on Server

File: `/root/WorldClass-ERP/backend/.env`

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/worldclass_erp
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=worldclass_erp
PGSSLMODE=disable

# Authentication
JWT_SECRET=<secret-key>
JWT_REFRESH_SECRET=<secret-key>

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# AI - x.ai/Grok (PRIMARY)
XAI_API_KEY=<your-grok-api-key-from-console.x.ai>

# Email
RESEND_API_KEY=<your-resend-api-key>

# AWS (for Textract)
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<key>
AWS_REGION=us-east-1
```

### Integration Status

| Service | Status | API Key Variable | Purpose |
|---------|--------|-----------------|---------|
| **x.ai/Grok** | ✅ Active | `XAI_API_KEY` | AI Agent, Transaction categorization |
| **Resend** | ✅ Active | `RESEND_API_KEY` | Email notifications |
| **AWS Textract** | ✅ Active | `AWS_ACCESS_KEY_ID` | Document OCR |
| **OpenAI** | ⚪ Not configured | `OPENAI_API_KEY` | Fallback AI |
| **Anthropic** | ⚪ Not configured | `ANTHROPIC_API_KEY` | Fallback AI |

---

## Docker Recommendation

### 🚨 YES - We Should Dockerize the Backend!

You're absolutely right to ask this. Here's why Docker is recommended:

### Current Problems Without Docker

1. **Dependency Hell**: If `node_modules` on server gets corrupted or differs, things break
2. **Node Version Mismatch**: Server might have different Node.js version
3. **No Reproducibility**: Can't guarantee same build runs same way
4. **No Rollback**: Can't easily revert to working version
5. **Manual Updates**: Must SSH and run commands manually

### Proposed Docker Architecture

```dockerfile
# Dockerfile.backend
FROM node:20-alpine

WORKDIR /app

# Copy package files first (for caching)
COPY package*.json ./

# Install dependencies (locked versions from package-lock.json)
RUN npm ci --only=production

# Copy compiled code
COPY dist/ ./dist/

# Expose port
EXPOSE 3000

# Start
CMD ["node", "dist/index.js"]
```

### Docker Compose for Full Stack

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: worldclass-backend
    restart: always
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/worldclass_erp
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    env_file:
      - ./backend/.env
    depends_on:
      - db
      - redis
    networks:
      - worldclass-network

  db:
    image: postgres:15-alpine
    container_name: worldclass-db
    restart: always
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=worldclass_erp
    ports:
      - "5432:5432"
    networks:
      - worldclass-network

  redis:
    image: redis:7-alpine
    container_name: worldclass-redis
    restart: always
    ports:
      - "6379:6379"
    networks:
      - worldclass-network

volumes:
  postgres_data:

networks:
  worldclass-network:
    driver: bridge
```

### Benefits of Dockerization

| Benefit | Description |
|---------|-------------|
| **Locked Dependencies** | `npm ci` uses exact versions from `package-lock.json` |
| **Reproducible Builds** | Same image runs same everywhere |
| **Easy Rollback** | Just run previous image tag |
| **Version Tagging** | `worldclass-backend:v1.2.3` |
| **CI/CD Ready** | Build in GitHub Actions, deploy image |
| **Isolation** | No conflicts with server system |

### Recommended Migration Path

1. **Phase 1 (Now)**: Create Dockerfile and test locally
2. **Phase 2**: Push images to Docker Hub or GitHub Container Registry
3. **Phase 3**: Replace PM2 with Docker container on server
4. **Phase 4**: Set up automated CI/CD pipeline

---

## Deployment Commands Reference

### Quick Deploy (Current Method)

```bash
# From GitHub Codespace - Full deployment
cd /workspaces/WorldClass-ERP/backend

# 1. Build
npm run build

# 2. Deploy (use ./deploy.sh script or manual):
rsync -avz --delete dist/ root@139.84.243.221:/root/WorldClass-ERP/backend/dist/

# 3. Restart
ssh root@139.84.243.221 "pm2 restart worldclass-backend"
```

### SSH Access

```bash
# Direct SSH (credentials in CREDENTIALS.md)
ssh root@139.84.243.221

# Or use the deploy script
./deploy.sh
```

### Database Operations

```bash
# Connect to database
docker exec -it worldclass-db psql -U postgres -d worldclass_erp

# Run migration
docker exec -i worldclass-db psql -U postgres -d worldclass_erp < migration.sql

# Backup database
docker exec worldclass-db pg_dump -U postgres worldclass_erp > backup_$(date +%Y%m%d).sql
```

### Log Viewing

```bash
# PM2 logs
pm2 logs worldclass-backend --lines 100

# Follow logs live
pm2 logs worldclass-backend --raw

# Docker logs
docker logs worldclass-db --tail 100
docker logs worldclass-redis --tail 100
```

### Health Checks

```bash
# API health
curl http://139.84.243.221/api/health

# Database connection
docker exec worldclass-db pg_isready -U postgres

# Redis connection
docker exec worldclass-redis redis-cli ping
```

---

## Troubleshooting Guide

### Common Issues

#### 1. "Cannot find module" Error
**Cause**: Missing dependency on server
```bash
# Solution: Install dependencies
ssh root@139.84.243.221 "cd /root/WorldClass-ERP/backend && npm install"
```

#### 2. "ECONNREFUSED" to Database
**Cause**: PostgreSQL container not running
```bash
# Solution: Start container
ssh root@139.84.243.221 "docker start worldclass-db"
```

#### 3. "Invalid token" on API
**Cause**: JWT secret mismatch or expired token
```bash
# Solution: Check JWT_SECRET in .env matches
# Get fresh token via /api/auth/login
```

#### 4. AI Agent Not Working
**Cause**: Missing API key
```bash
# Check if XAI_API_KEY is set
ssh root@139.84.243.221 "grep XAI_API_KEY /root/WorldClass-ERP/backend/.env"

# Restart to reload env
ssh root@139.84.243.221 "pm2 delete worldclass-backend && cd /root/WorldClass-ERP/backend && pm2 start dist/index.js --name worldclass-backend"
```

#### 5. Environment Variables Not Loading
**Cause**: PM2 caches environment
```bash
# Solution: Delete and restart (not just restart)
pm2 delete worldclass-backend
pm2 start dist/index.js --name worldclass-backend
```

---

## User Credentials

### Admin Login
| Field | Value |
|-------|-------|
| **Email** | `admin@worldclass.erp` |
| **Password** | `Admin123` |
| **Role** | `admin` |
| **Tenant** | `Default Tenant` |

### Demo User
| Field | Value |
|-------|-------|
| **Email** | `demo@aetheros.co.za` |
| **Password** | (needs reset) |

---

## API Endpoints Summary

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

### AI Agent
- `POST /api/agent/chat` - Chat with AI agent

### Multi-Entity/Consolidation
- `GET /api/entities` - List legal entities
- `POST /api/entities` - Create entity
- `GET /api/entities/intercompany` - Intercompany transactions

### Cash Management
- `GET /api/cash-management/banks` - List banks
- `GET /api/cash-management/bank-accounts` - List accounts
- `POST /api/cash-management/statements/import` - Import CSV
- `POST /api/cash-management/statements/:id/ai-categorize` - AI categorization

---

## Next Steps / Recommendations

### Immediate (This Week)
- [ ] Create Dockerfile for backend
- [ ] Test Docker build locally
- [ ] Set up GitHub Container Registry

### Short Term (This Month)
- [ ] Migrate from PM2 to Docker on server
- [ ] Set up docker-compose for full stack
- [ ] Create backup/restore scripts
- [ ] Change database password from default

### Long Term
- [ ] Set up CI/CD with GitHub Actions
- [ ] Add staging environment
- [ ] Implement blue-green deployments
- [ ] Add monitoring (Prometheus/Grafana)

---

## Document History

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-26 | 1.0 | Initial document creation |

---

**Prepared by:** GitHub Copilot  
**Reviewed by:** (Pending)  
**Approved by:** (Pending)
