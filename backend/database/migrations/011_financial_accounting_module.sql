-- ============================================================================
-- FINANCIAL ACCOUNTING MODULE - DATABASE SCHEMA
-- Worldclass ERP Software
-- Created: November 13, 2025
-- ============================================================================

-- ============================================================================
-- 1. CHART OF ACCOUNTS
-- ============================================================================

-- Chart of Accounts (COA)
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    account_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    -- Account Identification
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Account Hierarchy
    parent_code VARCHAR(50),
    account_level INTEGER NOT NULL DEFAULT 1,
    is_header BOOLEAN DEFAULT false,
    
    -- Account Classification
    account_type VARCHAR(50) NOT NULL, -- ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
    account_subtype VARCHAR(50), -- CURRENT_ASSET, FIXED_ASSET, CURRENT_LIABILITY, etc.
    category VARCHAR(100), -- Cash, Inventory, AR, AP, Sales, COGS, etc.
    
    -- Financial Statement Mapping
    balance_sheet_section VARCHAR(50), -- ASSETS, LIABILITIES, EQUITY
    income_statement_section VARCHAR(50), -- REVENUE, COGS, OPERATING_EXPENSES, OTHER_INCOME
    cash_flow_category VARCHAR(50), -- OPERATING, INVESTING, FINANCING
    
    -- Account Behavior
    normal_balance VARCHAR(10) NOT NULL, -- DEBIT or CREDIT
    is_control_account BOOLEAN DEFAULT false,
    allows_manual_entries BOOLEAN DEFAULT true,
    requires_dimensions BOOLEAN DEFAULT false,
    
    -- Balance Tracking
    current_balance DECIMAL(15,2) DEFAULT 0,
    ytd_debit DECIMAL(15,2) DEFAULT 0,
    ytd_credit DECIMAL(15,2) DEFAULT 0,
    
    -- Tax & Compliance
    tax_type VARCHAR(50), -- VAT_INPUT, VAT_OUTPUT, WITHHOLDING_TAX, NONE
    vat_rate DECIMAL(5,2),
    is_bank_account BOOLEAN DEFAULT false,
    is_reconcilable BOOLEAN DEFAULT false,
    
    -- Currency
    currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',
    allow_foreign_currency BOOLEAN DEFAULT false,
    
    -- Status & Settings
    is_active BOOLEAN DEFAULT true,
    is_system_account BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    
    -- Audit
    created_by UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_account_type CHECK (account_type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
    CONSTRAINT chk_normal_balance CHECK (normal_balance IN ('DEBIT', 'CREDIT'))
);

CREATE INDEX IF NOT EXISTS idx_coa_code ON chart_of_accounts(code);
CREATE INDEX IF NOT EXISTS idx_coa_type ON chart_of_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_coa_active ON chart_of_accounts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_coa_parent ON chart_of_accounts(parent_code);


-- ============================================================================
-- 2. FISCAL PERIODS
-- ============================================================================

-- Fiscal Years
CREATE TABLE IF NOT EXISTS fiscal_years (
    fiscal_year_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    year_code VARCHAR(20) NOT NULL UNIQUE, -- FY2025, FY2026
    year_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN', -- OPEN, CLOSED, LOCKED
    is_current BOOLEAN DEFAULT false,
    
    created_by UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_fiscal_year_status CHECK (status IN ('OPEN', 'CLOSED', 'LOCKED'))
);

CREATE INDEX IF NOT EXISTS idx_fiscal_years_current ON fiscal_years(is_current) WHERE is_current = true;


-- Fiscal Periods (Monthly)
CREATE TABLE IF NOT EXISTS fiscal_periods (
    period_id SERIAL PRIMARY KEY,
    fiscal_year_id INTEGER NOT NULL REFERENCES fiscal_years(fiscal_year_id),
    
    period_code VARCHAR(20) NOT NULL UNIQUE, -- 2025-01, 2025-02, etc.
    period_name VARCHAR(50) NOT NULL,
    period_number INTEGER NOT NULL, -- 1-12
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN', -- OPEN, CLOSED, LOCKED
    is_current BOOLEAN DEFAULT false,
    
    -- Period Close Info
    closed_by UUID,
    closed_at TIMESTAMP,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_period_status CHECK (status IN ('OPEN', 'CLOSED', 'LOCKED'))
);

