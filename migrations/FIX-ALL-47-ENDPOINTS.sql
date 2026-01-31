-- ============================================================================
-- FIX ALL 47 FAILING/SKIPPED ENDPOINTS
-- WorldClass ERP - Production Ready Migration
-- Date: January 6, 2026
-- ============================================================================

-- ============================================================================
-- 1. TENANT SETTINGS - Add columns for business info
-- ============================================================================
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS business_name VARCHAR(255);
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS registration_number VARCHAR(100);
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS vat_number VARCHAR(50);
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS tax_number VARCHAR(50);
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS province VARCHAR(100);
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'South Africa';
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'ZAR';
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Africa/Johannesburg';
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD';
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS financial_year_end INTEGER DEFAULT 2;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS primary_color VARCHAR(20) DEFAULT '#1976d2';
ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(20) DEFAULT '#dc004e';

-- ============================================================================
-- 2. AUDIT_LOG - Add missing columns and fix structure
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    request_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant ON audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);

-- ============================================================================
-- 3. INVENTORY TABLES - Stock levels, movements, dashboard
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory.stock_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    item_id UUID NOT NULL,
    warehouse_id UUID NOT NULL,
    location_id UUID,
    quantity DECIMAL(18,4) DEFAULT 0,
    reserved_quantity DECIMAL(18,4) DEFAULT 0,
    available_quantity DECIMAL(18,4) GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
    reorder_point DECIMAL(18,4),
    reorder_quantity DECIMAL(18,4),
    last_counted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stock_levels_tenant ON inventory.stock_levels(tenant_id);

CREATE TABLE IF NOT EXISTS inventory.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    item_id UUID NOT NULL,
    warehouse_id UUID NOT NULL,
    movement_type VARCHAR(50) NOT NULL, -- 'receipt', 'issue', 'transfer', 'adjustment'
    quantity DECIMAL(18,4) NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stock_movements_tenant ON inventory.stock_movements(tenant_id);

-- ============================================================================
-- 4. SALES TABLES - Leads, Opportunities, Quotations, Pipeline
-- ============================================================================
CREATE TABLE IF NOT EXISTS sales.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    company_name VARCHAR(255),
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    source VARCHAR(100),
    status VARCHAR(50) DEFAULT 'new',
    assigned_to UUID,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_leads_tenant ON sales.leads(tenant_id);

CREATE TABLE IF NOT EXISTS sales.opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    customer_id INTEGER,
    lead_id UUID,
    stage VARCHAR(50) DEFAULT 'qualification',
    probability INTEGER DEFAULT 0,
    expected_value DECIMAL(18,2),
    expected_close_date DATE,
    assigned_to UUID,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_opportunities_tenant ON sales.opportunities(tenant_id);

CREATE TABLE IF NOT EXISTS sales.quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    quotation_number VARCHAR(50),
    customer_id INTEGER,
    opportunity_id UUID,
    status VARCHAR(50) DEFAULT 'draft',
    valid_until DATE,
    subtotal DECIMAL(18,2),
    tax_amount DECIMAL(18,2),
    total_amount DECIMAL(18,2),
    notes TEXT,
    terms TEXT,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_quotations_tenant ON sales.quotations(tenant_id);

-- ============================================================================
-- 5. HR TABLES - Leave types, Leave requests, Payroll runs
-- ============================================================================
CREATE TABLE IF NOT EXISTS hr.leave_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20),
    days_per_year INTEGER DEFAULT 0,
    carry_over_allowed BOOLEAN DEFAULT false,
    max_carry_over_days INTEGER DEFAULT 0,
    is_paid BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_leave_types_tenant ON hr.leave_types(tenant_id);

CREATE TABLE IF NOT EXISTS hr.leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id INTEGER NOT NULL,
    leave_type_id UUID NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_requested DECIMAL(5,2),
    status VARCHAR(50) DEFAULT 'pending',
    reason TEXT,
    approved_by UUID,
    approved_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_leave_requests_tenant ON hr.leave_requests(tenant_id);

CREATE TABLE IF NOT EXISTS hr.payroll_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    run_number VARCHAR(50),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    total_gross DECIMAL(18,2),
    total_deductions DECIMAL(18,2),
    total_net DECIMAL(18,2),
    employee_count INTEGER,
    processed_by UUID,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_tenant ON hr.payroll_runs(tenant_id);

-- ============================================================================
-- 6. MANUFACTURING TABLES - BOMs, Work Orders
-- ============================================================================
CREATE TABLE IF NOT EXISTS manufacturing.boms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    product_id UUID NOT NULL,
    bom_number VARCHAR(50),
    version VARCHAR(20) DEFAULT '1.0',
    status VARCHAR(50) DEFAULT 'active',
    effective_date DATE,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_boms_tenant ON manufacturing.boms(tenant_id);

