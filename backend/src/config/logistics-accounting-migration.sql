-- ============================================================================
-- LOGISTICS ACCOUNTING INTEGRATION MIGRATION
-- Adds journal_entry_id columns and creates required Chart of Accounts entries
-- ============================================================================

-- 1. Add journal_entry_id to logistics.trips
ALTER TABLE logistics.trips 
ADD COLUMN IF NOT EXISTS journal_entry_id UUID;

-- 2. Add journal_entry_id to logistics.fuel_transactions  
ALTER TABLE logistics.fuel_transactions
ADD COLUMN IF NOT EXISTS journal_entry_id UUID;

-- 3. Create indexes for journal entry lookups
CREATE INDEX IF NOT EXISTS idx_logistics_trips_journal 
ON logistics.trips(journal_entry_id) WHERE journal_entry_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_logistics_fuel_journal 
ON logistics.fuel_transactions(journal_entry_id) WHERE journal_entry_id IS NOT NULL;

-- 4. Insert required Chart of Accounts entries for logistics
-- Using demo tenant for now, actual implementation should iterate all tenants
INSERT INTO chart_of_accounts (tenant_id, account_code, account_name, account_type, parent_account_id, is_active, allow_manual_entry)
VALUES 
  -- Assets
  ('00000000-0000-0000-0000-000000000001', '1100', 'Cash', 'ASSET', NULL, true, true),
  ('00000000-0000-0000-0000-000000000001', '1110', 'Bank Account', 'ASSET', NULL, true, true),
  ('00000000-0000-0000-0000-000000000001', '1200', 'Accounts Receivable', 'ASSET', NULL, true, true),
  
  -- Liabilities
  ('00000000-0000-0000-0000-000000000001', '2100', 'Accounts Payable', 'LIABILITY', NULL, true, true),
  ('00000000-0000-0000-0000-000000000001', '2300', 'Wages Payable', 'LIABILITY', NULL, true, true),
  
  -- Revenue
  ('00000000-0000-0000-0000-000000000001', '4100', 'Delivery Revenue', 'REVENUE', NULL, true, true),
  ('00000000-0000-0000-0000-000000000001', '4110', 'Freight Revenue', 'REVENUE', NULL, true, true),
  
  -- Expenses
  ('00000000-0000-0000-0000-000000000001', '5200', 'Fuel Expense', 'EXPENSE', NULL, true, true),
  ('00000000-0000-0000-0000-000000000001', '5210', 'Toll Expense', 'EXPENSE', NULL, true, true),
  ('00000000-0000-0000-0000-000000000001', '5300', 'Driver Wages', 'EXPENSE', NULL, true, true),
  ('00000000-0000-0000-0000-000000000001', '5400', 'Vehicle Maintenance', 'EXPENSE', NULL, true, true)
ON CONFLICT (tenant_id, account_code) DO UPDATE 
SET account_name = EXCLUDED.account_name, is_active = true;

-- 5. Enable logistics_accounting_integration feature flag for all tenants
INSERT INTO feature_flags (name, description, is_enabled, rollout_percentage)
VALUES ('logistics_accounting_integration', 'Enable automatic journal entries for logistics transactions', true, 100)
ON CONFLICT (name) DO UPDATE SET is_enabled = true, rollout_percentage = 100;

-- Enable for all existing tenants
INSERT INTO tenant_feature_flags (tenant_id, feature_name, feature_category, enabled, rollout_percentage, enabled_at)
SELECT tenant_id, 'logistics_accounting_integration', 'FEATURE', true, 100, NOW()
FROM tenants
ON CONFLICT (tenant_id, feature_name) 
DO UPDATE SET enabled = true, rollout_percentage = 100, enabled_at = NOW(), updated_at = NOW();

-- Also enable legacy flag name if it exists
INSERT INTO feature_flags (name, description, is_enabled, rollout_percentage)
VALUES ('logistics_delivery_revenue', 'Enable delivery revenue tracking in logistics', true, 100)
ON CONFLICT (name) DO UPDATE SET is_enabled = true, rollout_percentage = 100;

INSERT INTO tenant_feature_flags (tenant_id, feature_name, feature_category, enabled, rollout_percentage, enabled_at)
SELECT tenant_id, 'logistics_delivery_revenue', 'FEATURE', true, 100, NOW()
FROM tenants
ON CONFLICT (tenant_id, feature_name) 
DO UPDATE SET enabled = true, rollout_percentage = 100, enabled_at = NOW(), updated_at = NOW();

SELECT 'Logistics accounting integration migration completed' as result;
