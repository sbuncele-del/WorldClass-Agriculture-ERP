-- ============================================================================
-- ACCOUNTING AUTOMATION ENGINE
-- 100% automated double-entry with AI validation
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS accounting;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- CHART OF ACCOUNTS (Multi-entity, Multi-currency)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounting.chart_of_accounts (
    account_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    entity_id UUID, -- For multi-entity consolidation
    account_code VARCHAR(20) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL, -- asset, liability, equity, revenue, expense
    account_subtype VARCHAR(50), -- current_asset, fixed_asset, accounts_receivable, etc.
    parent_account_id UUID REFERENCES accounting.chart_of_accounts(account_id),
    currency_code CHAR(3) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT true,
    is_system_account BOOLEAN DEFAULT false, -- Protected accounts
    normal_balance VARCHAR(10) NOT NULL DEFAULT 'debit', -- debit or credit
    description TEXT,
    tax_code VARCHAR(20),
    reconciliation_required BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, entity_id, account_code)
);

CREATE INDEX idx_coa_tenant ON accounting.chart_of_accounts(tenant_id);
CREATE INDEX idx_coa_type ON accounting.chart_of_accounts(account_type);
CREATE INDEX idx_coa_parent ON accounting.chart_of_accounts(parent_account_id);

-- ---------------------------------------------------------------------------
-- JOURNAL ENTRIES (Immutable Audit Trail)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounting.journal_entries (
    entry_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    entity_id UUID,
    entry_number VARCHAR(50) NOT NULL,
    entry_date DATE NOT NULL,
    posted_date TIMESTAMPTZ,
    period_id UUID, -- Accounting period
    entry_type VARCHAR(50) NOT NULL, -- standard, adjusting, closing, reversing, auto
    source_module VARCHAR(50), -- logistics, ar, ap, payroll, manual
    source_document_id UUID, -- Reference to originating document
    source_document_type VARCHAR(50), -- invoice, payment, shipment, etc.
    description TEXT NOT NULL,
    ai_explanation TEXT, -- Plain language explanation by AI
    ai_confidence_score NUMERIC(5,2), -- How confident AI is in the entry
    total_debit NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_credit NUMERIC(18,2) NOT NULL DEFAULT 0,
    currency_code CHAR(3) DEFAULT 'USD',
    exchange_rate NUMERIC(18,8) DEFAULT 1,
    status VARCHAR(20) DEFAULT 'draft', -- draft, pending_approval, posted, reversed
    is_balanced BOOLEAN GENERATED ALWAYS AS (total_debit = total_credit) STORED,
    reversal_of_entry_id UUID REFERENCES accounting.journal_entries(entry_id),
    reversed_by_entry_id UUID,
    approval_workflow_id UUID,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    posted_by UUID,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Blockchain immutability
    entry_hash VARCHAR(64), -- SHA-256 hash of entry data
    previous_hash VARCHAR(64), -- Hash of previous entry (blockchain chain)
    UNIQUE(tenant_id, entry_number)
);

CREATE INDEX idx_je_tenant_date ON accounting.journal_entries(tenant_id, entry_date);
CREATE INDEX idx_je_status ON accounting.journal_entries(status);
CREATE INDEX idx_je_source ON accounting.journal_entries(source_module, source_document_id);

