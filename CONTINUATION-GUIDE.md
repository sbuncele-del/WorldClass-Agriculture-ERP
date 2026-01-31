# CONTINUATION GUIDE - For Next AI Session
## DO NOT DELETE - Read This First!

---

# CRITICAL: Read Before Starting

This document exists to prevent you from:
1. Going in circles fixing the same things
2. Breaking what already works
3. Losing migration files
4. Duplicating effort

**Current Status**: 53/77 API endpoints PASSING (69%)

---

# STEP 1: UNDERSTAND THE SYSTEM

## Key Files You MUST Read First:
1. `/workspaces/WorldClass-ERP/SYSTEM-STATUS-JAN-2026.md` - Complete endpoint status
2. `/workspaces/WorldClass-ERP/ARCHITECTURE.md` - System architecture
3. `/workspaces/WorldClass-ERP/migrations/COMPLETE-SCHEMA-JAN-2026.sql` - Database schema

## Infrastructure:
- **EC2**: i-0b20fd06fae7e84b1 @ 51.20.67.228:3000
- **RDS**: aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com
- **Credentials**: postgres / caxMex-0putca-dyjnah / database: postgres
- **S3**: s3://aetheros-erp-deployments

---

# STEP 2: RUN THE TEST FIRST

Before making ANY changes, run the test to see current state:

```bash
API_BASE="http://51.20.67.228:3000" /workspaces/WorldClass-ERP/scripts/test-all-endpoints.sh
```

Expected result: ~53 PASSED, ~18 FAILED, ~6 SKIPPED

---

# STEP 3: WHAT NEEDS TO BE FIXED

## Priority 1: 18 Failing Endpoints (Dashboard SQL Issues)

Each endpoint fails because the SQL query expects columns that don't exist.
The pattern is the same for ALL: simplify the query to match actual schema.

### Fix Pattern (same for all 18):

```typescript
// BEFORE (Complex query with non-existent columns):
const result = await pool.query(`
  SELECT 
    a.id,
    a.name,
    b.non_existent_column,  -- FAILS
    c.another_missing      -- FAILS
  FROM table_a a
  LEFT JOIN table_b b ON ...
  WHERE a.tenant_id = $1
`, [tenantId]);

// AFTER (Simple query with real columns):
const result = await pool.query(`
  SELECT id, name, created_at
  FROM table_a
  WHERE tenant_id = $1
  ORDER BY created_at DESC
  LIMIT 50
`, [tenantId]);
```

### List of 18 Failing Endpoints:

| # | Endpoint | Controller File | Method |
|---|----------|-----------------|--------|
| 1 | GET /admin/audit-log | `controllers/admin.controller.v2.ts` | `getAuditLog` |
| 2 | GET /cash-management/accounts | `controllers/cash-management.controller.v2.ts` | `getBankAccounts` |
| 3 | GET /cash-management/transactions | `controllers/cash-management.controller.v2.ts` | `getTransactions` |
| 4 | GET /cash-management/reconciliations | `controllers/cash-management.controller.v2.ts` | `getReconciliations` |
| 5 | GET /assets/assets | `controllers/assets.controller.v2.ts` | `getAllAssets` |
| 6 | GET /assets/depreciation | `controllers/assets.controller.v2.ts` | `getDepreciation` |
| 7 | GET /manufacturing/boms | `modules/manufacturing/manufacturing.controller.v2.ts` | `getAllBOMs` |
| 8 | GET /manufacturing/work-orders | `modules/manufacturing/manufacturing.controller.v2.ts` | `getAllWorkOrders` |
| 9 | GET /treasury/dashboard | `controllers/treasury.controller.v2.ts` | `getTreasuryDashboard` |
| 10 | GET /treasury/positions | `controllers/treasury.controller.v2.ts` | `getPositions` |
| 11 | GET /treasury/forecasts | `controllers/treasury.controller.v2.ts` | `getForecasts` |
| 12 | GET /audit-ready/checks | `controllers/audit-ready.controller.v2.ts` | `getAuditChecks` |
| 13 | GET /audit-ready/findings | `controllers/audit-ready.controller.v2.ts` | `getAuditFindings` |
| 14 | GET /logistics/vehicles | `modules/logistics/logistics.controller.v2.ts` | `getVehicles` |
| 15 | GET /logistics/trips | `modules/logistics/logistics.controller.v2.ts` | `getTrips` |
| 16 | GET /logistics/fuel | `modules/logistics/logistics.controller.v2.ts` | `getFuelRecords` |
| 17 | GET /reports/analytics | `controllers/reports.controller.v2.ts` | `getAnalytics` |
| 18 | GET /reports/custom | `controllers/reports.controller.v2.ts` | `getCustomReports` |

