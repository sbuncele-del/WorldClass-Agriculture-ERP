-- ============================================================================
-- CASH MANAGEMENT MODULE - DATABASE SCHEMA
-- Worldclass ERP Software
-- Created: November 12, 2025
-- ============================================================================

-- ============================================================================
-- 1. BANK MASTER DATA
-- ============================================================================

-- Bank Master (List of supported banks)
CREATE TABLE IF NOT EXISTS cash_banks (
    bank_id SERIAL PRIMARY KEY,
    bank_code VARCHAR(10) NOT NULL UNIQUE, -- FNB, ABSA, STANDARD, NEDBANK, CAPITEC
    bank_name VARCHAR(200) NOT NULL,
    swift_code VARCHAR(11),
    country VARCHAR(50) NOT NULL DEFAULT 'South Africa',
    logo_url VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Pre-populate with South African banks
INSERT INTO cash_banks (bank_code, bank_name, swift_code) VALUES
('FNB', 'First National Bank', 'FIRNZAJJ'),
('ABSA', 'Absa Bank', 'ABSAZAJJ'),
('STANDARD', 'Standard Bank', 'SBZAZAJJ'),
('NEDBANK', 'Nedbank', 'NEDSZAJJ'),
('CAPITEC', 'Capitec Bank', 'CABLZAJJ'),
('INVESTEC', 'Investec Bank', 'IVESZAJJ'),
('DISCOVERY', 'Discovery Bank', 'SABSZAJJ')
ON CONFLICT (bank_code) DO NOTHING;


-- ============================================================================
-- 2. BANK ACCOUNTS
-- ============================================================================

-- Bank Account Master
CREATE TABLE IF NOT EXISTS cash_bank_accounts (
    account_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    -- Bank Information
    bank_id INTEGER REFERENCES cash_banks(bank_id),
    bank_code VARCHAR(10),
    
    -- Account Details
    account_name VARCHAR(200) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    account_type VARCHAR(20) NOT NULL DEFAULT 'CURRENT', -- CURRENT, SAVINGS, CREDIT_CARD, PETTY_CASH
    branch_code VARCHAR(20),
    swift_code VARCHAR(11),
    iban VARCHAR(34),
    
    -- Currency & Balance
    currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',
    opening_balance DECIMAL(15,2) DEFAULT 0,
    current_balance DECIMAL(15,2) DEFAULT 0,
    available_balance DECIMAL(15,2),
    overdraft_limit DECIMAL(15,2) DEFAULT 0,
    
    -- Reconciliation
    last_reconciled_date DATE,
    last_reconciled_balance DECIMAL(15,2),
    unreconciled_count INTEGER DEFAULT 0,
    
    -- GL Integration
    gl_account_code VARCHAR(50), -- Link to Chart of Accounts
    
    -- Settings
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    requires_approval BOOLEAN DEFAULT false,
    
    -- Audit
    created_by UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_account_type CHECK (account_type IN ('CURRENT', 'SAVINGS', 'CREDIT_CARD', 'PETTY_CASH', 'MONEY_MARKET'))
);

CREATE INDEX IF NOT EXISTS idx_cash_bank_accounts_tenant ON cash_bank_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cash_bank_accounts_active ON cash_bank_accounts(is_active) WHERE is_active = true;


-- ============================================================================
-- 3. CASH TRANSACTIONS
-- ============================================================================

-- Cash/Bank Transactions
CREATE TABLE IF NOT EXISTS cash_transactions (
    transaction_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    -- Transaction Identification
    transaction_number VARCHAR(50) NOT NULL UNIQUE,
    transaction_date DATE NOT NULL,
    
    -- Account
    account_id INTEGER NOT NULL REFERENCES cash_bank_accounts(account_id),
    
    -- Transaction Type
    transaction_type VARCHAR(30) NOT NULL, -- DEPOSIT, WITHDRAWAL, TRANSFER, FEE, INTEREST
    category VARCHAR(50), -- SALARY, SUPPLIER_PAYMENT, CUSTOMER_PAYMENT, REFUND, etc.
    
    -- Amount
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',
    exchange_rate DECIMAL(12,6) DEFAULT 1,
    base_amount DECIMAL(15,2), -- Amount in base currency
    
    -- Parties
    payee_payer VARCHAR(200),
    reference VARCHAR(200),
    description TEXT,
    
    -- Supporting Documents
    invoice_id INTEGER,
    expense_id INTEGER,
    payment_id INTEGER,
    
    -- Bank Statement Reference
    statement_line_id INTEGER,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT, PENDING, CLEARED, RECONCILED, VOID
    
    -- Reconciliation
    is_reconciled BOOLEAN DEFAULT false,
    reconciled_date DATE,
    reconciled_by UUID,
    
    -- GL Posting
    journal_entry_id INTEGER,
    posted_to_gl BOOLEAN DEFAULT false,
    gl_posting_date DATE,
    
    -- Audit
    created_by UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_transaction_type CHECK (transaction_type IN ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'FEE', 'INTEREST', 'ADJUSTMENT')),
    CONSTRAINT chk_transaction_status CHECK (status IN ('DRAFT', 'PENDING', 'CLEARED', 'RECONCILED', 'VOID'))
);

