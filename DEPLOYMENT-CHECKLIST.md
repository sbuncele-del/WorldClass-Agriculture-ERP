# ✅ DEPLOYMENT CHECKLIST - November 13, 2025

**Goal**: Deploy 6 new modules to production TODAY  
**Method**: AWS EC2 Instance Connect (browser terminal)  
**Target**: 51.21.219.35 (i-0b20fd06fae7e84b1)

---

## PHASE 1: ACCESS SERVER ⏱️ 5 min

- [ ] Open AWS Console
- [ ] Navigate to EC2 → Instances
- [ ] Select instance `i-0b20fd06fae7e84b1`
- [ ] Click **"Connect"** button
- [ ] Choose **"EC2 Instance Connect"** tab
- [ ] Username: `ec2-user`
- [ ] Click **"Connect"**
- [ ] Browser terminal opens ✅

**Test**: `whoami` should show `ec2-user`

---

## PHASE 2: PREPARE FILES ⏱️ 15-30 min

### Option A: Manual File Creation (if no other method available)
For each file below, use `nano` or `vim` to create and paste content:

```bash
nano /tmp/017_multi_entity.sql
# Paste content, Ctrl+X, Y, Enter
```

### Option B: GitHub Gist (Recommended - Fast!)
1. Create private gists on GitHub with each file
2. Get raw URLs
3. Download to server:
```bash
curl -o /tmp/017_multi_entity.sql https://gist.githubusercontent.com/.../raw/...
```

### Option C: S3 Bucket (if available)
```bash
aws s3 sync s3://your-bucket/deployment/ /tmp/
```

### Files to Upload (19 total):

**Migrations** ⏱️ 10 min
- [ ] `017_multi_entity.sql` → `/tmp/`
- [ ] `018_reports_analytics.sql` → `/tmp/`
- [ ] `019_treasury_management.sql` → `/tmp/`
- [ ] `020_healthcare_operations_module.sql` → `/tmp/`
- [ ] `021_super_admin_portal.sql` → `/tmp/`

**Controllers** ⏱️ 10 min
- [ ] `multi-entity.controller.ts` → `/tmp/`
- [ ] `reports.controller.ts` → `/tmp/`
- [ ] `treasury.controller.ts` → `/tmp/`
- [ ] `ai-assistant.controller.ts` → `/tmp/`
- [ ] `healthcare.controller.ts` → `/tmp/`
- [ ] `superadmin.controller.ts` → `/tmp/`

**Routes** ⏱️ 5 min
- [ ] `multi-entity.routes.ts` → `/tmp/`
- [ ] `reports.routes.ts` → `/tmp/`
- [ ] `treasury.routes.ts` → `/tmp/`
- [ ] `ai-assistant.routes.ts` → `/tmp/`
- [ ] `healthcare.routes.ts` → `/tmp/`
- [ ] `superadmin.routes.ts` → `/tmp/`

**Services** ⏱️ 2 min
- [ ] `ai-assistant.service.ts` → `/tmp/`

**Config** ⏱️ 2 min
- [ ] `index.ts` (updated) → `/tmp/index.ts.new`

**Verify files uploaded**:
```bash
ls -lh /tmp/*.sql /tmp/*.ts
# Should show 19 files
```

---

## PHASE 3: BACKUP ⏱️ 5 min

```bash
# Go to backend directory
cd /var/www/backend
# Or: cd /home/ec2-user/backend

# Load environment variables
export $(grep -v '^#' .env | xargs)
echo $DATABASE_URL  # Should show database connection string

# Create database backup
pg_dump $DATABASE_URL > /tmp/backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup created
ls -lh /tmp/backup_*.sql

# Backup current code
cp -r src src.backup.$(date +%Y%m%d_%H%M%S)
ls -d src.backup.*
```

**Critical**: Don't proceed without successful backups! ⚠️

---

## PHASE 4: DATABASE MIGRATIONS ⏱️ 10 min

**Run migrations IN ORDER** (multi-entity must be first!):

