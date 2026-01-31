# 🚀 COMPLETE SYSTEM DEPLOYMENT GUIDE - November 2025

**Date**: November 13, 2025  
**Target Server**: 51.21.219.35 (eu-north-1, Stockholm)  
**Instance ID**: i-0b20fd06fae7e84b1  
**Goal**: Deploy 6 new production modules TODAY

---

## ⚠️ CRITICAL: SSH Access Issue

### Current Problem
- SSH port 22 is **timing out** (not responding)
- Was working before, stopped after network issue
- Need to fix before deployment

### Solution Options

#### Option 1: Fix Security Group (RECOMMENDED)
1. Go to AWS Console → EC2 → Security Groups
2. Find security group attached to instance `i-0b20fd06fae7e84b1`
3. Edit **Inbound Rules**
4. Ensure rule exists:
   - **Type**: SSH
   - **Protocol**: TCP
   - **Port**: 22
   - **Source**: Your IP or `0.0.0.0/0` (temporary for testing)
5. Save rules
6. Test: `ssh ec2-user@51.21.219.35`

#### Option 2: Use EC2 Instance Connect (IMMEDIATE)
You have this available in your screenshot! Click the **"Connect"** button:
1. AWS Console → EC2 → Instances → Select instance
2. Click **"Connect"** button (top right)
3. Choose **"EC2 Instance Connect"** tab
4. Username: `ec2-user`
5. Click **"Connect"** → Opens browser-based terminal
6. Use this terminal to deploy!

#### Option 3: Use Session Manager (If Instance Connect doesn't work)
1. AWS Console → Systems Manager → Session Manager
2. Start session to instance `i-0b20fd06fae7e84b1`
3. Browser-based terminal opens

---

## 📦 What We're Deploying

### Module Summary

| # | Module | Tables | Endpoints | Status | Priority |
|---|--------|--------|-----------|--------|----------|
| 1 | Multi-Entity | 6 | 11 | ✅ Ready | 🔴 CRITICAL (dependency) |
| 2 | Reports & Analytics | 15 | 14 | ✅ Ready | 🟡 High |
| 3 | Treasury Management | 12 | 11 | ✅ Ready | 🟡 High |
| 4 | AI Agents | 8 | 20+ | ✅ Ready | 🟡 High |
| 5 | Healthcare Operations | 18 | 45 | ✅ Ready | 🟢 Medium |
| 6 | Super Admin Portal | 6 | 23 | ✅ Ready | 🔴 CRITICAL |
| **TOTAL** | **6 modules** | **65 tables** | **124+ endpoints** | - | - |

---

## 🗂️ Deployment Package Structure

```
deployment-november-2025/
├── 01-migrations/
│   ├── 001_multi_entity.sql                    # DEPLOY FIRST
│   ├── 002_reports_analytics.sql
│   ├── 003_treasury_management.sql
│   ├── 004_ai_agents.sql
│   ├── 005_healthcare_operations.sql
│   └── 006_super_admin_portal.sql
├── 02-controllers/
│   ├── multi-entity.controller.ts
│   ├── reports.controller.ts
│   ├── treasury.controller.ts
│   ├── ai-assistant.controller.ts
│   ├── healthcare.controller.ts
│   └── superadmin.controller.ts
├── 03-routes/
│   ├── multi-entity.routes.ts
│   ├── reports.routes.ts
│   ├── treasury.routes.ts
│   ├── ai-assistant.routes.ts
│   ├── healthcare.routes.ts
│   └── superadmin.routes.ts
├── 04-services/
│   └── ai-assistant.service.ts
├── 05-config/
│   └── index.ts.updated                        # Updated with new routes
├── DEPLOY.sh                                    # Master deployment script
├── ROLLBACK.sh                                  # Emergency rollback
├── TEST-ENDPOINTS.sh                            # Verify deployment
└── README.md                                    # This file
```

---

## 🚀 DEPLOYMENT STEPS

