# WorldClass ERP - Deployment Strategy

## Current Production Architecture (January 2026)

```
┌─────────────────────────────────────────────────────────────┐
│                     primesources.site                        │
│                          ↓                                   │
│                    DNS (Route 53)                            │
│                          ↓                                   │
│              EC2: 51.20.67.228 (i-0b20fd06fae7e84b1)        │
│              ┌─────────────────────────────────────┐        │
│              │  NGINX (port 80/443)                │        │
│              │  ├── / → /var/www/html (Frontend)  │        │
│              │  └── /api → localhost:3000 (API)   │        │
│              │                                     │        │
│              │  PM2: erp-backend                   │        │
│              │  └── /home/ec2-user/erp-production │        │
│              └─────────────────────────────────────┘        │
│                          ↓                                   │
│              RDS: aetheros-erp-db (PostgreSQL)              │
└─────────────────────────────────────────────────────────────┘
```

## Critical Paths

| Component | Location | How to Deploy |
|-----------|----------|---------------|
| Frontend | `/var/www/html/` on EC2 | tar + S3 + extract |
| Backend | `/home/ec2-user/erp-production/` | tar + S3 + pm2 restart |
| Database | RDS PostgreSQL | SQL migrations via psql |

## Single Deployment Script

Run this ONE script to deploy everything:

```bash
./deploy-production.sh
```

## What NOT to Do

❌ Deploy frontend to S3 bucket (site doesn't use it)
❌ Make database changes without running migrations
❌ Deploy backend without rebuilding TypeScript
❌ Forget to restart PM2 after backend deploy

## Database Credentials

```
Host: aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com
User: postgres
Pass: caxMex-0putca-dyjnah
DB: postgres
```

## AWS Access

```
Instance ID: i-0b20fd06fae7e84b1
Region: eu-north-1
Access: SSM (no SSH key needed)
```
