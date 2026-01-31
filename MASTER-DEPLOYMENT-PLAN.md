# 🚀 MASTER DEPLOYMENT PLAN - Worldclass ERP Software
**Date:** November 13, 2025  
**Target Environment:** AWS (RDS + EC2 + S3)  
**Deployment Strategy:** Phased rollout with validation gates

---

## 📋 DEPLOYMENT OVERVIEW

### Current Status
- ✅ **Frontend:** Deployed to S3 (10 modules, 42+ pages)
- ⏳ **Backend:** Partially deployed, needs module-by-module deployment
- ⏳ **Database:** Some migrations run, needs complete multi-tenant setup

### Deployment Phases
1. **Phase 1:** Multi-Tenant Foundation (CRITICAL)
2. **Phase 2:** Core Financial Modules
3. **Phase 3:** HR & Payroll (RSA Compliance)
4. **Phase 4:** Operations Modules (Manufacturing, Warehouse, Logistics)
5. **Phase 5:** Specialized Modules (Healthcare, SARS Sentinel)
6. **Phase 6:** Integration & Testing
7. **Phase 7:** Production Cutover

---

## 🎯 PHASE 1: MULTI-TENANT FOUNDATION (Day 1-2)

### Objective
Establish multi-tenant architecture as foundation for all modules

### Prerequisites
- [x] Multi-tenant schema designed
- [x] Demo tenant structure defined
- [ ] RDS connection verified
- [ ] EC2 access confirmed

### Deployment Steps

#### Step 1.1: Database Schema Deployment
```bash
# Connect to EC2
ssh -i ~/.ssh/aetheros-aws.pem ec2-user@51.21.219.35

# Create deployment directory
mkdir -p ~/deployments/phase-1-multi-tenant
cd ~/deployments/phase-1-multi-tenant

# Copy SQL file (run from local machine)
scp -i ~/.ssh/aetheros-aws.pem \
  backend/src/config/multi-tenant-schema.sql \
  ec2-user@51.21.219.35:~/deployments/phase-1-multi-tenant/
```

#### Step 1.2: Run Multi-Tenant Migration
```bash
# On EC2 instance
export DB_URL="postgresql://postgres:caxMex-0putca-dyjnah@aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com:5432/aetheros_erp"

# Backup first
pg_dump "$DB_URL" > backup-pre-multitenant-$(date +%Y%m%d-%H%M%S).sql

# Run migration
psql "$DB_URL" -f multi-tenant-schema.sql

# Verify
psql "$DB_URL" << EOF
-- Check core tables created
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('tenants', 'users', 'demo_tenants', 'refresh_tokens', 'audit_log');

-- Check tenant_id columns added
SELECT COUNT(*) as tables_with_tenant_id 
FROM information_schema.columns 
WHERE column_name = 'tenant_id';

-- Verify demo tenant
SELECT id, name, slug, status FROM tenants WHERE slug = 'demo';

-- Verify demo user
SELECT id, email, role, status FROM users WHERE email = 'demo@aetheros.co.za';
EOF
```

#### Step 1.3: Validation Checklist
- [ ] `tenants` table exists with demo tenant
- [ ] `users` table exists with demo user
- [ ] All 100+ tables have `tenant_id` column
- [ ] Indexes created (30+ tenant indexes)
- [ ] Demo tenant can authenticate
- [ ] Row-Level Security (RLS) policies active

#### Step 1.4: Backend Middleware Deployment
```bash
# Deploy tenant middleware to EC2
cd backend
npm install
npm run build

# Start backend with multi-tenant support
pm2 start dist/server.js --name "erp-backend-multitenant"
pm2 save
```

### Success Criteria
✅ Demo tenant can login  
✅ Tenant isolation verified (queries filtered by tenant_id)  
✅ Audit log capturing all actions  
✅ No data leakage between tenants  

### Rollback Plan
```sql
-- Restore from backup
psql "$DB_URL" < backup-pre-multitenant-[timestamp].sql
```

---

## 🎯 PHASE 2: CORE FINANCIAL MODULES (Day 3-4)

### Modules to Deploy
1. General Ledger
2. Chart of Accounts
3. Journal Entries
4. Trial Balance
5. Financial Statements
6. Cash Management

### Deployment Steps

#### Step 2.1: Deploy Financial Migrations
```bash
# On EC2
cd ~/deployments/phase-2-financial
psql "$DB_URL" -f ../backend/database/migrations/011_financial_accounting_module.sql
```

#### Step 2.2: Deploy Financial APIs
```bash
# Backend routes to enable:
- GET    /api/financial/chart-of-accounts
- POST   /api/financial/chart-of-accounts
- GET    /api/financial/journal-entries
- POST   /api/financial/journal-entries (with double-entry validation)
- GET    /api/financial/trial-balance
- GET    /api/financial/income-statement
- GET    /api/financial/balance-sheet
- GET    /api/financial/cash-flow
```

