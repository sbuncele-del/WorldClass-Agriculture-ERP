-- ============================================================================
-- SCHEMA FIX MIGRATION - ADD MISSING COLUMNS TO EXISTING TABLES
-- WorldClass ERP - Production Database Fix
-- Created: December 13, 2025
-- Purpose: Add tenant_id and other missing columns to existing tables
-- ============================================================================

-- ============================================================================
-- STEP 1: ADD TENANT_ID TO ALL TABLES
-- ============================================================================

-- Sales Module
ALTER TABLE sales.customers ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE sales.customers ADD COLUMN IF NOT EXISTS customer_code VARCHAR(50);
ALTER TABLE sales.customers ADD COLUMN IF NOT EXISTS mobile VARCHAR(50);
ALTER TABLE sales.customers ADD COLUMN IF NOT EXISTS billing_address TEXT;
ALTER TABLE sales.customers ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE sales.customers ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(100);
ALTER TABLE sales.customers ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE sales.customers ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50);
ALTER TABLE sales.customers ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
ALTER TABLE sales.customers ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE sales.customers ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE sales.customers ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(255);

ALTER TABLE sales.leads ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE sales.opportunities ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE sales.quotations ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE sales.orders ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE sales.activity_log ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000001';

-- Inventory Module
ALTER TABLE inventory.item_categories ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE inventory.warehouses ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE inventory.items ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE inventory.items ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE inventory.stock_levels ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE inventory.stock_movements ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE inventory.stock_adjustments ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000001';

-- HR Module
ALTER TABLE hr.departments ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE hr.positions ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE hr.employees ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE hr.payroll_periods ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE hr.payroll_runs ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE hr.leave_types ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE hr.leave_requests ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000001';

-- Financial Module
ALTER TABLE chart_of_accounts ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE chart_of_accounts ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE chart_of_accounts ADD COLUMN IF NOT EXISTS balance DECIMAL(15,2) DEFAULT 0;
ALTER TABLE chart_of_accounts ADD COLUMN IF NOT EXISTS current_balance DECIMAL(15,2) DEFAULT 0;

ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS journal_date DATE;
ALTER TABLE journal_entry_lines ADD COLUMN IF NOT EXISTS journal_entry_id INTEGER;
ALTER TABLE journal_entry_lines ADD COLUMN IF NOT EXISTS account_code VARCHAR(50);

ALTER TABLE financial.invoices ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000001';

-- Logistics Module
ALTER TABLE logistics.processed_documents ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE logistics.loads ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000001';

-- Tenants Table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS tenant_name VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS tenant_code VARCHAR(50);

-- ============================================================================
-- STEP 2: UPDATE NULL TENANT_IDS
-- ============================================================================
UPDATE sales.customers SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE sales.leads SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE sales.opportunities SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE sales.quotations SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE sales.orders SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE inventory.item_categories SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE inventory.warehouses SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE inventory.items SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE inventory.stock_levels SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE inventory.stock_movements SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE inventory.stock_adjustments SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE hr.departments SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE hr.positions SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE hr.employees SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE hr.payroll_periods SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE hr.payroll_runs SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE hr.leave_types SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE hr.leave_requests SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE chart_of_accounts SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE journal_entries SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE financial.invoices SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE logistics.processed_documents SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE logistics.loads SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;

-- ============================================================================
-- STEP 3: CREATE INDEXES ON TENANT_ID
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_sales_customers_tenant ON sales.customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_leads_tenant ON sales.leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_opportunities_tenant ON sales.opportunities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_quotations_tenant ON sales.quotations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_tenant ON sales.orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_categories_tenant ON inventory.item_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_warehouses_tenant ON inventory.warehouses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_tenant ON inventory.items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_levels_tenant ON inventory.stock_levels(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_tenant ON inventory.stock_movements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_tenant ON inventory.stock_adjustments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hr_departments_tenant ON hr.departments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hr_positions_tenant ON hr.positions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hr_employees_tenant ON hr.employees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hr_payroll_periods_tenant ON hr.payroll_periods(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hr_payroll_runs_tenant ON hr.payroll_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hr_leave_types_tenant ON hr.leave_types(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hr_leave_requests_tenant ON hr.leave_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_coa_tenant ON chart_of_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_tenant ON journal_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_financial_invoices_tenant ON financial.invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_logistics_documents_tenant ON logistics.processed_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_logistics_loads_tenant ON logistics.loads(tenant_id);

-- ============================================================================
-- STEP 4: CREATE FISCAL YEARS AND PERIODS IF NOT EXISTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS fiscal_years (
    fiscal_year_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    year_code VARCHAR(20) NOT NULL,
    year_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    is_current BOOLEAN DEFAULT false,
    created_by UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, year_code)
);

CREATE TABLE IF NOT EXISTS fiscal_periods (
    period_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    fiscal_year_id INTEGER REFERENCES fiscal_years(fiscal_year_id),
    period_code VARCHAR(20) NOT NULL,
    period_name VARCHAR(50) NOT NULL,
    period_number INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    is_current BOOLEAN DEFAULT false,
    closed_by UUID,
    closed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, period_code)
);

-- Insert fiscal year if not exists
INSERT INTO fiscal_years (tenant_id, year_code, year_name, start_date, end_date, status, is_current)
VALUES ('00000000-0000-0000-0000-000000000001', 'FY2025', 'Fiscal Year 2025', '2025-01-01', '2025-12-31', 'OPEN', TRUE)
ON CONFLICT (tenant_id, year_code) DO NOTHING;

-- ============================================================================
-- STEP 5: SYNC CODE/ACCOUNT_CODE COLUMNS
-- ============================================================================
-- Copy account_code to code if code is null and account_code exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chart_of_accounts' AND column_name = 'account_code') THEN
        UPDATE chart_of_accounts SET code = account_code WHERE code IS NULL AND account_code IS NOT NULL;
    END IF;
END $$;

-- Sync balance columns
UPDATE chart_of_accounts SET balance = current_balance WHERE balance IS NULL AND current_balance IS NOT NULL;
UPDATE chart_of_accounts SET current_balance = balance WHERE current_balance IS NULL AND balance IS NOT NULL;
UPDATE chart_of_accounts SET balance = 0, current_balance = 0 WHERE balance IS NULL AND current_balance IS NULL;

-- ============================================================================
-- STEP 6: VERIFY AND DISPLAY RESULTS
-- ============================================================================
SELECT '=== SCHEMA FIX COMPLETED ===' as status;

SELECT 'Sales Module Tables:' as module;
SELECT COUNT(*) as customers FROM sales.customers;
SELECT COUNT(*) as leads FROM sales.leads;
SELECT COUNT(*) as opportunities FROM sales.opportunities;
SELECT COUNT(*) as quotations FROM sales.quotations;
SELECT COUNT(*) as orders FROM sales.orders;

SELECT 'Inventory Module Tables:' as module;
SELECT COUNT(*) as categories FROM inventory.item_categories;
SELECT COUNT(*) as warehouses FROM inventory.warehouses;
SELECT COUNT(*) as items FROM inventory.items;
SELECT COUNT(*) as stock_levels FROM inventory.stock_levels;

SELECT 'HR Module Tables:' as module;
SELECT COUNT(*) as departments FROM hr.departments;
SELECT COUNT(*) as positions FROM hr.positions;
SELECT COUNT(*) as employees FROM hr.employees;

SELECT 'Financial Module Tables:' as module;
SELECT COUNT(*) as chart_of_accounts FROM chart_of_accounts;
SELECT COUNT(*) as fiscal_years FROM fiscal_years;

SELECT '=== ALL DONE ===' as status;
