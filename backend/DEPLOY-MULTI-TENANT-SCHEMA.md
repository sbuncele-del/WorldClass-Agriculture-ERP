# 🚀 DEPLOY MULTI-TENANT SCHEMA TO AWS RDS

## Quick Deployment Steps

### Option 1: SSH to EC2 and Run SQL (Recommended)

```bash
# 1. SSH into your EC2 instance
ssh -i ~/.ssh/aetheros-aws.pem ec2-user@51.21.219.35

# 2. Copy the SQL file content (from your local machine)
# Copy the content of: backend/src/config/multi-tenant-schema.sql

# 3. On EC2, create the SQL file
cat > multi-tenant-schema.sql << 'EOF'
# Paste the SQL content here
EOF

# 4. Run the migration
psql "postgresql://postgres:caxMex-0putca-dyjnah@aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com:5432/aetheros_erp" -f multi-tenant-schema.sql

# 5. Verify migration
psql "postgresql://postgres:caxMex-0putca-dyjnah@aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com:5432/aetheros_erp" -c "SELECT * FROM tenants;"

# 6. Check demo tenant
psql "postgresql://postgres:caxMex-0putca-dyjnah@aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com:5432/aetheros_erp" -c "SELECT id, name, slug, status FROM tenants WHERE slug = 'demo';"
```

### Option 2: Use psql from Local Machine (If accessible)

```bash
# Connect directly to RDS
psql "postgresql://postgres:caxMex-0putca-dyjnah@aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com:5432/aetheros_erp" -f backend/src/config/multi-tenant-schema.sql
```

### Option 3: Use DBeaver / pgAdmin (GUI)

1. Open DBeaver or pgAdmin
2. Connect to AWS RDS:
   - Host: `aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com`
   - Port: `5432`
   - Database: `aetheros_erp`
   - Username: `postgres`
   - Password: `caxMex-0putca-dyjnah`
3. Open SQL Editor
4. Copy/paste content from `backend/src/config/multi-tenant-schema.sql`
5. Execute

## What Gets Created

### New Tables:
- `tenants` - Organizations/Companies
- `users` - All users across tenants
- `demo_tenants` - Auto-reset demo configuration
- `refresh_tokens` - JWT refresh tokens
- `audit_log` - Audit trail for all actions

### Modified Tables:
- Added `tenant_id` column to **ALL** existing tables:
  - Financial: chart_of_accounts, journal_entries, etc.
  - Sales: customers, invoices, sales_orders, etc.
  - Purchase: suppliers, purchase_orders, etc.
  - Inventory: products, warehouses, stock_levels, etc.
  - HR: employees, payroll_runs, etc.
  - Assets: fixed_assets, depreciation_schedules, etc.
  - Manufacturing: production_orders, bills_of_material, etc.
  - Cash: bank_accounts, bank_transactions, etc.
  - SARS: sars_submissions, sars_correspondence, etc.

### Indexes Created:
- `tenant_id` indexes on all tables (for performance)
- Composite indexes for common queries
- 30+ indexes total

### Demo Data:
- Demo Tenant: ID = `00000000-0000-0000-0000-000000000001`
- Demo User: `demo@aetheros.co.za` / `Demo123!`

## Verification Commands

```bash
# Check if migration completed
psql "postgresql://postgres:caxMex-0putca-dyjnah@aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com:5432/aetheros_erp" << EOF
-- Check tables
SELECT table_name FROM information_schema.tables WHERE table_name IN ('tenants', 'users', 'demo_tenants', 'refresh_tokens', 'audit_log');

-- Check tenant_id columns
SELECT COUNT(*) as tables_with_tenant_id FROM information_schema.columns WHERE column_name = 'tenant_id';

-- Check demo tenant
SELECT * FROM tenants WHERE slug = 'demo';

-- Check demo user
SELECT id, email, role, status FROM users WHERE tenant_id = '00000000-0000-0000-0000-000000000001';

-- Check indexes
SELECT COUNT(*) as tenant_indexes FROM pg_indexes WHERE indexname LIKE '%tenant%';
EOF
```

## Next Steps After Migration

1. ✅ Database schema updated
2. ⏳ Build tenant middleware (NEXT)
3. ⏳ Update all queries to include tenant_id
4. ⏳ Build authentication endpoints
5. ⏳ Test multi-tenant isolation

## Rollback (If Needed)

```sql
-- Remove tenant_id columns
ALTER TABLE chart_of_accounts DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE journal_entries DROP COLUMN IF EXISTS tenant_id;
-- ... repeat for all tables

-- Drop new tables
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS demo_tenants;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
```

## Support

If you encounter issues:
1. Check RDS security group allows connections
2. Verify credentials are correct
3. Ensure EC2 can reach RDS (same VPC)
4. Check CloudWatch logs for errors

---

**Status**: Schema files created ✅  
**Next**: Deploy to AWS RDS via EC2