### Pre-Deployment Checklist
- [ ] SSH access working (or using EC2 Instance Connect)
- [ ] Database backup created
- [ ] Current system status documented
- [ ] PM2 processes identified
- [ ] Environment variables verified

### Step 1: Create Database Backup (CRITICAL!)

```bash
# Connect to server (via SSH or EC2 Instance Connect)
ssh ec2-user@51.21.219.35

# Create backup
pg_dump -h <RDS_ENDPOINT> -U worldclass_erp_user -d worldclass_erp_db \
  > backup_pre_deployment_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -lh backup_pre_deployment_*.sql
```

### Step 2: Check Current System Status

```bash
# Check if backend is running
pm2 status

# Check current database structure
psql -h <RDS_ENDPOINT> -U worldclass_erp_user -d worldclass_erp_db \
  -c "\dt" | grep -E "entities|reports|treasury|ai_|healthcare|support_tickets"

# Test current API
curl http://localhost:3000/api/health
```

### Step 3: Upload Deployment Files

**Option A: Using SCP (if SSH working)**
```bash
# From your local machine
cd "/Users/sibusisomavuso/Desktop/Worldclass ERP Software"

# Upload migrations
scp backend/database/migrations/017_multi_entity.sql \
    backend/database/migrations/018_reports_analytics.sql \
    backend/database/migrations/019_treasury_management.sql \
    backend/database/migrations/020_healthcare_operations_module.sql \
    backend/database/migrations/021_super_admin_portal.sql \
    ec2-user@51.21.219.35:/tmp/

# Upload controllers
scp backend/src/controllers/multi-entity.controller.ts \
    backend/src/controllers/reports.controller.ts \
    backend/src/controllers/treasury.controller.ts \
    backend/src/controllers/ai-assistant.controller.ts \
    backend/src/controllers/healthcare.controller.ts \
    backend/src/controllers/superadmin.controller.ts \
    ec2-user@51.21.219.35:/tmp/

# Upload routes
scp backend/src/routes/multi-entity.routes.ts \
    backend/src/routes/reports.routes.ts \
    backend/src/routes/treasury.routes.ts \
    backend/src/routes/ai-assistant.routes.ts \
    backend/src/routes/healthcare.routes.ts \
    backend/src/routes/superadmin.routes.ts \
    ec2-user@51.21.219.35:/tmp/

# Upload service
scp backend/src/services/ai-assistant.service.ts \
    ec2-user@51.21.219.35:/tmp/

# Upload updated index.ts
scp backend/src/index.ts ec2-user@51.21.219.35:/tmp/index.ts.new
```

**Option B: Using AWS S3 (if SSH blocked)**
```bash
# Upload to S3 bucket
aws s3 cp backend/database/migrations/ s3://your-bucket/deployment-nov-2025/migrations/ --recursive
aws s3 cp backend/src/controllers/ s3://your-bucket/deployment-nov-2025/controllers/ --recursive
aws s3 cp backend/src/routes/ s3://your-bucket/deployment-nov-2025/routes/ --recursive

# Then on server
aws s3 sync s3://your-bucket/deployment-nov-2025/ /tmp/deployment/
```

**Option C: Using EC2 Instance Connect Terminal**
```bash
# In browser terminal, use curl to download from GitHub/S3
# Or paste files directly using nano/vim
```

### Step 4: Run Database Migrations

```bash
# On server (as ec2-user)
cd /var/www/backend  # Or wherever your app is

# Get database credentials
echo $DATABASE_URL

# Run migrations IN ORDER
psql $DATABASE_URL -f /tmp/017_multi_entity.sql
psql $DATABASE_URL -f /tmp/018_reports_analytics.sql  
psql $DATABASE_URL -f /tmp/019_treasury_management.sql
psql $DATABASE_URL -f /tmp/020_healthcare_operations_module.sql
psql $DATABASE_URL -f /tmp/021_super_admin_portal.sql

# Verify migrations
psql $DATABASE_URL -c "\dt" | grep -E "entities|reports|treasury|healthcare|support_tickets"
```

### Step 5: Deploy Backend Code