CREATE INDEX IF NOT EXISTS idx_cash_transactions_account ON cash_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_date ON cash_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_status ON cash_transactions(status);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_reconciled ON cash_transactions(is_reconciled) WHERE is_reconciled = false;


-- ============================================================================
-- 4. BANK STATEMENTS
-- ============================================================================

-- Bank Statement Headers
CREATE TABLE IF NOT EXISTS cash_bank_statements (
    statement_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    account_id INTEGER NOT NULL REFERENCES cash_bank_accounts(account_id),
    
    -- Statement Period
    statement_date DATE NOT NULL,
    statement_number VARCHAR(50),
    period_from DATE NOT NULL,
    period_to DATE NOT NULL,
    
    -- Balances
    opening_balance DECIMAL(15,2) NOT NULL,
    closing_balance DECIMAL(15,2) NOT NULL,
    total_debits DECIMAL(15,2) DEFAULT 0,
    total_credits DECIMAL(15,2) DEFAULT 0,
    
    -- Reconciliation Status
    status VARCHAR(20) NOT NULL DEFAULT 'IMPORTED', -- IMPORTED, IN_PROGRESS, RECONCILED
    reconciliation_date DATE,
    reconciled_by UUID,
    
    -- Import Info
    imported_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    imported_by UUID NOT NULL,
    import_source VARCHAR(50), -- CSV, PDF, API, MANUAL
    
    -- Statistics
    total_lines INTEGER DEFAULT 0,
    matched_lines INTEGER DEFAULT 0,
    unmatched_lines INTEGER DEFAULT 0,
    
    -- Audit
    created_by UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_statement_status CHECK (status IN ('IMPORTED', 'IN_PROGRESS', 'RECONCILED', 'VOID'))
);

CREATE INDEX IF NOT EXISTS idx_cash_statements_account ON cash_bank_statements(account_id);
CREATE INDEX IF NOT EXISTS idx_cash_statements_date ON cash_bank_statements(statement_date DESC);
CREATE INDEX IF NOT EXISTS idx_cash_statements_status ON cash_bank_statements(status);


