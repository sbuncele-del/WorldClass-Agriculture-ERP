-- ============================================================================
-- COMPREHENSIVE FIX - All Missing Tables and Columns
-- WorldClass ERP - January 6, 2026
-- ============================================================================

-- ============================================================================
-- 1. PURCHASE MODULE - Fix table names (backend expects purchase_requisitions)
-- ============================================================================

-- Rename or create alias
DROP TABLE IF EXISTS purchase.purchase_requisitions;
CREATE TABLE purchase.purchase_requisitions AS SELECT * FROM purchase.requisitions WHERE false;

-- Copy structure and add missing columns
ALTER TABLE purchase.purchase_requisitions ADD COLUMN IF NOT EXISTS requisition_id SERIAL;
ALTER TABLE purchase.purchase_requisitions ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT 'b36ec5a6-b637-4716-84eb-3c53eb1c7093';
ALTER TABLE purchase.purchase_requisitions ADD COLUMN IF NOT EXISTS requisition_number VARCHAR(50);
ALTER TABLE purchase.purchase_requisitions ADD COLUMN IF NOT EXISTS requested_by UUID;
ALTER TABLE purchase.purchase_requisitions ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE purchase.purchase_requisitions ADD COLUMN IF NOT EXISTS required_date DATE;
ALTER TABLE purchase.purchase_requisitions ADD COLUMN IF NOT EXISTS total_estimated DECIMAL(15,2) DEFAULT 0;
ALTER TABLE purchase.purchase_requisitions ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE purchase.purchase_requisitions ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal';
ALTER TABLE purchase.purchase_requisitions ADD COLUMN IF NOT EXISTS justification TEXT;
ALTER TABLE purchase.purchase_requisitions ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE purchase.purchase_requisitions ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE purchase.purchase_requisitions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE purchase.purchase_requisitions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- ============================================================================
-- 2. HR MODULE - Add missing payroll columns
-- ============================================================================

ALTER TABLE hr.payroll_runs ADD COLUMN IF NOT EXISTS payroll_period VARCHAR(50);
ALTER TABLE hr.payroll_runs ADD COLUMN IF NOT EXISTS period_start DATE;
ALTER TABLE hr.payroll_runs ADD COLUMN IF NOT EXISTS period_end DATE;
UPDATE hr.payroll_runs SET payroll_period = 'January 2026' WHERE payroll_period IS NULL;

-- ============================================================================
-- 3. ASSETS MODULE - Add missing columns
-- ============================================================================

ALTER TABLE assets.fixed_assets ADD COLUMN IF NOT EXISTS book_value DECIMAL(15,2) DEFAULT 0;
ALTER TABLE assets.fixed_assets ADD COLUMN IF NOT EXISTS current_value DECIMAL(15,2) DEFAULT 0;
UPDATE assets.fixed_assets SET book_value = COALESCE(net_book_value, purchase_cost - accumulated_depreciation, 0);
UPDATE assets.fixed_assets SET current_value = book_value WHERE current_value IS NULL OR current_value = 0;

-- ============================================================================
-- 4. MANUFACTURING MODULE - Create production_orders table
-- ============================================================================