```bash
# On server
cd /var/www/backend  # Your backend directory

# Backup current code
cp -r src src.backup.$(date +%Y%m%d_%H%M%S)

# Copy new controllers
cp /tmp/multi-entity.controller.ts src/controllers/
cp /tmp/reports.controller.ts src/controllers/
cp /tmp/treasury.controller.ts src/controllers/
cp /tmp/ai-assistant.controller.ts src/controllers/
cp /tmp/healthcare.controller.ts src/controllers/
cp /tmp/superadmin.controller.ts src/controllers/

# Copy new routes
cp /tmp/multi-entity.routes.ts src/routes/
cp /tmp/reports.routes.ts src/routes/
cp /tmp/treasury.routes.ts src/routes/
cp /tmp/ai-assistant.routes.ts src/routes/
cp /tmp/healthcare.routes.ts src/routes/
cp /tmp/superadmin.routes.ts src/routes/

# Copy service
cp /tmp/ai-assistant.service.ts src/services/

# Update index.ts
cp /tmp/index.ts.new src/index.ts

# Install AI dependencies (if not already installed)
npm install openai @anthropic-ai/sdk

# Build
npm run build

# Check for errors
echo "Exit code: $?"
```

### Step 6: Restart Application

```bash
# Restart PM2 processes
pm2 restart all

# Check status
pm2 status

# Check logs for errors
pm2 logs --lines 50
```

### Step 7: Verify Deployment

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test new module endpoints (will need JWT token)
# Multi-Entity
curl http://localhost:3000/api/entities

# Reports
curl http://localhost:3000/api/reports

# Treasury
curl http://localhost:3000/api/treasury/accounts

# AI Agents
curl http://localhost:3000/api/ai/agents

# Healthcare
curl http://localhost:3000/api/healthcare/facilities

