-- ============================================================================
-- COMPREHENSIVE FIX FOR ALL FAILING ENDPOINTS
-- Date: January 7, 2026
-- Purpose: Add missing columns and create views/aliases for schema references
-- ============================================================================

-- Run this ONCE on production database

BEGIN;

-- ============================================================================
-- 1. ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================================================

-- Add deleted_at to journal_entries (for soft delete support)
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Add deleted_at to suppliers (for soft delete support)
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Add deleted_at to purchase_orders (for soft delete support)
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Add deleted_at to customers (for soft delete support)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Add deleted_at to invoices (for soft delete support)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Add is_active to customers if not exists
ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add deleted_at to chart_of_accounts
ALTER TABLE chart_of_accounts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Add id column as alias to chart_of_accounts (some queries expect 'id')
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chart_of_accounts' AND column_name = 'id') THEN
        ALTER TABLE chart_of_accounts ADD COLUMN id UUID;
        UPDATE chart_of_accounts SET id = account_id WHERE id IS NULL;
    END IF;
END $$;

-- ============================================================================
-- 2. CREATE FINANCIAL.ACCOUNTS VIEW
-- Many controllers reference financial.accounts but the table is chart_of_accounts
-- ============================================================================

-- Create financial schema if not exists
CREATE SCHEMA IF NOT EXISTS financial;

-- Create a view that maps to chart_of_accounts
DROP VIEW IF EXISTS financial.accounts CASCADE;
CREATE VIEW financial.accounts AS 
SELECT 
    account_id as id,
    account_id,
    tenant_id,
    account_code as account_number,
    account_name as name,
    account_type,
    description,
    is_active,
    parent_account_id,
    normal_balance,
    current_balance as balance,
    created_at,
    updated_at
FROM chart_of_accounts;

-- ============================================================================
-- 3. CREATE ASSETS SCHEMA AND TABLES
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS assets;

-- Asset maintenance table
CREATE TABLE IF NOT EXISTS assets.asset_maintenance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    asset_id UUID,
    maintenance_type VARCHAR(50),
    scheduled_date DATE,
    completed_date DATE,
    status VARCHAR(20) DEFAULT 'scheduled',
    cost DECIMAL(18,2),
    description TEXT,
    performed_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asset_maintenance_tenant ON assets.asset_maintenance(tenant_id);

-- ============================================================================
-- 4. ADD MISSING COLUMNS TO WORK_ORDERS (Manufacturing)
-- ============================================================================

ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';

-- ============================================================================
-- 5. CREATE STOCK_LEVELS TABLE IF NOT EXISTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS stock_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    item_id UUID,
    warehouse_id UUID,
    quantity DECIMAL(18,4) DEFAULT 0,
    reserved_quantity DECIMAL(18,4) DEFAULT 0,
    available_quantity DECIMAL(18,4) DEFAULT 0,
    last_counted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_levels_tenant ON stock_levels(tenant_id);

-- ============================================================================
-- 6. CREATE FISCAL_PERIODS TABLE IF NOT EXISTS  
-- ============================================================================

CREATE TABLE IF NOT EXISTS fiscal_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    fiscal_year_id UUID,
    period_number INTEGER,
    period_name VARCHAR(50),
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'open',
    is_adjustment_period BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fiscal_periods_tenant ON fiscal_periods(tenant_id);

-- ============================================================================
-- 7. CREATE TENANT_MODULES TABLE IF NOT EXISTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    module_name VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    enabled_at TIMESTAMP,
    disabled_at TIMESTAMP,
    configuration JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_modules_tenant ON tenant_modules(tenant_id);

-- ============================================================================
-- 8. CREATE JOURNAL_ENTRY_LINES IF NOT EXISTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    journal_entry_id UUID,
    line_number INTEGER,
    account_id UUID,
    description TEXT,
    debit_amount DECIMAL(18,2) DEFAULT 0,
    credit_amount DECIMAL(18,2) DEFAULT 0,
    cost_center_id UUID,
    project_id UUID,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_tenant ON journal_entry_lines(tenant_id);
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_entry ON journal_entry_lines(journal_entry_id);

-- ============================================================================
-- 9. ENSURE AUDIT_LOG TABLE EXISTS WITH CORRECT COLUMNS
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100),
    entity_type VARCHAR(100),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_tenant ON audit_log(tenant_id);

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (run after migration)
-- ============================================================================
-- SELECT * FROM financial.accounts LIMIT 1;
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'journal_entries' AND column_name = 'deleted_at';
-- SELECT * FROM assets.asset_maintenance LIMIT 1;