CREATE INDEX IF NOT EXISTS idx_fiscal_periods_year ON fiscal_periods(fiscal_year_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_periods_current ON fiscal_periods(is_current) WHERE is_current = true;


-- ============================================================================
-- 3. JOURNAL ENTRIES
-- ============================================================================

-- Journal Entry Headers
CREATE TABLE IF NOT EXISTS journal_entries (
    journal_entry_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    -- Entry Identification
    journal_number VARCHAR(50) NOT NULL UNIQUE,
    journal_date DATE NOT NULL,
    posting_date DATE,
    
    -- Period
    fiscal_period_id INTEGER REFERENCES fiscal_periods(period_id),
    
    -- Source & Type
    source VARCHAR(50) NOT NULL, -- MANUAL, SALES, PURCHASE, PAYROLL, BANK_RECON, DEPRECIATION
    source_document_type VARCHAR(50), -- INVOICE, PAYMENT, RECEIPT, etc.
    source_document_id INTEGER,
    
    -- Entry Details
    description TEXT NOT NULL,
    reference VARCHAR(200),
    
    -- Totals (must balance)
    total_debit DECIMAL(15,2) NOT NULL,
    total_credit DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT, POSTED, REVERSED, VOID
    
    -- Posting Information
    posted_by UUID,
    posted_at TIMESTAMP,
    
    -- Reversal
    is_reversal BOOLEAN DEFAULT false,
    reverses_entry_id INTEGER REFERENCES journal_entries(journal_entry_id),
    reversed_by_entry_id INTEGER REFERENCES journal_entries(journal_entry_id),
    reversal_reason TEXT,
    
    -- Attachments
    attachment_count INTEGER DEFAULT 0,
    
    -- Audit
    created_by UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_je_status CHECK (status IN ('DRAFT', 'POSTED', 'REVERSED', 'VOID')),
    CONSTRAINT chk_je_balance CHECK (total_debit = total_credit)
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_number ON journal_entries(journal_number);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(journal_date DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_status ON journal_entries(status);
CREATE INDEX IF NOT EXISTS idx_journal_entries_source ON journal_entries(source, source_document_type);
CREATE INDEX IF NOT EXISTS idx_journal_entries_period ON journal_entries(fiscal_period_id);


-- Journal Entry Lines (Double-Entry Bookkeeping)
CREATE TABLE IF NOT EXISTS journal_entry_lines (
    line_id SERIAL PRIMARY KEY,
    journal_entry_id INTEGER NOT NULL REFERENCES journal_entries(journal_entry_id) ON DELETE CASCADE,
    
    line_number INTEGER NOT NULL,
    
    -- Account
    account_code VARCHAR(50) NOT NULL REFERENCES chart_of_accounts(code),
    
    -- Amount
    debit_amount DECIMAL(15,2) DEFAULT 0,
    credit_amount DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',
    
    -- Description
    description TEXT,
    
    -- Dimensions/Tags (for reporting)
    department_code VARCHAR(50),
    project_code VARCHAR(50),
    cost_center_code VARCHAR(50),
    location_code VARCHAR(50),
    
    -- Additional Details
    contact_type VARCHAR(20), -- CUSTOMER, SUPPLIER, EMPLOYEE, OTHER
    contact_id INTEGER,
    contact_name VARCHAR(200),
    
    -- Tax
    vat_code VARCHAR(20),
    vat_rate DECIMAL(5,2),
    vat_amount DECIMAL(15,2),
    
    -- Reconciliation
    is_reconciled BOOLEAN DEFAULT false,
    reconciled_date DATE,
    reconciled_by UUID,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_jel_amount CHECK (
        (debit_amount > 0 AND credit_amount = 0) OR 
        (credit_amount > 0 AND debit_amount = 0) OR
        (debit_amount = 0 AND credit_amount = 0)
    )
);

CREATE INDEX IF NOT EXISTS idx_journal_lines_entry ON journal_entry_lines(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_account ON journal_entry_lines(account_code);
CREATE INDEX IF NOT EXISTS idx_journal_lines_dimensions ON journal_entry_lines(department_code, project_code, cost_center_code);


-- ============================================================================
-- 4. ACCOUNT BALANCES (For Performance)
-- ============================================================================

-- Period-end Account Balances (Snapshot)
CREATE TABLE IF NOT EXISTS account_period_balances (
    balance_id SERIAL PRIMARY KEY,
    
    account_code VARCHAR(50) NOT NULL REFERENCES chart_of_accounts(code),
    fiscal_period_id INTEGER NOT NULL REFERENCES fiscal_periods(period_id),
    
    -- Opening Balance (from previous period)
    opening_balance DECIMAL(15,2) NOT NULL,
    
    -- Period Activity
    period_debit DECIMAL(15,2) DEFAULT 0,
    period_credit DECIMAL(15,2) DEFAULT 0,
    
    -- Closing Balance
    closing_balance DECIMAL(15,2) NOT NULL,
    
    -- YTD
    ytd_debit DECIMAL(15,2) DEFAULT 0,
    ytd_credit DECIMAL(15,2) DEFAULT 0,
    ytd_balance DECIMAL(15,2) NOT NULL,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_account_period UNIQUE (account_code, fiscal_period_id)
);

CREATE INDEX IF NOT EXISTS idx_account_balances_account ON account_period_balances(account_code);
CREATE INDEX IF NOT EXISTS idx_account_balances_period ON account_period_balances(fiscal_period_id);


-- ============================================================================
-- 5. BUDGETS
-- ============================================================================

-- Budget Headers
CREATE TABLE IF NOT EXISTS budgets (
    budget_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    budget_name VARCHAR(200) NOT NULL,
    budget_code VARCHAR(50) NOT NULL UNIQUE,
    fiscal_year_id INTEGER NOT NULL REFERENCES fiscal_years(fiscal_year_id),
    
    budget_type VARCHAR(50) NOT NULL, -- OPERATING, CAPITAL, PROJECT
    version INTEGER DEFAULT 1,
    
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT, ACTIVE, REVISED, CLOSED
    
    description TEXT,
    notes TEXT,
    
    -- Approval
    approved_by UUID,
    approved_at TIMESTAMP,
    
    -- Audit
    created_by UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_budget_type CHECK (budget_type IN ('OPERATING', 'CAPITAL', 'PROJECT')),
    CONSTRAINT chk_budget_status CHECK (status IN ('DRAFT', 'ACTIVE', 'REVISED', 'CLOSED'))
);

CREATE INDEX IF NOT EXISTS idx_budgets_fiscal_year ON budgets(fiscal_year_id);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON budgets(status);


-- Budget Lines (Account-level budgets)
CREATE TABLE IF NOT EXISTS budget_lines (
    budget_line_id SERIAL PRIMARY KEY,
    budget_id INTEGER NOT NULL REFERENCES budgets(budget_id) ON DELETE CASCADE,
    
    account_code VARCHAR(50) NOT NULL REFERENCES chart_of_accounts(code),
    
    -- Annual Budget
    annual_amount DECIMAL(15,2) NOT NULL,
    
    -- Monthly Distribution
    jan_amount DECIMAL(15,2) DEFAULT 0,
    feb_amount DECIMAL(15,2) DEFAULT 0,
    mar_amount DECIMAL(15,2) DEFAULT 0,
    apr_amount DECIMAL(15,2) DEFAULT 0,
    may_amount DECIMAL(15,2) DEFAULT 0,
    jun_amount DECIMAL(15,2) DEFAULT 0,
    jul_amount DECIMAL(15,2) DEFAULT 0,
    aug_amount DECIMAL(15,2) DEFAULT 0,
    sep_amount DECIMAL(15,2) DEFAULT 0,
    oct_amount DECIMAL(15,2) DEFAULT 0,
    nov_amount DECIMAL(15,2) DEFAULT 0,
    dec_amount DECIMAL(15,2) DEFAULT 0,
    
    -- Dimensions
    department_code VARCHAR(50),
    project_code VARCHAR(50),
    cost_center_code VARCHAR(50),
    
    notes TEXT,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_budget_account UNIQUE (budget_id, account_code, department_code, project_code, cost_center_code)
);

CREATE INDEX IF NOT EXISTS idx_budget_lines_budget ON budget_lines(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_lines_account ON budget_lines(account_code);


-- ============================================================================
-- 6. TAX MANAGEMENT
-- ============================================================================

-- VAT/Tax Codes
CREATE TABLE IF NOT EXISTS tax_codes (
    tax_code_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    tax_code VARCHAR(20) NOT NULL UNIQUE,
    tax_name VARCHAR(100) NOT NULL,
    tax_type VARCHAR(50) NOT NULL, -- VAT, WITHHOLDING, PAYROLL_TAX, CUSTOMS
    
    rate DECIMAL(5,2) NOT NULL,
    description TEXT,
    
    -- GL Accounts
    tax_payable_account VARCHAR(50) REFERENCES chart_of_accounts(code),
    tax_receivable_account VARCHAR(50) REFERENCES chart_of_accounts(code),
    
    effective_from DATE NOT NULL,
    effective_to DATE,
    
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_tax_type CHECK (tax_type IN ('VAT', 'WITHHOLDING', 'PAYROLL_TAX', 'CUSTOMS', 'OTHER'))
);

CREATE INDEX IF NOT EXISTS idx_tax_codes_active ON tax_codes(is_active) WHERE is_active = true;

-- Pre-populate South African VAT rates
INSERT INTO tax_codes (tax_code, tax_name, tax_type, rate, tax_payable_account, effective_from) VALUES
('VAT15', 'VAT Standard Rate 15%', 'VAT', 15.00, '2100', '2018-04-01'),
('VAT0', 'VAT Zero-Rated', 'VAT', 0.00, '2100', '2018-04-01'),
('EXEMPT', 'VAT Exempt', 'VAT', 0.00, '2100', '2018-04-01')
ON CONFLICT (tax_code) DO NOTHING;


-- ============================================================================
-- 7. DIMENSIONS (Cost Centers, Departments, Projects)
-- ============================================================================

-- Departments
CREATE TABLE IF NOT EXISTS departments (
    department_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    department_code VARCHAR(50) NOT NULL UNIQUE,
    department_name VARCHAR(200) NOT NULL,
    parent_code VARCHAR(50),
    
    manager_id UUID,
    manager_name VARCHAR(200),
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Cost Centers
CREATE TABLE IF NOT EXISTS cost_centers (
    cost_center_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    cost_center_code VARCHAR(50) NOT NULL UNIQUE,
    cost_center_name VARCHAR(200) NOT NULL,
    department_code VARCHAR(50) REFERENCES departments(department_code),
    
    budget_holder_id UUID,
    budget_holder_name VARCHAR(200),
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================================
-- 8. FINANCIAL STATEMENTS CONFIGURATION
-- ============================================================================

-- Statement Templates
CREATE TABLE IF NOT EXISTS financial_statement_templates (
    template_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    statement_type VARCHAR(50) NOT NULL, -- BALANCE_SHEET, INCOME_STATEMENT, CASH_FLOW
    template_name VARCHAR(200) NOT NULL,
    template_code VARCHAR(50) NOT NULL UNIQUE,
    
    structure JSONB NOT NULL, -- JSON structure defining sections and line items
    
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    created_by UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_statement_type CHECK (statement_type IN ('BALANCE_SHEET', 'INCOME_STATEMENT', 'CASH_FLOW', 'EQUITY'))
);


-- ============================================================================
-- 9. AUDIT LOG
-- ============================================================================

-- Financial Audit Trail
CREATE TABLE IF NOT EXISTS financial_audit_log (
    audit_id SERIAL PRIMARY KEY,
    
    table_name VARCHAR(100) NOT NULL,
    record_id INTEGER NOT NULL,
    action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE, POST, REVERSE
    
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    
    user_id UUID NOT NULL,
    user_name VARCHAR(200),
    ip_address VARCHAR(50),
    
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_audit_action CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'POST', 'REVERSE', 'CLOSE_PERIOD'))
);

CREATE INDEX IF NOT EXISTS idx_audit_table ON financial_audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON financial_audit_log(timestamp DESC);


-- ============================================================================
-- COMMENTS & DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE chart_of_accounts IS 'Chart of Accounts - defines all GL accounts';
COMMENT ON TABLE fiscal_years IS 'Fiscal years for financial reporting';
COMMENT ON TABLE fiscal_periods IS 'Fiscal periods (months) within fiscal years';
COMMENT ON TABLE journal_entries IS 'Journal entry headers (double-entry bookkeeping)';
COMMENT ON TABLE journal_entry_lines IS 'Journal entry lines (debits and credits)';
COMMENT ON TABLE account_period_balances IS 'Period-end account balance snapshots for performance';
COMMENT ON TABLE budgets IS 'Budget headers';
COMMENT ON TABLE budget_lines IS 'Detailed budget lines by account';
COMMENT ON TABLE tax_codes IS 'VAT and tax codes';
COMMENT ON TABLE financial_audit_log IS 'Audit trail for all financial transactions';

-- ============================================================================
-- END OF FINANCIAL ACCOUNTING MODULE SCHEMA
-- ============================================================================