#### Step 2.3: Seed Demo Data
```sql
-- Insert demo COA (IFRS template)
INSERT INTO chart_of_accounts (tenant_id, account_code, account_name, account_type, ...)
VALUES 
  ('00000000-0000-0000-0000-000000000001', '1000', 'Cash and Cash Equivalents', 'ASSET', ...),
  ('00000000-0000-0000-0000-000000000001', '1100', 'Accounts Receivable', 'ASSET', ...),
  -- ... 50+ standard accounts
```

#### Step 2.4: Validation
- [ ] COA displays in frontend
- [ ] Can create journal entries
- [ ] Double-entry validation works
- [ ] Trial balance balances (debits = credits)
- [ ] Financial statements generate correctly
- [ ] Period close works

### Success Criteria
✅ Full accounting cycle functional  
✅ Financial statements accurate  
✅ Multi-currency support working  

---

## 🎯 PHASE 3: HR & PAYROLL (RSA COMPLIANCE) (Day 5-6)

### Modules to Deploy
1. Employee Management
2. Payroll Processing (PAYE, UIF, SDL)
3. Leave Management (BCEA)
4. RSA Compliance Tracking

### Deployment Steps

#### Step 3.1: Deploy HR Migrations
```bash
psql "$DB_URL" -f ../backend/database/migrations/012_hr_payroll_module.sql
```

#### Step 3.2: Configure RSA Tax Tables
```sql
-- PAYE Tax Brackets 2024/2025
INSERT INTO tax_brackets (tenant_id, tax_year, income_from, income_to, base_tax, tax_rate)
VALUES
  ('00000000-0000-0000-0000-000000000001', 2025, 0, 237100, 0, 0.18),
  ('00000000-0000-0000-0000-000000000001', 2025, 237101, 370500, 42678, 0.26),
  -- ... full SARS tax table
```

#### Step 3.3: Deploy HR APIs
```bash
# Backend routes:
- GET/POST  /api/hr/employees
- GET/POST  /api/hr/payroll-runs
- POST      /api/hr/payroll-runs/:id/calculate (PAYE/UIF/SDL)
- POST      /api/hr/payroll-runs/:id/approve
- GET       /api/hr/leave-requests
- POST      /api/hr/leave-requests/:id/approve
- GET       /api/hr/compliance-checklist
```

#### Step 3.4: Validation
- [ ] Employee records created
- [ ] Payroll calculation accurate (PAYE, UIF, SDL)
- [ ] Leave balances correct (BCEA rules)
- [ ] Compliance checklist shows all requirements
- [ ] EMP201 reconciliation correct

### Success Criteria
✅ Payroll runs successfully  
✅ PAYE/UIF/SDL calculations accurate  
✅ BCEA compliance verified  

---

## 🎯 PHASE 4: OPERATIONS MODULES (Day 7-8)

### Modules to Deploy
1. Manufacturing
2. Warehouse Management
3. Logistics & Fleet
4. Asset Management

### Deployment Steps

#### Step 4.1: Deploy Operations Migrations
```bash
psql "$DB_URL" -f ../backend/database/migrations/009_logistics_module.sql
psql "$DB_URL" -f ../backend/database/migrations/013_asset_management_module.sql
```

#### Step 4.2: Deploy APIs
- Manufacturing: Production orders, BOMs, work centers
- Warehouse: Locations, bins, stock movements, cycle counts
- Logistics: Trips, routes, fuel tracking, driver management
- Assets: Fixed assets, depreciation, maintenance

#### Step 4.3: Validation
- [ ] Production orders flow works
- [ ] Warehouse bin movements tracked
- [ ] Logistics trips planned and executed
- [ ] Asset depreciation calculated

---

## 🎯 PHASE 5: SPECIALIZED MODULES (Day 9-10)

### Modules to Deploy
1. Healthcare Operations
2. SARS Sentinel
3. Practice Management

### Deployment Steps

#### Step 5.1: Healthcare Module
```bash
psql "$DB_URL" -f ../backend/database/migrations/020_healthcare_operations_module.sql
```

**Healthcare Features:**
- Patient records (POPIA compliant)
- Appointments & scheduling
- Medical aid claims
- Medication tracking
- Clinical notes

#### Step 5.2: SARS Sentinel
```sql
-- Already partially deployed, add:
- Correspondence tracking
- Deadline monitoring
- Client compliance dashboard
- eFiling integration prep
```

#### Step 5.3: Validation
- [ ] Healthcare workflows complete
- [ ] SARS deadlines tracked
- [ ] Practice management functional

---

## 🎯 PHASE 6: INTEGRATION & TESTING (Day 11-12)

### Integration Points
1. **Financial ↔ Sales:** Invoice posting to GL
2. **Financial ↔ Purchase:** Bill posting to GL
3. **Payroll ↔ Financial:** Salary journals to GL
4. **Inventory ↔ Manufacturing:** Material consumption
5. **Assets ↔ Financial:** Depreciation journals
6. **Logistics ↔ Fuel:** Fuel transaction posting

### Testing Checklist

#### End-to-End Scenarios
- [ ] **Scenario 1: Full Sales Cycle**
  - Create customer → Quote → Sales order → Invoice → Payment → GL posting
  
