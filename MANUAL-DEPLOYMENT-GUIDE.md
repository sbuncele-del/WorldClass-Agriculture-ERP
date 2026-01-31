# Manual Deployment Guide - Compliance Module

**Date:** November 13, 2025  
**Status:** SSH Port Opened in Security Group - Waiting for Access

---

## Current Situation

✅ **Port 22 opened** in security group `aetheros-db-sg`  
✅ **Backend is running** (port 3000 responds with health check)  
✅ **All code is ready** (44 tables, 3 controllers, compiled)  
❌ **SSH still timing out** (may need time to propagate or instance firewall issue)

---

## Option 1: Wait for SSH Access (Recommended)

Once SSH is accessible, run:

```bash
cd "/Users/sibusisomavuso/Desktop/Worldclass ERP Software "
./deploy-compliance-module.sh
```

---

## Option 2: Manual Step-by-Step Deployment

If SSH becomes available, here are the manual commands:

### Step 1: Deploy Database Schema

```bash
# SSH into EC2
ssh ubuntu@51.21.219.35

# Navigate to migrations
cd /home/ubuntu/worldclass-erp/backend/database/migrations

# Deploy schema
PGPASSWORD="Worldclass2025" psql \
  -h aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com \
  -U worldclass_admin \
  -d aetheros_erp \
  -f 015_compliance_governance_module.sql

# Verify tables created
PGPASSWORD="Worldclass2025" psql \
  -h aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com \
  -U worldclass_admin \
  -d aetheros_erp \
  -c "\dt" | grep -E "regulatory|risk|sars|audit|compliance"
```

### Step 2: Upload Controller Files

**From your local machine:**

```bash
# Upload compliance controller
scp "/Users/sibusisomavuso/Desktop/Worldclass ERP Software /backend/src/controllers/compliance.controller.ts" \
  ubuntu@51.21.219.35:/home/ubuntu/worldclass-erp/backend/src/controllers/

# Upload SARS Sentinel controller
scp "/Users/sibusisomavuso/Desktop/Worldclass ERP Software /backend/src/controllers/sars-sentinel.controller.ts" \
  ubuntu@51.21.219.35:/home/ubuntu/worldclass-erp/backend/src/controllers/

# Upload Audit-Ready controller
scp "/Users/sibusisomavuso/Desktop/Worldclass ERP Software /backend/src/controllers/audit-ready.controller.ts" \
  ubuntu@51.21.219.35:/home/ubuntu/worldclass-erp/backend/src/controllers/
```

### Step 3: Upload Route Files

```bash
# Upload compliance routes
scp "/Users/sibusisomavuso/Desktop/Worldclass ERP Software /backend/src/routes/compliance.routes.ts" \
  ubuntu@51.21.219.35:/home/ubuntu/worldclass-erp/backend/src/routes/

# Upload SARS Sentinel routes
scp "/Users/sibusisomavuso/Desktop/Worldclass ERP Software /backend/src/routes/sars-sentinel.routes.ts" \
  ubuntu@51.21.219.35:/home/ubuntu/worldclass-erp/backend/src/routes/

# Upload Audit-Ready routes
scp "/Users/sibusisomavuso/Desktop/Worldclass ERP Software /backend/src/routes/audit-ready.routes.ts" \
  ubuntu@51.21.219.35:/home/ubuntu/worldclass-erp/backend/src/routes/
```

### Step 4: Upload Main App File

```bash
scp "/Users/sibusisomavuso/Desktop/Worldclass ERP Software /backend/src/index.ts" \
  ubuntu@51.21.219.35:/home/ubuntu/worldclass-erp/backend/src/
```

### Step 5: Build and Restart

**SSH into EC2 again:**

```bash
ssh ubuntu@51.21.219.35

# Navigate to backend
cd /home/ubuntu/worldclass-erp/backend

# Install dependencies (if needed)
npm install

# Build TypeScript
npm run build

# Check for errors
echo "Build exit code: $?"

# Restart PM2
pm2 restart aetheros-backend

# Check status
pm2 list
pm2 logs aetheros-backend --lines 50
```

### Step 6: Verify Deployment

**Test endpoints:**