CREATE TABLE IF NOT EXISTS manufacturing.production_orders (
    order_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT 'b36ec5a6-b637-4716-84eb-3c53eb1c7093',
    order_number VARCHAR(50) NOT NULL,
    bom_id INTEGER REFERENCES manufacturing.boms(bom_id),
    product_name VARCHAR(255),
    quantity_ordered DECIMAL(15,3) NOT NULL DEFAULT 1,
    quantity_produced DECIMAL(15,3) DEFAULT 0,
    start_date DATE,
    due_date DATE,
    completion_date DATE,
    status VARCHAR(50) DEFAULT 'planned',
    priority VARCHAR(20) DEFAULT 'medium',
    assigned_to UUID,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_production_orders_tenant ON manufacturing.production_orders(tenant_id);

-- ============================================================================
-- 5. LOGISTICS MODULE - Create shipments table
-- ============================================================================

CREATE TABLE IF NOT EXISTS logistics.shipments (
    shipment_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT 'b36ec5a6-b637-4716-84eb-3c53eb1c7093',
    shipment_number VARCHAR(50) NOT NULL,
    vehicle_id INTEGER,
    driver_id INTEGER,
    origin VARCHAR(255),
    destination VARCHAR(255),
    pickup_date DATE,
    delivery_date DATE,
    status VARCHAR(50) DEFAULT 'pending',
    total_weight DECIMAL(15,2),
    total_value DECIMAL(15,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_shipments_tenant ON logistics.shipments(tenant_id);

-- Fix logistics.trips column names
ALTER TABLE logistics.trips ADD COLUMN IF NOT EXISTS trip_status VARCHAR(50);
ALTER TABLE logistics.trips ADD COLUMN IF NOT EXISTS start_location VARCHAR(255);
ALTER TABLE logistics.trips ADD COLUMN IF NOT EXISTS end_location VARCHAR(255);
ALTER TABLE logistics.trips ADD COLUMN IF NOT EXISTS start_time TIMESTAMP;
ALTER TABLE logistics.trips ADD COLUMN IF NOT EXISTS end_time TIMESTAMP;
ALTER TABLE logistics.trips ADD COLUMN IF NOT EXISTS distance DECIMAL(10,2);
UPDATE logistics.trips SET trip_status = status WHERE trip_status IS NULL;
UPDATE logistics.trips SET start_location = origin WHERE start_location IS NULL;
UPDATE logistics.trips SET end_location = destination WHERE end_location IS NULL;
UPDATE logistics.trips SET start_time = departure_time WHERE start_time IS NULL;
UPDATE logistics.trips SET end_time = arrival_time WHERE end_time IS NULL;
UPDATE logistics.trips SET distance = distance_km WHERE distance IS NULL;

-- Fix fuel_transactions
ALTER TABLE logistics.fuel_transactions ADD COLUMN IF NOT EXISTS fuel_quantity DECIMAL(10,2);
ALTER TABLE logistics.fuel_transactions ADD COLUMN IF NOT EXISTS cost_per_liter DECIMAL(10,2);
ALTER TABLE logistics.fuel_transactions ADD COLUMN IF NOT EXISTS total_amount DECIMAL(15,2);
UPDATE logistics.fuel_transactions SET fuel_quantity = quantity_liters WHERE fuel_quantity IS NULL;
UPDATE logistics.fuel_transactions SET cost_per_liter = price_per_liter WHERE cost_per_liter IS NULL;
UPDATE logistics.fuel_transactions SET total_amount = total_cost WHERE total_amount IS NULL;

-- ============================================================================
-- 6. COMPLIANCE MODULE - Create requirements table
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS compliance;

CREATE TABLE IF NOT EXISTS compliance.requirements (
    requirement_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT 'b36ec5a6-b637-4716-84eb-3c53eb1c7093',
    requirement_code VARCHAR(50) NOT NULL,
    requirement_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    regulatory_body VARCHAR(100),
    due_date DATE,
    frequency VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    assigned_to UUID,
    last_review_date DATE,
    next_review_date DATE,
    compliance_status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_compliance_requirements_tenant ON compliance.requirements(tenant_id);

CREATE TABLE IF NOT EXISTS compliance.audits (
    audit_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT 'b36ec5a6-b637-4716-84eb-3c53eb1c7093',
    audit_name VARCHAR(255) NOT NULL,
    audit_type VARCHAR(50),
    scheduled_date DATE,
    completion_date DATE,
    status VARCHAR(50) DEFAULT 'scheduled',
    findings TEXT,
    auditor_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_compliance_audits_tenant ON compliance.audits(tenant_id);

-- ============================================================================
-- 7. TREASURY MODULE - Create cash_positions table
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS treasury;

CREATE TABLE IF NOT EXISTS treasury.cash_positions (
    position_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT 'b36ec5a6-b637-4716-84eb-3c53eb1c7093',
    account_id INTEGER,
    position_date DATE NOT NULL DEFAULT CURRENT_DATE,
    opening_balance DECIMAL(15,2) DEFAULT 0,
    inflows DECIMAL(15,2) DEFAULT 0,
    outflows DECIMAL(15,2) DEFAULT 0,
    closing_balance DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'ZAR',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cash_positions_tenant ON treasury.cash_positions(tenant_id);

CREATE TABLE IF NOT EXISTS treasury.bank_accounts (
    account_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT 'b36ec5a6-b637-4716-84eb-3c53eb1c7093',
    account_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(50),
    bank_name VARCHAR(255),
    bank_code VARCHAR(20),
    account_type VARCHAR(50) DEFAULT 'checking',
    currency VARCHAR(10) DEFAULT 'ZAR',
    current_balance DECIMAL(15,2) DEFAULT 0,
    available_balance DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    gl_account_code VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_treasury_bank_accounts_tenant ON treasury.bank_accounts(tenant_id);

-- ============================================================================
-- 8. ADMIN MODULE - Fix audit_log structure
-- ============================================================================

ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS action_type VARCHAR(50);
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS entity_type VARCHAR(100);
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS entity_id VARCHAR(100);
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS old_values JSONB DEFAULT '{}';
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS new_values JSONB DEFAULT '{}';
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS details TEXT;

-- Admin settings structure fix
ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS is_editable BOOLEAN DEFAULT true;

-- ============================================================================
-- 9. PROPOSALS & PROJECTS - Add missing tenant_id handling
-- ============================================================================

ALTER TABLE proposals ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'ZAR';
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS client_company VARCHAR(255);

ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_type VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_name VARCHAR(255);

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_type VARCHAR(50);

ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================================================
-- 10. AI MODULE - Fix structure
-- ============================================================================

ALTER TABLE ai_conversations ADD COLUMN IF NOT EXISTS conversation_type VARCHAR(50) DEFAULT 'general';
ALTER TABLE ai_conversations ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP;

ALTER TABLE ai_suggestions ADD COLUMN IF NOT EXISTS module VARCHAR(50);
ALTER TABLE ai_suggestions ADD COLUMN IF NOT EXISTS action_type VARCHAR(50);
ALTER TABLE ai_suggestions ADD COLUMN IF NOT EXISTS confidence DECIMAL(5,2);

-- ============================================================================
-- 11. FINANCIAL MODULE - Add tables for dashboard
-- ============================================================================

CREATE TABLE IF NOT EXISTS financial.budget_vs_actual (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT 'b36ec5a6-b637-4716-84eb-3c53eb1c7093',
    fiscal_period_id INTEGER,
    account_code VARCHAR(20),
    account_name VARCHAR(255),
    budget_amount DECIMAL(15,2) DEFAULT 0,
    actual_amount DECIMAL(15,2) DEFAULT 0,
    variance DECIMAL(15,2) DEFAULT 0,
    variance_percentage DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_budget_vs_actual_tenant ON financial.budget_vs_actual(tenant_id);

-- GL Explorer needs these
ALTER TABLE chart_of_accounts ADD COLUMN IF NOT EXISTS parent_account_code VARCHAR(20);
ALTER TABLE chart_of_accounts ADD COLUMN IF NOT EXISTS balance DECIMAL(15,2) DEFAULT 0;
ALTER TABLE chart_of_accounts ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'All fixes applied!' as status;
SELECT table_schema, COUNT(*) as tables FROM information_schema.tables 
WHERE table_schema NOT IN ('pg_catalog', 'information_schema') 
GROUP BY table_schema ORDER BY tables DESC;