-- ---------------------------------------------------------------------------
-- JOURNAL ENTRY LINES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounting.journal_entry_lines (
    line_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id UUID NOT NULL REFERENCES accounting.journal_entries(entry_id) ON DELETE CASCADE,
    line_number INT NOT NULL,
    account_id UUID NOT NULL REFERENCES accounting.chart_of_accounts(account_id),
    debit_amount NUMERIC(18,2) DEFAULT 0,
    credit_amount NUMERIC(18,2) DEFAULT 0,
    currency_code CHAR(3) DEFAULT 'USD',
    base_debit NUMERIC(18,2) DEFAULT 0, -- In base currency
    base_credit NUMERIC(18,2) DEFAULT 0,
    description TEXT,
    cost_center_id UUID,
    project_id UUID,
    department_id UUID,
    dimension_1 VARCHAR(100), -- Flexible dimensions
    dimension_2 VARCHAR(100),
    dimension_3 VARCHAR(100),
    tax_code VARCHAR(20),
    tax_amount NUMERIC(18,2) DEFAULT 0,
    reconciled BOOLEAN DEFAULT false,
    reconciliation_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jel_entry ON accounting.journal_entry_lines(entry_id);
CREATE INDEX idx_jel_account ON accounting.journal_entry_lines(account_id);

-- ---------------------------------------------------------------------------
-- ACCOUNTS RECEIVABLE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounting.ar_invoices (
    invoice_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    invoice_number VARCHAR(50) NOT NULL,
    customer_id UUID NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    currency_code CHAR(3) DEFAULT 'USD',
    subtotal NUMERIC(18,2) NOT NULL,
    tax_amount NUMERIC(18,2) DEFAULT 0,
    total_amount NUMERIC(18,2) NOT NULL,
    amount_paid NUMERIC(18,2) DEFAULT 0,
    amount_due NUMERIC(18,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
    status VARCHAR(20) DEFAULT 'draft', -- draft, sent, partially_paid, paid, overdue, written_off
    -- Auto-generation source
    auto_generated BOOLEAN DEFAULT false,
    source_type VARCHAR(50), -- shipment_delivery, service_completion, subscription, etc.
    source_id UUID,
    -- AI Collections
    ai_payment_prediction_date DATE, -- When AI predicts payment
    ai_payment_probability NUMERIC(5,2), -- Probability of on-time payment
    ai_risk_score NUMERIC(5,2), -- Customer risk score
    collection_status VARCHAR(30), -- none, reminder_1, reminder_2, escalated, collections
    last_reminder_date DATE,
    next_action_date DATE,
    -- Journal link
    journal_entry_id UUID REFERENCES accounting.journal_entries(entry_id),
    -- Metadata
    terms VARCHAR(50), -- net30, net60, etc.
    po_number VARCHAR(100),
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, invoice_number)
);

CREATE INDEX idx_ar_tenant_customer ON accounting.ar_invoices(tenant_id, customer_id);
CREATE INDEX idx_ar_status ON accounting.ar_invoices(status);
CREATE INDEX idx_ar_due_date ON accounting.ar_invoices(due_date);

CREATE TABLE IF NOT EXISTS accounting.ar_invoice_lines (
    line_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES accounting.ar_invoices(invoice_id) ON DELETE CASCADE,
    line_number INT NOT NULL,
    item_code VARCHAR(50),
    description TEXT NOT NULL,
    quantity NUMERIC(18,4) DEFAULT 1,
    unit_price NUMERIC(18,4) NOT NULL,
    discount_percent NUMERIC(5,2) DEFAULT 0,
    tax_code VARCHAR(20),
    tax_rate NUMERIC(5,2) DEFAULT 0,
    line_total NUMERIC(18,2) NOT NULL,
    revenue_account_id UUID REFERENCES accounting.chart_of_accounts(account_id),
    cost_center_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- AR PAYMENTS & SMART MATCHING
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounting.ar_payments (
    payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    payment_number VARCHAR(50) NOT NULL,
    customer_id UUID NOT NULL,
    payment_date DATE NOT NULL,
    amount NUMERIC(18,2) NOT NULL,
    currency_code CHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(30), -- wire, check, card, ach, cash
    reference_number VARCHAR(100), -- Check number, transaction ID
    bank_account_id UUID,
    status VARCHAR(20) DEFAULT 'received', -- received, applied, bounced, refunded
    -- Smart matching
    auto_matched BOOLEAN DEFAULT false,
    match_confidence NUMERIC(5,2), -- AI matching confidence
    match_method VARCHAR(30), -- exact, fuzzy_amount, fuzzy_reference, ai_predicted
    unallocated_amount NUMERIC(18,2) DEFAULT 0,
    -- Journal link
    journal_entry_id UUID REFERENCES accounting.journal_entries(entry_id),
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, payment_number)
);

CREATE TABLE IF NOT EXISTS accounting.ar_payment_applications (
    application_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES accounting.ar_payments(payment_id),
    invoice_id UUID NOT NULL REFERENCES accounting.ar_invoices(invoice_id),
    applied_amount NUMERIC(18,2) NOT NULL,
    discount_taken NUMERIC(18,2) DEFAULT 0,
    write_off_amount NUMERIC(18,2) DEFAULT 0,
    application_date DATE NOT NULL,
    auto_applied BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- ACCOUNTS PAYABLE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounting.ap_invoices (
    invoice_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    invoice_number VARCHAR(100) NOT NULL, -- Vendor's invoice number
    internal_reference VARCHAR(50), -- Our internal reference
    vendor_id UUID NOT NULL,
    invoice_date DATE NOT NULL,
    received_date DATE DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    currency_code CHAR(3) DEFAULT 'USD',
    subtotal NUMERIC(18,2) NOT NULL,
    tax_amount NUMERIC(18,2) DEFAULT 0,
    total_amount NUMERIC(18,2) NOT NULL,
    amount_paid NUMERIC(18,2) DEFAULT 0,
    amount_due NUMERIC(18,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, scheduled, paid, disputed, void
    -- OCR Processing
    ocr_processed BOOLEAN DEFAULT false,
    ocr_confidence NUMERIC(5,2),
    ocr_raw_data JSONB,
    original_document_url TEXT,
    -- 3-Way Match
    po_id UUID, -- Purchase order
    receipt_id UUID, -- Goods receipt
    match_status VARCHAR(30) DEFAULT 'pending', -- pending, matched, exception, override
    match_variance NUMERIC(18,2) DEFAULT 0,
    auto_matched BOOLEAN DEFAULT false,
    -- Payment scheduling
    payment_terms VARCHAR(50),
    discount_date DATE,
    discount_percent NUMERIC(5,2) DEFAULT 0,
    scheduled_payment_date DATE,
    payment_priority INT DEFAULT 5, -- 1=highest priority
    -- Journal link
    journal_entry_id UUID REFERENCES accounting.journal_entries(entry_id),
    -- Approval
    approval_status VARCHAR(20) DEFAULT 'pending',
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, vendor_id, invoice_number)
);

CREATE INDEX idx_ap_tenant_vendor ON accounting.ap_invoices(tenant_id, vendor_id);
CREATE INDEX idx_ap_status ON accounting.ap_invoices(status);
CREATE INDEX idx_ap_due_date ON accounting.ap_invoices(due_date);
CREATE INDEX idx_ap_match_status ON accounting.ap_invoices(match_status);

CREATE TABLE IF NOT EXISTS accounting.ap_invoice_lines (
    line_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES accounting.ap_invoices(invoice_id) ON DELETE CASCADE,
    line_number INT NOT NULL,
    item_code VARCHAR(50),
    description TEXT NOT NULL,
    quantity NUMERIC(18,4) DEFAULT 1,
    unit_price NUMERIC(18,4) NOT NULL,
    tax_code VARCHAR(20),
    tax_rate NUMERIC(5,2) DEFAULT 0,
    line_total NUMERIC(18,2) NOT NULL,
    expense_account_id UUID REFERENCES accounting.chart_of_accounts(account_id),
    cost_center_id UUID,
    project_id UUID,
    -- 3-way match details
    po_line_id UUID,
    receipt_line_id UUID,
    quantity_matched NUMERIC(18,4) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- AP PAYMENTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounting.ap_payments (
    payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    payment_number VARCHAR(50) NOT NULL,
    payment_batch_id UUID, -- For batch payments
    vendor_id UUID NOT NULL,
    payment_date DATE NOT NULL,
    amount NUMERIC(18,2) NOT NULL,
    currency_code CHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(30), -- wire, check, ach, virtual_card
    bank_account_id UUID,
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, processing, sent, cleared, failed, voided
    -- Check details
    check_number VARCHAR(20),
    check_printed BOOLEAN DEFAULT false,
    -- Wire/ACH details
    transaction_reference VARCHAR(100),
    -- Optimization
    discount_taken NUMERIC(18,2) DEFAULT 0,
    early_payment_savings NUMERIC(18,2) DEFAULT 0,
    -- Journal link
    journal_entry_id UUID REFERENCES accounting.journal_entries(entry_id),
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, payment_number)
);

CREATE TABLE IF NOT EXISTS accounting.ap_payment_applications (
    application_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES accounting.ap_payments(payment_id),
    invoice_id UUID NOT NULL REFERENCES accounting.ap_invoices(invoice_id),
    applied_amount NUMERIC(18,2) NOT NULL,
    discount_taken NUMERIC(18,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- CASH MANAGEMENT
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounting.bank_accounts (
    bank_account_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    entity_id UUID,
    account_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    routing_number VARCHAR(50),
    swift_code VARCHAR(20),
    iban VARCHAR(50),
    bank_name VARCHAR(255) NOT NULL,
    bank_address TEXT,
    currency_code CHAR(3) DEFAULT 'USD',
    account_type VARCHAR(30), -- checking, savings, money_market, investment
    gl_account_id UUID REFERENCES accounting.chart_of_accounts(account_id),
    current_balance NUMERIC(18,2) DEFAULT 0,
    available_balance NUMERIC(18,2) DEFAULT 0,
    last_reconciled_date DATE,
    last_sync_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    -- Bank feed integration
    plaid_account_id VARCHAR(100),
    api_credentials_encrypted BYTEA,
    auto_sync_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounting.bank_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    bank_account_id UUID NOT NULL REFERENCES accounting.bank_accounts(bank_account_id),
    transaction_date DATE NOT NULL,
    post_date DATE,
    amount NUMERIC(18,2) NOT NULL, -- Positive = deposit, Negative = withdrawal
    running_balance NUMERIC(18,2),
    transaction_type VARCHAR(30), -- deposit, withdrawal, transfer, fee, interest, adjustment
    description TEXT,
    reference_number VARCHAR(100),
    check_number VARCHAR(20),
    -- Categorization
    category VARCHAR(50),
    ai_categorized BOOLEAN DEFAULT false,
    ai_category_confidence NUMERIC(5,2),
    -- Matching
    matched BOOLEAN DEFAULT false,
    match_type VARCHAR(30), -- ar_payment, ap_payment, journal, payroll, expense
    matched_document_id UUID,
    -- Reconciliation
    reconciled BOOLEAN DEFAULT false,
    reconciliation_id UUID,
    -- Fraud detection
    fraud_score NUMERIC(5,2) DEFAULT 0,
    fraud_flags JSONB,
    reviewed BOOLEAN DEFAULT false,
    reviewed_by UUID,
    -- Source
    source VARCHAR(30), -- bank_feed, manual, import
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bt_account_date ON accounting.bank_transactions(bank_account_id, transaction_date);
CREATE INDEX idx_bt_reconciled ON accounting.bank_transactions(reconciled);
CREATE INDEX idx_bt_fraud ON accounting.bank_transactions(fraud_score DESC) WHERE fraud_score > 50;

-- ---------------------------------------------------------------------------
-- CASH FORECASTING
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounting.cash_forecasts (
    forecast_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    forecast_date DATE NOT NULL,
    forecast_horizon_days INT NOT NULL, -- 7, 30, 90, 365
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    model_version VARCHAR(20),
    accuracy_score NUMERIC(5,2), -- Historical accuracy
    -- Forecasted values
    opening_balance NUMERIC(18,2),
    forecasted_inflows NUMERIC(18,2),
    forecasted_outflows NUMERIC(18,2),
    forecasted_closing_balance NUMERIC(18,2),
    -- Confidence intervals
    balance_lower_bound NUMERIC(18,2),
    balance_upper_bound NUMERIC(18,2),
    confidence_level NUMERIC(5,2) DEFAULT 95,
    -- Breakdown
    forecast_details JSONB, -- Daily/weekly breakdown
    assumptions JSONB,
    risk_factors JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounting.cash_forecast_actuals (
    actual_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    forecast_id UUID REFERENCES accounting.cash_forecasts(forecast_id),
    actual_date DATE NOT NULL,
    actual_balance NUMERIC(18,2) NOT NULL,
    variance NUMERIC(18,2),
    variance_percent NUMERIC(8,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- GLOBAL TAX & COMPLIANCE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounting.tax_jurisdictions (
    jurisdiction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    country_code CHAR(2) NOT NULL,
    region_code VARCHAR(10),
    jurisdiction_name VARCHAR(255) NOT NULL,
    tax_authority VARCHAR(255),
    -- Tax types applicable
    has_vat BOOLEAN DEFAULT false,
    has_gst BOOLEAN DEFAULT false,
    has_sales_tax BOOLEAN DEFAULT false,
    has_withholding BOOLEAN DEFAULT false,
    -- Rates (can be overridden by tax_rates table)
    standard_rate NUMERIC(6,3),
    reduced_rate NUMERIC(6,3),
    zero_rate_categories JSONB,
    -- Filing requirements
    filing_frequency VARCHAR(20), -- monthly, quarterly, annually
    filing_deadline_day INT,
    electronic_filing_required BOOLEAN DEFAULT false,
    -- Registration
    tax_registration_number VARCHAR(50),
    registration_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounting.tax_rates (
    rate_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    jurisdiction_id UUID REFERENCES accounting.tax_jurisdictions(jurisdiction_id),
    tax_code VARCHAR(20) NOT NULL,
    tax_name VARCHAR(100) NOT NULL,
    rate NUMERIC(6,3) NOT NULL,
    rate_type VARCHAR(20), -- percentage, fixed
    effective_from DATE NOT NULL,
    effective_to DATE,
    applies_to VARCHAR(20), -- sales, purchases, both
    category VARCHAR(50), -- standard, reduced, zero, exempt
    is_recoverable BOOLEAN DEFAULT true,
    gl_account_payable_id UUID REFERENCES accounting.chart_of_accounts(account_id),
    gl_account_receivable_id UUID REFERENCES accounting.chart_of_accounts(account_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, tax_code, effective_from)
);

CREATE TABLE IF NOT EXISTS accounting.compliance_reports (
    report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    entity_id UUID,
    jurisdiction_id UUID REFERENCES accounting.tax_jurisdictions(jurisdiction_id),
    report_type VARCHAR(50) NOT NULL, -- vat_return, sales_tax, withholding, annual_return
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    filing_deadline DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft', -- draft, generated, reviewed, submitted, accepted, rejected
    -- Report data
    report_data JSONB NOT NULL,
    calculated_tax_due NUMERIC(18,2),
    adjustments NUMERIC(18,2) DEFAULT 0,
    final_amount NUMERIC(18,2),
    -- Filing
    filed_at TIMESTAMPTZ,
    filed_by UUID,
    filing_reference VARCHAR(100),
    authority_response JSONB,
    -- Audit trail
    generation_log JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- AUDIT TRAIL (Blockchain-style immutability)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounting.audit_chain (
    block_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    block_number BIGINT NOT NULL,
    previous_block_hash VARCHAR(64) NOT NULL,
    block_hash VARCHAR(64) NOT NULL,
    merkle_root VARCHAR(64) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    transactions JSONB NOT NULL, -- Array of transaction hashes
    transaction_count INT NOT NULL,
    validator VARCHAR(100), -- System that validated
    signature TEXT, -- Digital signature
    UNIQUE(tenant_id, block_number)
);

CREATE TABLE IF NOT EXISTS accounting.audit_transactions (
    audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    block_id UUID REFERENCES accounting.audit_chain(block_id),
    transaction_hash VARCHAR(64) NOT NULL UNIQUE,
    transaction_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- journal_entry, invoice, payment, etc.
    entity_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- create, update, delete, approve, post
    old_values JSONB,
    new_values JSONB,
    user_id UUID NOT NULL,
    user_ip VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Non-repudiation
    user_signature TEXT
);

CREATE INDEX idx_audit_entity ON accounting.audit_transactions(entity_type, entity_id);
CREATE INDEX idx_audit_user ON accounting.audit_transactions(user_id);
CREATE INDEX idx_audit_timestamp ON accounting.audit_transactions(timestamp);

-- ---------------------------------------------------------------------------
-- MULTI-ENTITY CONSOLIDATION
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounting.legal_entities (
    entity_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    entity_code VARCHAR(20) NOT NULL,
    entity_name VARCHAR(255) NOT NULL,
    parent_entity_id UUID REFERENCES accounting.legal_entities(entity_id),
    country_code CHAR(2) NOT NULL,
    base_currency CHAR(3) NOT NULL,
    fiscal_year_end_month INT DEFAULT 12,
    fiscal_year_end_day INT DEFAULT 31,
    consolidation_method VARCHAR(20), -- full, proportional, equity, none
    ownership_percent NUMERIC(5,2) DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    is_eliminations_entity BOOLEAN DEFAULT false, -- For intercompany eliminations
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, entity_code)
);

CREATE TABLE IF NOT EXISTS accounting.intercompany_transactions (
    ic_transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    from_entity_id UUID NOT NULL REFERENCES accounting.legal_entities(entity_id),
    to_entity_id UUID NOT NULL REFERENCES accounting.legal_entities(entity_id),
    transaction_date DATE NOT NULL,
    transaction_type VARCHAR(50), -- sale, purchase, loan, dividend, etc.
    amount NUMERIC(18,2) NOT NULL,
    currency_code CHAR(3) NOT NULL,
    from_journal_entry_id UUID REFERENCES accounting.journal_entries(entry_id),
    to_journal_entry_id UUID REFERENCES accounting.journal_entries(entry_id),
    elimination_entry_id UUID REFERENCES accounting.journal_entries(entry_id),
    is_eliminated BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, eliminated
    reference VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- FX RATES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounting.exchange_rates (
    rate_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_currency CHAR(3) NOT NULL,
    to_currency CHAR(3) NOT NULL,
    rate_date DATE NOT NULL,
    rate NUMERIC(18,8) NOT NULL,
    rate_type VARCHAR(20) DEFAULT 'spot', -- spot, average, closing
    source VARCHAR(50), -- ecb, fed, manual
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(from_currency, to_currency, rate_date, rate_type)
);

CREATE INDEX idx_fx_lookup ON accounting.exchange_rates(from_currency, to_currency, rate_date DESC);

-- ---------------------------------------------------------------------------
-- ACCOUNTING AUTOMATION RULES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounting.automation_rules (
    rule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- auto_journal, auto_invoice, payment_match, categorization
    trigger_event VARCHAR(100) NOT NULL, -- shipment_delivered, invoice_received, payment_received, etc.
    conditions JSONB NOT NULL, -- Conditions that must be met
    actions JSONB NOT NULL, -- What to do when triggered
    priority INT DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    error_handling VARCHAR(30) DEFAULT 'queue', -- queue, skip, alert
    last_triggered_at TIMESTAMPTZ,
    trigger_count INT DEFAULT 0,
    success_count INT DEFAULT 0,
    failure_count INT DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounting.automation_log (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    rule_id UUID REFERENCES accounting.automation_rules(rule_id),
    trigger_event VARCHAR(100),
    source_document_type VARCHAR(50),
    source_document_id UUID,
    status VARCHAR(20), -- success, failed, skipped, queued
    result_document_type VARCHAR(50),
    result_document_id UUID,
    execution_time_ms INT,
    error_message TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- REAL-TIME FINANCIAL STATEMENTS MATERIALIZED VIEWS
-- ---------------------------------------------------------------------------
-- Trial Balance (refreshed on demand or scheduled)
CREATE MATERIALIZED VIEW IF NOT EXISTS accounting.mv_trial_balance AS
SELECT 
    jel.account_id,
    coa.tenant_id,
    coa.entity_id,
    coa.account_code,
    coa.account_name,
    coa.account_type,
    coa.account_subtype,
    coa.normal_balance,
    SUM(jel.base_debit) as total_debit,
    SUM(jel.base_credit) as total_credit,
    CASE 
        WHEN coa.normal_balance = 'debit' THEN SUM(jel.base_debit) - SUM(jel.base_credit)
        ELSE SUM(jel.base_credit) - SUM(jel.base_debit)
    END as balance,
    MAX(je.entry_date) as last_activity_date
FROM accounting.journal_entry_lines jel
JOIN accounting.journal_entries je ON jel.entry_id = je.entry_id
JOIN accounting.chart_of_accounts coa ON jel.account_id = coa.account_id
WHERE je.status = 'posted'
GROUP BY jel.account_id, coa.tenant_id, coa.entity_id, coa.account_code, 
         coa.account_name, coa.account_type, coa.account_subtype, coa.normal_balance
WITH NO DATA;

CREATE UNIQUE INDEX idx_mv_tb_account ON accounting.mv_trial_balance(account_id);

-- ---------------------------------------------------------------------------
-- FUNCTIONS FOR AUTOMATION
-- ---------------------------------------------------------------------------

-- Function to generate journal entry hash (for blockchain)
CREATE OR REPLACE FUNCTION accounting.generate_entry_hash(p_entry_id UUID)
RETURNS VARCHAR(64) AS $$
DECLARE
    v_data TEXT;
    v_hash VARCHAR(64);
BEGIN
    SELECT CONCAT(
        entry_number, '|',
        entry_date, '|',
        total_debit, '|',
        total_credit, '|',
        description, '|',
        created_at
    ) INTO v_data
    FROM accounting.journal_entries
    WHERE entry_id = p_entry_id;
    
    v_hash := encode(sha256(v_data::bytea), 'hex');
    
    UPDATE accounting.journal_entries 
    SET entry_hash = v_hash 
    WHERE entry_id = p_entry_id;
    
    RETURN v_hash;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-create journal entry from trigger
CREATE OR REPLACE FUNCTION accounting.create_auto_journal(
    p_tenant_id UUID,
    p_source_module VARCHAR(50),
    p_source_document_id UUID,
    p_source_document_type VARCHAR(50),
    p_description TEXT,
    p_lines JSONB -- Array of {account_id, debit, credit, description}
) RETURNS UUID AS $$
DECLARE
    v_entry_id UUID;
    v_entry_number VARCHAR(50);
    v_total_debit NUMERIC(18,2) := 0;
    v_total_credit NUMERIC(18,2) := 0;
    v_line JSONB;
    v_line_num INT := 1;
BEGIN
    -- Generate entry number
    v_entry_number := 'AJ-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                      LPAD(nextval('accounting.journal_entry_seq')::TEXT, 6, '0');
    
    -- Calculate totals
    FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines)
    LOOP
        v_total_debit := v_total_debit + COALESCE((v_line->>'debit')::NUMERIC, 0);
        v_total_credit := v_total_credit + COALESCE((v_line->>'credit')::NUMERIC, 0);
    END LOOP;
    
    -- Validate balanced
    IF v_total_debit != v_total_credit THEN
        RAISE EXCEPTION 'Journal entry not balanced: Debit % != Credit %', v_total_debit, v_total_credit;
    END IF;
    
    -- Create header
    INSERT INTO accounting.journal_entries (
        tenant_id, entry_number, entry_date, entry_type,
        source_module, source_document_id, source_document_type,
        description, total_debit, total_credit, status
    ) VALUES (
        p_tenant_id, v_entry_number, CURRENT_DATE, 'auto',
        p_source_module, p_source_document_id, p_source_document_type,
        p_description, v_total_debit, v_total_credit, 'posted'
    ) RETURNING entry_id INTO v_entry_id;
    
    -- Create lines
    FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines)
    LOOP
        INSERT INTO accounting.journal_entry_lines (
            entry_id, line_number, account_id,
            debit_amount, credit_amount, base_debit, base_credit,
            description
        ) VALUES (
            v_entry_id, v_line_num, (v_line->>'account_id')::UUID,
            COALESCE((v_line->>'debit')::NUMERIC, 0),
            COALESCE((v_line->>'credit')::NUMERIC, 0),
            COALESCE((v_line->>'debit')::NUMERIC, 0),
            COALESCE((v_line->>'credit')::NUMERIC, 0),
            v_line->>'description'
        );
        v_line_num := v_line_num + 1;
    END LOOP;
    
    -- Generate hash
    PERFORM accounting.generate_entry_hash(v_entry_id);
    
    RETURN v_entry_id;
END;
$$ LANGUAGE plpgsql;

-- Sequence for journal entries
CREATE SEQUENCE IF NOT EXISTS accounting.journal_entry_seq START 1;

-- ---------------------------------------------------------------------------
-- SAMPLE AUTOMATION RULES (Logistics Integration)
-- ---------------------------------------------------------------------------
INSERT INTO accounting.automation_rules (tenant_id, rule_name, rule_type, trigger_event, conditions, actions, priority)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 
     'Revenue Recognition on Delivery', 
     'auto_journal', 
     'shipment_delivered',
     '{"status": "delivered", "billing_type": "on_delivery"}'::jsonb,
     '{"debit_account": "accounts_receivable", "credit_account": "freight_revenue", "amount_field": "invoice_amount"}'::jsonb,
     10),
    ('00000000-0000-0000-0000-000000000001',
     'Fuel Expense Accrual',
     'auto_journal',
     'fuel_transaction_created',
     '{"transaction_type": "fuel"}'::jsonb,
     '{"debit_account": "fuel_expense", "credit_account": "accounts_payable", "amount_field": "total_amount"}'::jsonb,
     20),
    ('00000000-0000-0000-0000-000000000001',
     'Auto-Match Customer Payments',
     'payment_match',
     'payment_received',
     '{"source": "bank_feed"}'::jsonb,
     '{"match_strategy": ["exact_amount", "fuzzy_reference", "ai_prediction"], "auto_apply": true, "threshold": 95}'::jsonb,
     5)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- END OF MIGRATION 029
-- ============================================================================

SELECT 'Accounting Automation schema created successfully!' as result;