```bash
# 1. Multi-Entity (CRITICAL - other modules depend on this)
echo "Running Multi-Entity migration..."
psql $DATABASE_URL -f /tmp/017_multi_entity.sql
# Check: Should see "CREATE TABLE" statements

# 2. Reports & Analytics
echo "Running Reports migration..."
psql $DATABASE_URL -f /tmp/018_reports_analytics.sql

# 3. Treasury Management
echo "Running Treasury migration..."
psql $DATABASE_URL -f /tmp/019_treasury_management.sql

# 4. Healthcare Operations
echo "Running Healthcare migration..."
psql $DATABASE_URL -f /tmp/020_healthcare_operations_module.sql

# 5. Super Admin Portal
echo "Running Super Admin migration..."
psql $DATABASE_URL -f /tmp/021_super_admin_portal.sql
```

**Verify migrations**:
```bash
# Check for new tables
psql $DATABASE_URL -c "\dt" | grep -E "entities|reports|treasury|healthcare|support_tickets"

# Should see tables like:
# - entities
# - entity_relationships
# - reports_library
# - treasury_accounts
# - healthcare_facilities
# - support_tickets
```

**Success indicators**:
- [ ] No error messages
- [ ] New tables visible in `\dt` output
- [ ] Each migration script completed without errors

---

## PHASE 5: DEPLOY CODE ⏱️ 10 min

```bash
cd /var/www/backend

# Copy controllers
cp /tmp/multi-entity.controller.ts src/controllers/
cp /tmp/reports.controller.ts src/controllers/
cp /tmp/treasury.controller.ts src/controllers/
cp /tmp/ai-assistant.controller.ts src/controllers/
cp /tmp/healthcare.controller.ts src/controllers/
cp /tmp/superadmin.controller.ts src/controllers/

# Copy routes  
cp /tmp/multi-entity.routes.ts src/routes/
cp /tmp/reports.routes.ts src/routes/
cp /tmp/treasury.routes.ts src/routes/
cp /tmp/ai-assistant.routes.ts src/routes/
cp /tmp/healthcare.routes.ts src/routes/
cp /tmp/superadmin.routes.ts src/routes/

# Copy service
mkdir -p src/services
cp /tmp/ai-assistant.service.ts src/services/

# Update index.ts
cp /tmp/index.ts.new src/index.ts

# Verify files copied
ls src/controllers/multi-entity.controller.ts
ls src/routes/healthcare.routes.ts
ls src/services/ai-assistant.service.ts
```

**Success indicators**:
- [ ] All files copied without errors
- [ ] No "file not found" messages

---

## PHASE 6: BUILD ⏱️ 5 min

```bash
cd /var/www/backend

# Install AI dependencies (if not already installed)
npm install openai @anthropic-ai/sdk

# Build TypeScript
echo "Building..."
npm run build

# Check exit code
echo "Exit code: $?"
# Should be 0 (success)
```

**Watch for**:
- ❌ TypeScript errors → Fix before proceeding
- ✅ "Compilation complete" → Good to go!

**Common issues**:
- Missing imports → Check file names match
- Type errors → May need to adjust controller signatures

---

## PHASE 7: RESTART ⏱️ 2 min

```bash
# If using PM2
pm2 restart all
pm2 status
# All processes should show "online" in green

# If using systemd
sudo systemctl restart worldclass-erp
sudo systemctl status worldclass-erp
```

**Success indicators**:
- [ ] PM2 shows processes as "online"
- [ ] No restart errors
- [ ] Uptime resets to 0s

---

## PHASE 8: VERIFY DEPLOYMENT ⏱️ 5 min

### A. Test Health Endpoint
```bash
curl http://localhost:3000/api/health
# Should return {"status":"ok"} or similar
```