```bash
# From local machine or EC2

# Test 1: Regulatory Frameworks
curl http://51.21.219.35:3000/api/compliance/frameworks

# Test 2: SARS Dashboard Stats
curl http://51.21.219.35:3000/api/sars-sentinel/dashboard/stats

# Test 3: SARS Correspondence Types
curl http://51.21.219.35:3000/api/sars-sentinel/correspondence-types

# Test 4: Audit Checklist Templates
curl http://51.21.219.35:3000/api/audit/checklist-templates

# Test 5: Risk Categories
curl http://51.21.219.35:3000/api/compliance/risk-categories
```

---

## Option 3: Alternative - Upload Schema File First

If you can get into the instance via EC2 Instance Connect or AWS Console:

1. **Upload the schema file to S3 or use EC2 Instance Connect file upload**

2. **Once on EC2, run:**
   ```bash
   cd /home/ubuntu/worldclass-erp/backend/database/migrations
   
   # If you uploaded to S3
   aws s3 cp s3://your-bucket/015_compliance_governance_module.sql .
   
   # Deploy schema
   PGPASSWORD="Worldclass2025" psql \
     -h aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com \
     -U worldclass_admin \
     -d aetheros_erp \
     -f 015_compliance_governance_module.sql
   ```

---

## Troubleshooting SSH Connection

If SSH still doesn't work after waiting, check:

### 1. Network ACLs
```
AWS Console → VPC → Network ACLs
Check if inbound/outbound rules allow port 22
```

### 2. Instance Firewall (from EC2 Instance Connect if you can access it)
```bash
# Check if ufw is active
sudo ufw status

# If blocking, allow SSH
sudo ufw allow 22/tcp

# Or check iptables
sudo iptables -L -n | grep 22
```

### 3. SSH Service Status
```bash
# Check if SSH is running
sudo systemctl status sshd

# Restart if needed
sudo systemctl restart sshd
```

### 4. Security Group Source IP
Your current IP shown in security group: `102.141.188.164/32`

Check your actual IP:
```bash
curl ifconfig.me
```

If different, update security group to match.

---

## Files Ready for Deployment

### Database
- ✅ `015_compliance_governance_module.sql` (2,500 lines, 44 tables)

### Controllers (1,600+ lines total)
- ✅ `compliance.controller.ts` (600 lines, 17 methods)
- ✅ `sars-sentinel.controller.ts` (400 lines, 13 methods)
- ✅ `audit-ready.controller.ts` (600 lines, 14 methods)

### Routes (300+ lines total)
- ✅ `compliance.routes.ts` (18 endpoints)
- ✅ `sars-sentinel.routes.ts` (13 endpoints)
- ✅ `audit-ready.routes.ts` (13 endpoints)

### Integration
- ✅ `index.ts` (updated with route registrations)

---

## Expected Results After Deployment

### Database
- 44 new tables in `aetheros_erp` database
- 100+ pre-populated reference records
- 16 SA regulatory frameworks
- 16 SARS correspondence types
- 10 risk categories
- 6 audit checklist templates

### API Endpoints
- 18 compliance endpoints active
- 13 SARS Sentinel endpoints active
- 13 Audit-Ready endpoints active
- **Total: 44 new endpoints**

### Verification Queries

```sql
-- Count new tables
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%compliance%' 
OR table_name LIKE '%sars%' 
OR table_name LIKE '%audit%';

-- Check regulatory frameworks
SELECT * FROM regulatory_frameworks;

-- Check SARS types
SELECT * FROM sars_correspondence_types;

-- Check audit templates
SELECT * FROM audit_checklist_templates;
```

---

## Next Steps After Successful Deployment

1. ✅ Mark Compliance Module as deployed in todo list
2. 📊 Begin Reports & Analytics Module
3. 💰 Then Treasury Management Module
4. 🚚 Then Industry-Specific Modules
5. 🎨 Frontend integration for Compliance/SARS dashboards

---

## Contact Points

- **EC2 IP:** 51.21.219.35
- **Backend Port:** 3000
- **RDS Endpoint:** aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com
- **Database:** aetheros_erp
- **SSH User:** ubuntu

---

**Status:** Awaiting SSH access or alternative deployment method
