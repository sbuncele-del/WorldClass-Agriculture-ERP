# WorldClass ERP - API Module Diagnostic Tracker

**Created:** December 15, 2025  
**Purpose:** Track API integration status and errors for each ERP module  
**Goal:** Production-ready ERP by December 16, 2025

---

## Diagnostic Approach

### Phase 1: Fix Modules WITH API Connection
Modules that return errors from the backend - these have frontend-to-API wiring but have schema/column mismatches.

### Phase 2: Connect Modules WITHOUT API
Modules that show no console errors and no network activity - these need frontend-to-API wiring.

---

## Module Status Tracker

### ✅ FIXED MODULES

| Module | Error | Root Cause | Fix Applied | Status |
|--------|-------|------------|-------------|--------|
| **Sales Hub** | `column "name" does not exist` | CustomerRepository used `name` but table has `company_name`; used `id` but table has `customer_id`; used `tenant_id` but table doesn't have it | Rewrote CustomerRepository with correct column mappings, overrode findAll/create/update/delete/rawQuery to bypass tenant filtering | ✅ FIXED |

---

### 🔴 PENDING FIXES (API Connected - Has Errors)

| Module | Error | Root Cause | Fix Required | Status |
|--------|-------|------------|--------------|--------|
| **Financial Hub** | `column je.id does not exist` | Queries use `je.id` but table uses `entry_id`; queries use `financial.journal_entries` but table is in `public` schema | Change `je.id` → `je.entry_id` and `financial.journal_entries` → `journal_entries` across ~70 files | 🔴 PENDING |

---

### 🟡 AWAITING DIAGNOSIS (Need Console Errors)

| Module | Console Error | Root Cause | Fix Required | Status |
|--------|---------------|------------|--------------|--------|
| **Purchase Hub** | _Pending user test_ | | | 🟡 AWAITING |
| **Inventory Hub** | _Pending user test_ | | | 🟡 AWAITING |
| **Assets Hub** | _Pending user test_ | | | 🟡 AWAITING |
| **HR Hub** | _Pending user test_ | | | 🟡 AWAITING |
| **Warehouse Hub** | _Pending user test_ | | | 🟡 AWAITING |
| **Banking Hub** | _Pending user test_ | | | 🟡 AWAITING |
| **Cash Management** | _Pending user test_ | | | 🟡 AWAITING |
| **Treasury** | _Pending user test_ | | | 🟡 AWAITING |
| **SARS Sentinel** | _Pending user test_ | | | 🟡 AWAITING |

---

### ⚪ NOT CONNECTED (No API Wiring)

| Module | Issue | Work Required | Status |
|--------|-------|---------------|--------|
| _To be identified_ | No network requests to backend | Wire frontend to backend API endpoints | ⚪ NOT CONNECTED |

---

## Database Schema Reference

### Key Tables and Their Actual Schemas

#### `public.journal_entries`
```
entry_id              | integer (PK)
entry_number          | varchar(50)
entry_date            | date
description           | text
reference             | varchar(100)
status                | varchar(20) default 'draft'
created_by            | integer
created_at            | timestamp
tenant_id             | uuid
journal_date          | date
```
**Note:** Code references `je.id` but should be `je.entry_id`

#### `public.journal_entry_lines`
```
line_id               | integer (PK)
entry_id              | integer (FK)
account_id            | integer
debit_amount          | numeric(15,2)
credit_amount         | numeric(15,2)
description           | text
tenant_id             | uuid
journal_entry_id      | integer
account_code          | varchar(50)
```

#### `sales.customers`
```
customer_id           | integer (PK)
company_name          | varchar(255)
contact_person        | varchar(255)
email                 | varchar(255)
phone                 | varchar(50)
vat_number            | varchar(50)
customer_type         | varchar(50)
status                | varchar(20) default 'active'
created_at            | timestamp
updated_at            | timestamp
```
**Note:** NO `tenant_id`, NO `deleted_at`, NO `name` (use `company_name`), NO `id` (use `customer_id`)

---

## Common Schema Mismatches Found

| Code Uses | Actual Column | Tables Affected |
|-----------|---------------|-----------------|
| `id` | `entry_id` | journal_entries |
| `id` | `customer_id` | sales.customers |
| `name` | `company_name` | sales.customers |
| `tenant_id` | _doesn't exist_ | sales.customers |
| `deleted_at` | _doesn't exist_ | sales.customers, others |
| `financial.journal_entries` | `public.journal_entries` | All financial queries |

---

## How to Diagnose a Module

1. **Open the module** in the browser (e.g., `/app/financial-hub`)
2. **Open DevTools** → Network tab → Filter by "Fetch/XHR"
3. **Look for red (failed) requests** to `/api/*` endpoints
4. **Click the failed request** → Response tab
5. **Copy the error JSON** and paste it here

Example error:
```json
{"success":false,"error":"column je.id does not exist"}
```

---

## Files Modified Log

| Date | File | Change |
|------|------|--------|
| Dec 14, 2025 | `backend/src/repositories/sales/CustomerRepository.ts` | Complete rewrite to match actual sales.customers schema |
| Dec 14, 2025 | `backend/src/controllers/sales.controller.v2.ts` | Changed sortBy from 'name' to 'company_name' |

---

## Deployment Notes

- **EC2 Instance:** i-0b20fd06fae7e84b1 (51.20.67.228)
- **Backend Path:** /home/ec2-user/aetheros-erp
- **PM2 Process:** `backend` (PM2_HOME=/home/ec2-user/.pm2)
- **Frontend:** CloudFront E1Y8WMVZX5HJYW → S3 aetheros-erp-frontend

### Deploy Command Sequence
```bash
# 1. Build backend
cd /workspaces/WorldClass-ERP/backend && npm run build

# 2. Package and upload
tar -czf ../backend-deploy.tar.gz dist package*.json
aws s3 cp ../backend-deploy.tar.gz s3://aetheros-erp-frontend/backend-deploy.tar.gz --region eu-north-1

# 3. Deploy to EC2 via SSM
aws ssm send-command --region eu-north-1 --instance-ids i-0b20fd06fae7e84b1 \
  --document-name AWS-RunShellScript \
  --parameters 'commands=["export PM2_HOME=/home/ec2-user/.pm2 && cd /home/ec2-user/aetheros-erp && aws s3 cp s3://aetheros-erp-frontend/backend-deploy.tar.gz . --region eu-north-1 && tar -xzf backend-deploy.tar.gz && pm2 restart backend"]'
```

---

## Next Steps

1. [ ] Fix Financial Hub (`je.id` → `je.entry_id`)
2. [ ] User tests each module and provides console errors
3. [ ] Fix each module based on errors
4. [ ] Identify modules without API connection
5. [ ] Wire up disconnected modules
6. [ ] Final deploy and verification