CREATE TABLE IF NOT EXISTS manufacturing.bom_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bom_id UUID NOT NULL,
    component_id UUID NOT NULL,
    quantity DECIMAL(18,4) NOT NULL,
    unit_of_measure VARCHAR(20),
    scrap_percentage DECIMAL(5,2) DEFAULT 0,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS manufacturing.work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    work_order_number VARCHAR(50),
    product_id UUID NOT NULL,
    bom_id UUID,
    quantity DECIMAL(18,4) NOT NULL,
    status VARCHAR(50) DEFAULT 'planned',
    priority VARCHAR(20) DEFAULT 'normal',
    planned_start DATE,
    planned_end DATE,
    actual_start TIMESTAMP,
    actual_end TIMESTAMP,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_work_orders_tenant ON manufacturing.work_orders(tenant_id);

-- ============================================================================
-- 7. COMPLIANCE - Dashboard data, SARS status
-- ============================================================================
CREATE TABLE IF NOT EXISTS compliance.filings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    filing_type VARCHAR(100) NOT NULL,
    period_start DATE,
    period_end DATE,
    due_date DATE,
    submitted_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending',
    reference_number VARCHAR(100),
    amount DECIMAL(18,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_filings_tenant ON compliance.filings(tenant_id);

CREATE TABLE IF NOT EXISTS compliance.sars_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    submission_type VARCHAR(50), -- 'VAT201', 'EMP201', 'EMP501', 'ITR14'
    tax_period VARCHAR(20),
    status VARCHAR(50) DEFAULT 'draft',
    submitted_at TIMESTAMP,
    reference_number VARCHAR(100),
    response_code VARCHAR(50),
    response_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sars_submissions_tenant ON compliance.sars_submissions(tenant_id);

-- ============================================================================
-- 8. ASSET MANAGEMENT - Locations table
-- ============================================================================
CREATE TABLE IF NOT EXISTS assets.asset_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    address TEXT,
    building VARCHAR(100),
    floor VARCHAR(50),
    room VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_asset_locations_tenant ON assets.asset_locations(tenant_id);

-- ============================================================================
-- 9. PROPOSALS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    client_name VARCHAR(255),
    client_email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'draft',
    total_value DECIMAL(18,2),
    valid_until DATE,
    content JSONB,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_proposals_tenant ON proposals(tenant_id);

-- ============================================================================
-- 10. PROJECTS - Ensure tables exist with correct structure
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    description TEXT,
    status VARCHAR(50) DEFAULT 'planning',
    priority VARCHAR(20) DEFAULT 'medium',
    start_date DATE,
    end_date DATE,
    budget DECIMAL(18,2),
    spent DECIMAL(18,2) DEFAULT 0,
    progress INTEGER DEFAULT 0,
    manager_id UUID,
    customer_id INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_projects_tenant ON projects(tenant_id);

CREATE TABLE IF NOT EXISTS project_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    project_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'todo',
    priority VARCHAR(20) DEFAULT 'medium',
    assignee_id UUID,
    due_date DATE,
    estimated_hours DECIMAL(8,2),
    actual_hours DECIMAL(8,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_project_tasks_tenant ON project_tasks(tenant_id);

CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    project_id UUID,
    task_id UUID,
    user_id UUID NOT NULL,
    date DATE NOT NULL,
    hours DECIMAL(8,2) NOT NULL,
    description TEXT,
    billable BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_time_entries_tenant ON time_entries(tenant_id);

-- ============================================================================
-- 11. AI SUGGESTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID,
    suggestion_type VARCHAR(100),
    title VARCHAR(255),
    description TEXT,
    action_url VARCHAR(500),
    priority VARCHAR(20) DEFAULT 'medium',
    is_read BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_tenant ON ai_suggestions(tenant_id);

-- ============================================================================
-- 12. TREASURY - Accounts
-- ============================================================================
CREATE TABLE IF NOT EXISTS treasury.bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(100),
    bank_name VARCHAR(255),
    branch_code VARCHAR(20),
    swift_code VARCHAR(20),
    currency VARCHAR(10) DEFAULT 'ZAR',
    account_type VARCHAR(50),
    current_balance DECIMAL(18,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_tenant ON treasury.bank_accounts(tenant_id);

-- ============================================================================
-- 13. MULTI-ENTITY TABLES
-- ============================================================================
CREATE TABLE IF NOT EXISTS entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    entity_type VARCHAR(50),
    parent_id UUID,
    currency VARCHAR(10) DEFAULT 'ZAR',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_entities_tenant ON entities(tenant_id);

-- ============================================================================
-- 14. INDUSTRY VERTICALS - Dashboard tables
-- ============================================================================
-- Healthcare
CREATE TABLE IF NOT EXISTS healthcare_patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    patient_number VARCHAR(50),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(20),
    phone VARCHAR(50),
    email VARCHAR(255),
    medical_aid_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_healthcare_patients_tenant ON healthcare_patients(tenant_id);

-- Mining
CREATE TABLE IF NOT EXISTS mining_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    site_name VARCHAR(255),
    mineral_type VARCHAR(100),
    status VARCHAR(50),
    daily_output DECIMAL(18,4),
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mining_operations_tenant ON mining_operations(tenant_id);

-- Property
CREATE TABLE IF NOT EXISTS property_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    property_name VARCHAR(255),
    unit_number VARCHAR(50),
    status VARCHAR(50),
    monthly_rent DECIMAL(18,2),
    tenant_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_property_units_tenant ON property_units(tenant_id);

-- Agriculture
CREATE TABLE IF NOT EXISTS agriculture_farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    farm_name VARCHAR(255),
    location VARCHAR(255),
    hectares DECIMAL(12,2),
    crop_type VARCHAR(100),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agriculture_farms_tenant ON agriculture_farms(tenant_id);

-- ============================================================================
-- 15. FINANCIAL TABLES
-- ============================================================================
-- Chart of Accounts
CREATE TABLE IF NOT EXISTS financial.chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    account_code VARCHAR(50) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    parent_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_coa_tenant ON financial.chart_of_accounts(tenant_id);

-- Journal Entries
CREATE TABLE IF NOT EXISTS financial.journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entry_number VARCHAR(50),
    entry_date DATE NOT NULL,
    description TEXT,
    reference VARCHAR(100),
    source_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'draft',
    total_debit DECIMAL(18,2),
    total_credit DECIMAL(18,2),
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    posted_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_journal_entries_tenant ON financial.journal_entries(tenant_id);

-- Fiscal Periods
CREATE TABLE IF NOT EXISTS financial.fiscal_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    period_name VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_closed BOOLEAN DEFAULT false,
    closed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fiscal_periods_tenant ON financial.fiscal_periods(tenant_id);

-- GL Accounts (if not exists)
CREATE TABLE IF NOT EXISTS financial.gl_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    account_code VARCHAR(50) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50),
    balance DECIMAL(18,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gl_accounts_tenant ON financial.gl_accounts(tenant_id);

-- ============================================================================
-- 16. INSERT DEFAULT DATA FOR EXISTING TENANT
-- ============================================================================
-- Get existing tenant ID
DO $$
DECLARE
    v_tenant_id UUID;
BEGIN
    SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'sgbgroup' LIMIT 1;
    
    IF v_tenant_id IS NOT NULL THEN
        -- Insert tenant settings if not exists
        INSERT INTO tenant_settings (tenant_id, setting_key, setting_value, business_name, currency, timezone)
        SELECT v_tenant_id, 'default', 'true', 'SGB Group', 'ZAR', 'Africa/Johannesburg'
        WHERE NOT EXISTS (SELECT 1 FROM tenant_settings WHERE tenant_id = v_tenant_id LIMIT 1);
        
        -- Insert default leave types
        INSERT INTO hr.leave_types (tenant_id, name, code, days_per_year, is_paid)
        SELECT v_tenant_id, 'Annual Leave', 'AL', 21, true
        WHERE NOT EXISTS (SELECT 1 FROM hr.leave_types WHERE tenant_id = v_tenant_id LIMIT 1);
        
        INSERT INTO hr.leave_types (tenant_id, name, code, days_per_year, is_paid)
        SELECT v_tenant_id, 'Sick Leave', 'SL', 30, true
        WHERE NOT EXISTS (SELECT 1 FROM hr.leave_types WHERE tenant_id = v_tenant_id AND code = 'SL' LIMIT 1);
        
        -- Insert default asset location
        INSERT INTO assets.asset_locations (tenant_id, name, code)
        SELECT v_tenant_id, 'Head Office', 'HQ'
        WHERE NOT EXISTS (SELECT 1 FROM assets.asset_locations WHERE tenant_id = v_tenant_id LIMIT 1);
        
        RAISE NOTICE 'Default data inserted for tenant %', v_tenant_id;
    END IF;
END $$;

-- ============================================================================
-- VERIFY
-- ============================================================================
SELECT 'Migration complete' as status;