# Super Admin
curl http://localhost:3000/api/super-admin/system/health
```

---

## 🧪 Testing Checklist

### Database Verification
- [ ] All 65 new tables exist
- [ ] Foreign key constraints valid
- [ ] Indexes created
- [ ] Views created (for Reports, Super Admin)
- [ ] Sample data inserted where applicable

### API Verification
- [ ] All 124+ endpoints respond
- [ ] Authentication working
- [ ] Tenant isolation enforced
- [ ] Error handling works
- [ ] Response times acceptable (<500ms)

### Module-Specific Tests

**Multi-Entity** (11 endpoints)
- [ ] GET /api/entities - List entities
- [ ] POST /api/entities - Create entity
- [ ] GET /api/entities/:id/permissions - Get permissions
- [ ] POST /api/entities/inter-company-transaction - Create transaction

**Reports & Analytics** (14 endpoints)
- [ ] GET /api/reports - List reports
- [ ] POST /api/reports/execute - Run report
- [ ] GET /api/reports/dashboards - List dashboards
- [ ] POST /api/reports/export - Export data

**Treasury** (11 endpoints)
- [ ] GET /api/treasury/accounts - List accounts
- [ ] POST /api/treasury/cash-forecast - Create forecast
- [ ] GET /api/treasury/fx-rates - Get exchange rates
- [ ] POST /api/treasury/investments - Record investment

**AI Agents** (20+ endpoints)
- [ ] GET /api/ai/agents - List agents
- [ ] POST /api/ai/chat - Send message
- [ ] GET /api/ai/conversations - List conversations
- [ ] POST /api/ai/sales/analyze - Sales analysis

**Healthcare** (45 endpoints)
- [ ] GET /api/healthcare/facilities - List facilities
- [ ] GET /api/healthcare/facilities/:id/dashboard/command-center - Dashboard
- [ ] POST /api/healthcare/patients - Create patient
- [ ] POST /api/healthcare/patients/:id/vitals - Record vitals

**Super Admin** (23 endpoints)
- [ ] GET /api/super-admin/tenants - List tenants
- [ ] GET /api/super-admin/system/health - System health
- [ ] POST /api/super-admin/tenants/:id/impersonate - Impersonate
- [ ] GET /api/super-admin/tickets - Support tickets

---

## 🚨 Troubleshooting

### Issue: Migration fails with "relation already exists"
**Solution**: Table was already created. Check if previous migration partially ran.
```sql
-- Check existing tables
\dt entities*
\dt reports*
-- If tables exist but migration failed, manually complete remaining statements
```

### Issue: TypeScript build fails
**Solution**: Check for missing dependencies
```bash
npm install
npm run build 2>&1 | grep error
```

### Issue: PM2 restart fails
**Solution**: Check logs and process status
```bash
pm2 logs --err
pm2 describe <process-name>
# If stuck, use pm2 delete and start fresh
pm2 delete all
pm2 start ecosystem.config.js
```

### Issue: Endpoints return 404
**Solution**: Routes not registered
```bash
# Check if routes are imported in index.ts
grep -E "reports|treasury|healthcare|superadmin" src/index.ts
# Rebuild
npm run build
pm2 restart all
```

### Issue: Database connection fails
**Solution**: Check environment variables
```bash
echo $DATABASE_URL
# Or check .env file
cat .env | grep DATABASE
```

---

## 🔄 Rollback Procedure (If Something Goes Wrong)

### Step 1: Stop Application
```bash
pm2 stop all
```

### Step 2: Restore Database
```bash
psql $DATABASE_URL < backup_pre_deployment_YYYYMMDD_HHMMSS.sql
```

### Step 3: Restore Code
```bash
cd /var/www/backend
rm -rf src
mv src.backup.YYYYMMDD_HHMMSS src
npm run build
```

### Step 4: Restart
```bash
pm2 restart all
```

---

## 📊 Post-Deployment Monitoring

### First Hour
- Monitor PM2 logs: `pm2 logs`
- Watch error rates in database
- Test critical user workflows
- Monitor server resources: `htop`

### First Day
- Check all module endpoints
- Review audit logs
- Monitor database performance
- Test integrations between modules

### First Week
- User acceptance testing
- Performance optimization
- Address any bugs
- Update documentation

---

## 📞 Emergency Contacts

**If deployment goes wrong**:
1. Run rollback procedure (above)
2. Document what happened
3. Check logs: `pm2 logs --err`
4. Review database state
5. Contact DevOps if infrastructure issue

---

## ✅ Success Criteria

- [ ] All 6 modules deployed successfully
- [ ] All 124+ endpoints responding
- [ ] No TypeScript errors in build
- [ ] PM2 processes healthy
- [ ] Database migrations completed
- [ ] Sample data accessible
- [ ] User login works
- [ ] Tenant isolation verified
- [ ] Performance acceptable
- [ ] Logs showing no critical errors

---

## 🎯 Next Steps After Deployment

1. **Immediate** (Today):
   - Smoke test all endpoints
   - Verify tenant isolation
   - Test authentication
   - Check error rates

2. **Short Term** (This Week):
   - Full user acceptance testing
   - Performance tuning
   - Documentation updates
   - Train support team on Super Admin Portal

3. **Medium Term** (This Month):
   - Monitor usage patterns
   - Optimize slow queries
   - Add missing features based on feedback
   - Plan Phase 2 features

---

## 📝 Deployment Log Template

```
DEPLOYMENT LOG - November 13, 2025
=====================================

Start Time: __________
End Time: __________
Deployed By: __________
Server: 51.21.219.35

Pre-Deployment:
[ ] Backup created: __________
[ ] Current PM2 status: __________
[ ] Database tables before: __________

Deployment Steps:
[ ] Migrations run: __________
[ ] Build completed: __________
[ ] PM2 restarted: __________

Post-Deployment:
[ ] Endpoints tested: __________
[ ] Errors detected: __________
[ ] Performance: __________

Issues Encountered:
__________________________________________

Resolutions:
__________________________________________

Final Status: SUCCESS / PARTIAL / FAILED
Notes:
__________________________________________
```

---

**LET'S DEPLOY! 🚀**