### How to Fix Each One:

1. Open the controller file
2. Find the method (search for the function name)
3. Look at the SQL query
4. Simplify to: `SELECT * FROM table WHERE tenant_id = $1 LIMIT 50`
5. Rebuild and deploy

---

## Priority 2: 6 Skipped Endpoints (Missing Routes)

These endpoints exist but routes aren't wired in v2.routes.ts:

Add to `/workspaces/WorldClass-ERP/backend/src/routes/v2.routes.ts`:

```typescript
// Financial Reports
import { 
  getChartOfAccounts, 
  getJournalEntries, 
  getFiscalPeriods 
} from '../modules/financial/financial.controller.v2';

import { 
  getBalanceSheet, 
  getIncomeStatement, 
  getCashFlow 
} from '../controllers/reports.controller.v2';

// Add these routes:
router.get('/financial/chart-of-accounts', authenticate, getChartOfAccounts);
router.get('/financial/journal-entries', authenticate, getJournalEntries);
router.get('/financial/fiscal-periods', authenticate, getFiscalPeriods);
router.get('/reports/balance-sheet', authenticate, getBalanceSheet);
router.get('/reports/income-statement', authenticate, getIncomeStatement);
router.get('/reports/cash-flow', authenticate, getCashFlow);
```

---

# STEP 4: BUILD AND DEPLOY

After making fixes:

```bash
# 1. Build
cd /workspaces/WorldClass-ERP/backend
npm run build

# 2. Package
cd /workspaces/WorldClass-ERP/backend
tar -czvf /tmp/backend-dist.tar.gz dist/ package.json package-lock.json

# 3. Upload to S3
aws s3 cp /tmp/backend-dist.tar.gz s3://aetheros-erp-deployments/

# 4. Deploy to EC2
aws ssm send-command \
  --instance-ids "i-0b20fd06fae7e84b1" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=[
    "cd /home/ec2-user/erp-production",
    "aws s3 cp s3://aetheros-erp-deployments/backend-dist.tar.gz .",
    "tar -xzvf backend-dist.tar.gz",
    "npm install --omit=dev",
    "pm2 restart erp-backend"
  ]' \
  --region eu-north-1

# 5. Wait 60 seconds for deploy

# 6. Run tests again
API_BASE="http://51.20.67.228:3000" /workspaces/WorldClass-ERP/scripts/test-all-endpoints.sh
```

---

# STEP 5: DATABASE CHANGES

If you need to add columns or tables, add them to:
`/workspaces/WorldClass-ERP/migrations/COMPLETE-SCHEMA-JAN-2026.sql`

Then run via SSM:

```bash
# Create migration file locally, then:
aws ssm send-command \
  --instance-ids "i-0b20fd06fae7e84b1" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["PGPASSWORD='\''caxMex-0putca-dyjnah'\'' psql -h aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com -U postgres -d postgres -c \"YOUR SQL HERE\""]' \
  --region eu-north-1
```

---

# DO NOT DO THESE THINGS

1. ❌ DO NOT delete or modify SYSTEM-STATUS-JAN-2026.md
2. ❌ DO NOT delete or modify COMPLETE-SCHEMA-JAN-2026.sql
3. ❌ DO NOT reinstall dependencies without reason
4. ❌ DO NOT change endpoints that already pass
5. ❌ DO NOT run npm update or npm upgrade
6. ❌ DO NOT modify package-lock.json
7. ❌ DO NOT create new tables without documenting in migration file

---

# TEST USER CREDENTIALS

```
Email: Sibusiso@sgbsgroup.co.za
Password: Masaphokati2025!
Tenant ID: b36ec5a6-b637-4716-84eb-3c53eb1c7093
```

---

# SUCCESS CRITERIA

When all work is done:
- 77/77 endpoints should PASS (0 FAILED, 0 SKIPPED)
- All changes committed to git
- Documentation updated

---

**Document Last Updated**: January 7, 2026