### B. Test New Module Endpoints
```bash
# These will return 401 (needs auth) - that's GOOD! Route exists.
# 404 = BAD (route not found)

curl -I http://localhost:3000/api/entities
curl -I http://localhost:3000/api/reports
curl -I http://localhost:3000/api/treasury/accounts
curl -I http://localhost:3000/api/ai/agents
curl -I http://localhost:3000/api/healthcare/facilities
curl -I http://localhost:3000/api/super-admin/system/health
```

**Expected**: HTTP 401 (Unauthorized) or 403 (Forbidden) = ✅ Route exists  
**Bad**: HTTP 404 (Not Found) = ❌ Route missing

### C. Check Logs
```bash
# Look for errors
pm2 logs --err --lines 50

# Look for startup messages
pm2 logs --lines 50 | grep -E "Server running|initialized|registered"
```

**Success indicators**:
- [ ] Health endpoint responds
- [ ] All 6 new endpoints return 401/403 (not 404)
- [ ] No critical errors in logs
- [ ] Server startup messages visible

---

## PHASE 9: SMOKE TESTS ⏱️ 10 min

### Get JWT Token
```bash
# From another terminal or Postman
curl -X POST http://51.21.219.35:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}'

# Copy the token
```

### Test Each Module
```bash
TOKEN="your-jwt-token-here"

# Multi-Entity
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/entities

# Reports
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/reports

# Treasury
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/treasury/accounts

# AI Agents
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/ai/agents

# Healthcare
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/healthcare/facilities

# Super Admin (needs super admin role)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/super-admin/system/health
```

**Success indicators**:
- [ ] Endpoints return JSON data (not HTML error pages)
- [ ] No 500 Internal Server Error
- [ ] Data structures look correct

---

## 🚨 ROLLBACK PROCEDURE (If Needed)

### If Database Issues:
```bash
# Find backup
ls -lh /tmp/backup_*.sql

# Restore
psql $DATABASE_URL < /tmp/backup_YYYYMMDD_HHMMSS.sql
```

### If Code Issues:
```bash
cd /var/www/backend
rm -rf src
mv src.backup.YYYYMMDD_HHMMSS src
npm run build
pm2 restart all
```

---

## ✅ FINAL CHECKLIST

- [ ] All 5 migrations ran successfully
- [ ] 65 new database tables exist
- [ ] All 19 code files deployed
- [ ] TypeScript build succeeded (exit code 0)
- [ ] PM2 processes restarted and online
- [ ] Health endpoint responds
- [ ] All 6 module endpoints accessible (401/403, not 404)
- [ ] No critical errors in logs
- [ ] Backups created and verified

---

## 📊 DEPLOYMENT SUMMARY

**Modules Deployed**:
- ✅ Multi-Entity Management (11 endpoints)
- ✅ Reports & Analytics (14 endpoints)
- ✅ Treasury Management (11 endpoints)
- ✅ AI Agents & Assistants (20+ endpoints)
- ✅ Healthcare Operations (45 endpoints)
- ✅ Super Admin Portal (23 endpoints)

**Total**: 124+ new endpoints  
**Database**: 65 new tables  
**Code**: 19 new files

---

## 🎯 POST-DEPLOYMENT

**Immediate** (Next 1 hour):
- [ ] Monitor PM2 logs: `pm2 logs`
- [ ] Watch for errors
- [ ] Test critical user workflows
- [ ] Check database performance

**Today**:
- [ ] Full user acceptance testing
- [ ] Test integration between modules
- [ ] Verify tenant isolation working
- [ ] Performance testing

**This Week**:
- [ ] Train support team on Super Admin Portal
- [ ] Document any issues found
- [ ] Optimize slow queries
- [ ] Plan Phase 2 features

---

## 📞 SUPPORT

**If deployment fails**:
1. Check PM2 logs: `pm2 logs --err`
2. Check database connection: `psql $DATABASE_URL -c "SELECT 1"`
3. Verify files uploaded: `ls -lh /tmp/`
4. Check build errors: `npm run build 2>&1 | grep error`
5. Rollback if needed (see above)

**Estimated Total Time**: 60-90 minutes

**LET'S DEPLOY! 🚀**