-- Bank Statement Lines
CREATE TABLE IF NOT EXISTS cash_bank_statement_lines (
    line_id SERIAL PRIMARY KEY,
    statement_id INTEGER NOT NULL REFERENCES cash_bank_statements(statement_id) ON DELETE CASCADE,
    
    -- Line Details
    line_number INTEGER NOT NULL,
    transaction_date DATE NOT NULL,
    value_date DATE,
    
    -- Transaction Info
    description TEXT NOT NULL,
    reference VARCHAR(200),
    cheque_number VARCHAR(50),
    
    -- Amount
    debit_amount DECIMAL(15,2),
    credit_amount DECIMAL(15,2),
    balance DECIMAL(15,2),
    
    -- Matching
    is_matched BOOLEAN DEFAULT false,
    matched_transaction_id INTEGER REFERENCES cash_transactions(transaction_id),
    match_confidence DECIMAL(5,2), -- 0-100
    match_date TIMESTAMP,
    matched_by UUID,
    
    -- Auto-matching suggestions
    suggested_matches JSONB, -- Array of potential match IDs with scores
    
    -- Categorization
    auto_category VARCHAR(50),
    confirmed_category VARCHAR(50),
    
    -- Parsing
    raw_data JSONB, -- Original CSV/PDF data
    parsing_errors TEXT,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_statement_lines_statement ON cash_bank_statement_lines(statement_id);
CREATE INDEX IF NOT EXISTS idx_statement_lines_date ON cash_bank_statement_lines(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_statement_lines_matched ON cash_bank_statement_lines(is_matched) WHERE is_matched = false;


-- ============================================================================
-- 5. RECONCILIATION RULES
-- ============================================================================

-- Auto-Matching Rules
CREATE TABLE IF NOT EXISTS cash_reconciliation_rules (
    rule_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    rule_name VARCHAR(200) NOT NULL,
    rule_description TEXT,
    
    -- Rule Conditions (JSON)
    conditions JSONB NOT NULL, -- { "description_contains": "SALARY", "amount_range": [5000, 50000] }
    
    -- Actions
    auto_category VARCHAR(50),
    auto_gl_account VARCHAR(50),
    create_transaction BOOLEAN DEFAULT false,
    auto_approve BOOLEAN DEFAULT false,
    
    -- Priority
    priority INTEGER DEFAULT 0, -- Higher priority rules run first
    
    -- Statistics
    matches_count INTEGER DEFAULT 0,
    last_matched TIMESTAMP,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Audit
    created_by UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_rules_active ON cash_reconciliation_rules(is_active, priority DESC) WHERE is_active = true;


-- ============================================================================
-- 6. PETTY CASH
-- ============================================================================

-- Petty Cash Floats
CREATE TABLE IF NOT EXISTS cash_petty_cash_floats (
    float_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    float_name VARCHAR(200) NOT NULL,
    location VARCHAR(200),
    
    -- Float Amount
    float_amount DECIMAL(15,2) NOT NULL,
    current_balance DECIMAL(15,2) NOT NULL,
    
    -- Custodian
    custodian_id UUID, -- Employee responsible
    custodian_name VARCHAR(200),
    
    -- Linked Bank Account (for replenishments)
    bank_account_id INTEGER REFERENCES cash_bank_accounts(account_id),
    
    -- GL Account
    gl_account_code VARCHAR(50),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_reconciled_date DATE,
    
    -- Audit
    created_by UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_petty_cash_floats_active ON cash_petty_cash_floats(is_active) WHERE is_active = true;


-- Petty Cash Transactions
CREATE TABLE IF NOT EXISTS cash_petty_cash_transactions (
    transaction_id SERIAL PRIMARY KEY,
    float_id INTEGER NOT NULL REFERENCES cash_petty_cash_floats(float_id),
    
    transaction_number VARCHAR(50) NOT NULL UNIQUE,
    transaction_date DATE NOT NULL,
    
    -- Transaction Details
    transaction_type VARCHAR(20) NOT NULL, -- EXPENSE, REPLENISHMENT, ADJUSTMENT
    amount DECIMAL(15,2) NOT NULL,
    
    -- Payee/Description
    payee VARCHAR(200),
    description TEXT NOT NULL,
    category VARCHAR(50),
    
    -- Supporting Documents
    receipt_number VARCHAR(50),
    receipt_image_path VARCHAR(500),
    expense_claim_id INTEGER,
    
    -- Approval
    requires_approval BOOLEAN DEFAULT true,
    approved_by UUID,
    approved_date DATE,
    approval_notes TEXT,
    
    -- GL Posting
    gl_account_code VARCHAR(50),
    journal_entry_id INTEGER,
    posted_to_gl BOOLEAN DEFAULT false,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, POSTED
    
    -- Audit
    created_by UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_petty_cash_type CHECK (transaction_type IN ('EXPENSE', 'REPLENISHMENT', 'ADJUSTMENT')),
    CONSTRAINT chk_petty_cash_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'POSTED'))
);

CREATE INDEX IF NOT EXISTS idx_petty_cash_trans_float ON cash_petty_cash_transactions(float_id);
CREATE INDEX IF NOT EXISTS idx_petty_cash_trans_date ON cash_petty_cash_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_petty_cash_trans_status ON cash_petty_cash_transactions(status);


-- ============================================================================
-- 7. CASH FLOW TRACKING
-- ============================================================================

-- Cash Flow Categories
CREATE TABLE IF NOT EXISTS cash_flow_categories (
    category_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    category_code VARCHAR(50) NOT NULL UNIQUE,
    category_name VARCHAR(200) NOT NULL,
    category_type VARCHAR(20) NOT NULL, -- OPERATING, INVESTING, FINANCING
    parent_category_id INTEGER REFERENCES cash_flow_categories(category_id),
    
    -- Display
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_cash_flow_type CHECK (category_type IN ('OPERATING', 'INVESTING', 'FINANCING'))
);

-- Pre-populate with standard categories
INSERT INTO cash_flow_categories (category_code, category_name, category_type) VALUES
-- Operating
('OP_REVENUE', 'Revenue from Customers', 'OPERATING'),
('OP_SUPPLIERS', 'Payments to Suppliers', 'OPERATING'),
('OP_SALARIES', 'Salaries and Wages', 'OPERATING'),
('OP_OPERATING', 'Other Operating Expenses', 'OPERATING'),
('OP_TAX', 'Tax Payments', 'OPERATING'),
-- Investing
('INV_CAPEX', 'Purchase of Fixed Assets', 'INVESTING'),
('INV_DISPOSAL', 'Sale of Fixed Assets', 'INVESTING'),
('INV_INVESTMENTS', 'Purchase/Sale of Investments', 'INVESTING'),
-- Financing
('FIN_EQUITY', 'Equity Contributions/Distributions', 'FINANCING'),
('FIN_LOANS', 'Loan Proceeds/Repayments', 'FINANCING'),
('FIN_INTEREST', 'Interest and Dividends', 'FINANCING')
ON CONFLICT (category_code) DO NOTHING;


-- Cash Flow Forecast
CREATE TABLE IF NOT EXISTS cash_flow_forecasts (
    forecast_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    forecast_name VARCHAR(200) NOT NULL,
    forecast_date DATE NOT NULL,
    period_type VARCHAR(20) NOT NULL, -- WEEKLY, MONTHLY, QUARTERLY
    
    -- Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Forecast Values
    opening_cash DECIMAL(15,2) NOT NULL,
    forecasted_inflows DECIMAL(15,2) NOT NULL,
    forecasted_outflows DECIMAL(15,2) NOT NULL,
    projected_closing_cash DECIMAL(15,2) NOT NULL,
    
    -- Actual vs Forecast (filled when period ends)
    actual_inflows DECIMAL(15,2),
    actual_outflows DECIMAL(15,2),
    actual_closing_cash DECIMAL(15,2),
    variance DECIMAL(15,2),
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    
    -- Audit
    created_by UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_forecast_period CHECK (period_type IN ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL'))
);

CREATE INDEX IF NOT EXISTS idx_cash_flow_forecasts_date ON cash_flow_forecasts(forecast_date DESC);


-- ============================================================================
-- COMMENTS & DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE cash_bank_accounts IS 'Bank accounts for cash management and reconciliation';
COMMENT ON TABLE cash_transactions IS 'All cash and bank transactions';
COMMENT ON TABLE cash_bank_statements IS 'Imported bank statements for reconciliation';
COMMENT ON TABLE cash_bank_statement_lines IS 'Individual lines from bank statements';
COMMENT ON TABLE cash_reconciliation_rules IS 'Auto-matching rules for bank reconciliation';
COMMENT ON TABLE cash_petty_cash_floats IS 'Petty cash floats managed by employees';
COMMENT ON TABLE cash_flow_categories IS 'Cash flow statement categories';

-- ============================================================================
-- END OF CASH MANAGEMENT MODULE SCHEMA
-- ============================================================================