- [ ] **Scenario 2: Purchase Cycle**
  - Create supplier → Purchase requisition → PO → Goods receipt → Vendor invoice → Payment → GL posting
  
- [ ] **Scenario 3: Payroll Cycle**
  - Employee setup → Payroll run → PAYE/UIF/SDL calculation → GL posting → Payment → SARS submission
  
- [ ] **Scenario 4: Manufacturing Cycle**
  - BOM creation → Production order → Material issue → Production → Finished goods receipt → Cost calculation
  
- [ ] **Scenario 5: Multi-Tenant Isolation**
  - Create 2nd tenant → Verify data isolation → Cross-tenant query prevention

#### Performance Testing
```bash
# Load testing with Apache Bench
ab -n 1000 -c 10 http://51.21.219.35:3000/api/financial/chart-of-accounts

# Database query performance
EXPLAIN ANALYZE SELECT * FROM journal_entries WHERE tenant_id = '...' AND posting_date BETWEEN '...' AND '...';
```

---

## 🎯 PHASE 7: PRODUCTION CUTOVER (Day 13-14)

### Pre-Launch Checklist
- [ ] All modules deployed and tested
- [ ] Demo tenant fully populated
- [ ] Production tenant created
- [ ] User accounts migrated/created
- [ ] Backups configured (daily)
- [ ] Monitoring setup (CloudWatch)
- [ ] SSL certificates installed
- [ ] Domain configured (erp.aetheros.co.za)
- [ ] Email notifications working
- [ ] Error logging active (Sentry/CloudWatch)
- [ ] API rate limiting configured
- [ ] Security headers enabled
- [ ] CORS configured correctly

### Go-Live Steps
```bash
# 1. Final backup
pg_dump "$DB_URL" > backup-pre-golive-$(date +%Y%m%d).sql

# 2. Update DNS
# Point erp.aetheros.co.za to Load Balancer

# 3. Enable production mode
export NODE_ENV=production

# 4. Restart services
pm2 restart all

# 5. Monitor logs
pm2 logs --lines 100
```

### Post-Launch Monitoring (Week 1)
- [ ] Daily health checks
- [ ] Performance metrics review
- [ ] Error rate monitoring
- [ ] User feedback collection
- [ ] Bug triage and fixes
- [ ] Backup verification

---

## 📊 DEPLOYMENT METRICS

### Success KPIs
- **Uptime:** >99.5%
- **Response Time:** <500ms (P95)
- **Error Rate:** <0.1%
- **Database Query Performance:** <100ms average
- **User Satisfaction:** >4.5/5

### Monitoring Tools
- **CloudWatch:** Infrastructure metrics
- **PM2:** Process monitoring
- **PostgreSQL Logs:** Query performance
- **Application Logs:** Error tracking

---

## 🆘 ROLLBACK PROCEDURES

### Emergency Rollback
```bash
# 1. Stop backend
pm2 stop all

# 2. Restore database
psql "$DB_URL" < backup-pre-[phase]-[timestamp].sql

# 3. Revert frontend (if needed)
aws s3 sync s3://aetheros-erp-frontend-backup/ s3://aetheros-erp-frontend-483636500494/

# 4. Restart old version
pm2 start old-version/dist/server.js
```

---

## 📞 SUPPORT CONTACTS

### Technical Team
- **DevOps Lead:** [Name]
- **Backend Lead:** [Name]
- **Frontend Lead:** [Name]
- **Database Admin:** [Name]

### Escalation Path
1. Technical issues → DevOps Lead
2. Data issues → Database Admin
3. Business logic → Product Owner
4. Critical outages → All hands

---

## 📅 DEPLOYMENT TIMELINE

```
Week 1 (Nov 13-17):
- Day 1-2: Multi-tenant foundation
- Day 3-4: Financial modules
- Day 5-6: HR & Payroll

Week 2 (Nov 18-22):
- Day 7-8: Operations modules
- Day 9-10: Specialized modules
- Day 11-12: Integration testing
- Day 13-14: Production cutover

Week 3 (Nov 25-29):
- Monitoring and stabilization
- Bug fixes and optimizations
- User training
- Documentation finalization
```

---

## ✅ DEPLOYMENT SIGN-OFF

### Phase Approvals
- [ ] Phase 1: Multi-Tenant Foundation (Product Owner, DevOps)
- [ ] Phase 2: Financial Modules (Finance Lead, Product Owner)
- [ ] Phase 3: HR & Payroll (HR Lead, Compliance Officer)
- [ ] Phase 4: Operations (Operations Lead)
- [ ] Phase 5: Specialized (Domain Experts)
- [ ] Phase 6: Integration Testing (QA Lead)
- [ ] Phase 7: Production Cutover (Executive Sponsor)

---

**Next Step:** Begin Phase 1 - Multi-Tenant Foundation Deployment

**Command to start:**
```bash
ssh -i ~/.ssh/aetheros-aws.pem ec2-user@51.21.219.35
```
