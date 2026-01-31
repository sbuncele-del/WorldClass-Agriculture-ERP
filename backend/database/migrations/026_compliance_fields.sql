-- =====================================================
-- Compliance Fields Migration
-- GDPR, SOX, IFRS 15 compliance for WorldClass ERP
-- =====================================================

-- ===========================================
-- GDPR COMPLIANCE FIELDS
-- General Data Protection Regulation (EU)
-- ===========================================

-- Add GDPR consent tracking to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS gdpr_consent_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gdpr_consent_version VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS gdpr_marketing_consent BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gdpr_analytics_consent BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gdpr_data_retention_agreed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gdpr_right_to_be_forgotten_requested TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gdpr_data_export_requested TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gdpr_last_privacy_review TIMESTAMP WITH TIME ZONE;

-- Add personal data classification to drivers
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS pii_data_encrypted BOOLEAN DEFAULT TRUE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS data_processing_consent_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS data_retention_period_days INTEGER DEFAULT 2555; -- 7 years default
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS gdpr_legal_basis VARCHAR(50); -- consent, contract, legal_obligation, vital_interest, public_task, legitimate_interest

-- Create GDPR data subject requests table
CREATE TABLE IF NOT EXISTS gdpr_data_requests (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER,
    request_type VARCHAR(50) NOT NULL, -- access, rectification, erasure, portability, restriction, objection
    subject_email VARCHAR(255) NOT NULL,
    subject_name VARCHAR(255),
    request_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE, -- Must respond within 30 days
    completed_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, completed, denied
    denial_reason TEXT,
    processed_by INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gdpr_requests_tenant ON gdpr_data_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_status ON gdpr_data_requests(status);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_due_date ON gdpr_data_requests(due_date);

-- ===========================================
-- SOX COMPLIANCE FIELDS
-- Sarbanes-Oxley Act (US Financial)
-- ===========================================

-- Add SOX compliance fields to financial transactions
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS sox_control_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS sox_verified_by INTEGER;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS sox_verified_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS sox_segregation_check BOOLEAN DEFAULT FALSE;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS sox_material_weakness_flag BOOLEAN DEFAULT FALSE;

-- Add SOX fields to approvals
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS sox_control_id VARCHAR(50);
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS sox_risk_level VARCHAR(20); -- low, medium, high, critical
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS sox_control_type VARCHAR(50); -- preventive, detective, corrective
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS sox_testing_status VARCHAR(20); -- not_tested, passed, failed, remediated

-- Create SOX controls registry
CREATE TABLE IF NOT EXISTS sox_controls (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER,
    control_id VARCHAR(50) NOT NULL,
    control_name VARCHAR(255) NOT NULL,
    control_description TEXT,
    control_category VARCHAR(100), -- financial_reporting, it_general, entity_level, transaction_level
    control_type VARCHAR(50), -- preventive, detective, corrective
    control_owner INTEGER,
    risk_level VARCHAR(20), -- low, medium, high, critical
    frequency VARCHAR(50), -- daily, weekly, monthly, quarterly, annually, continuous
    last_tested_date TIMESTAMP WITH TIME ZONE,
    last_test_result VARCHAR(20), -- passed, failed, not_applicable
    next_test_date TIMESTAMP WITH TIME ZONE,
    remediation_plan TEXT,
    remediation_due_date TIMESTAMP WITH TIME ZONE,
    is_key_control BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, control_id)
);

CREATE INDEX IF NOT EXISTS idx_sox_controls_tenant ON sox_controls(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sox_controls_category ON sox_controls(control_category);
CREATE INDEX IF NOT EXISTS idx_sox_controls_risk ON sox_controls(risk_level);

-- SOX control testing log
CREATE TABLE IF NOT EXISTS sox_control_tests (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER,
    control_id INTEGER REFERENCES sox_controls(id),
    test_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tester_id INTEGER,
    test_type VARCHAR(50), -- walkthrough, sample_test, full_test, automated
    sample_size INTEGER,
    exceptions_found INTEGER DEFAULT 0,
    test_result VARCHAR(20), -- passed, failed, inconclusive
    findings TEXT,
    recommendations TEXT,
    management_response TEXT,
    remediation_status VARCHAR(20), -- not_required, pending, in_progress, completed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sox_tests_control ON sox_control_tests(control_id);
CREATE INDEX IF NOT EXISTS idx_sox_tests_date ON sox_control_tests(test_date);

-- ===========================================
-- IFRS 15 COMPLIANCE FIELDS
-- Revenue Recognition Standard
-- ===========================================

-- Add IFRS 15 fields to sales/invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS ifrs15_contract_id VARCHAR(100);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS ifrs15_performance_obligation VARCHAR(255);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS ifrs15_transaction_price DECIMAL(15,2);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS ifrs15_standalone_selling_price DECIMAL(15,2);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS ifrs15_allocation_method VARCHAR(50); -- standalone, residual, adjusted_market
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS ifrs15_revenue_recognition_timing VARCHAR(50); -- point_in_time, over_time
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS ifrs15_progress_measure VARCHAR(50); -- output, input, straight_line
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS ifrs15_progress_percentage DECIMAL(5,2);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS ifrs15_variable_consideration DECIMAL(15,2);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS ifrs15_constraint_applied BOOLEAN DEFAULT FALSE;

-- Create IFRS 15 contracts table
CREATE TABLE IF NOT EXISTS ifrs15_contracts (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER,
    contract_number VARCHAR(100) NOT NULL,
    customer_id INTEGER,
    contract_date DATE NOT NULL,
    contract_start_date DATE,
    contract_end_date DATE,
    total_transaction_price DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'USD',
    contract_type VARCHAR(50), -- goods, services, combined, licensing
    modification_date DATE,
    modification_type VARCHAR(50), -- prospective, cumulative_catchup, separate_contract
    variable_consideration_estimate DECIMAL(15,2),
    constraint_amount DECIMAL(15,2),
    financing_component DECIMAL(15,2),
    noncash_consideration DECIMAL(15,2),
    consideration_payable_to_customer DECIMAL(15,2),
    status VARCHAR(20) DEFAULT 'active', -- draft, active, completed, terminated
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ifrs15_contracts_tenant ON ifrs15_contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ifrs15_contracts_customer ON ifrs15_contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_ifrs15_contracts_status ON ifrs15_contracts(status);

-- IFRS 15 performance obligations
CREATE TABLE IF NOT EXISTS ifrs15_performance_obligations (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER REFERENCES ifrs15_contracts(id),
    obligation_number INTEGER,
    description TEXT,
    standalone_selling_price DECIMAL(15,2),
    allocated_transaction_price DECIMAL(15,2),
    recognition_pattern VARCHAR(50), -- point_in_time, over_time
    satisfaction_criteria TEXT,
    progress_measure VARCHAR(50),
    current_progress_percentage DECIMAL(5,2) DEFAULT 0,
    recognized_revenue DECIMAL(15,2) DEFAULT 0,
    deferred_revenue DECIMAL(15,2) DEFAULT 0,
    is_distinct BOOLEAN DEFAULT TRUE,
    is_satisfied BOOLEAN DEFAULT FALSE,
    satisfaction_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ifrs15_obligations_contract ON ifrs15_performance_obligations(contract_id);

-- ===========================================
-- LOGISTICS COMPLIANCE FIELDS
-- DOT, FMCSA, ELD compliance (US Transportation)
-- ===========================================

-- Add compliance fields to vehicles
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS dot_number VARCHAR(20);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS mc_number VARCHAR(20);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS eld_device_id VARCHAR(100);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS eld_provider VARCHAR(100);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_dot_inspection_date DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS next_dot_inspection_due DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS dot_inspection_result VARCHAR(20); -- passed, failed, out_of_service
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS emissions_compliant BOOLEAN DEFAULT TRUE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS emissions_standard VARCHAR(50); -- euro6, epa2010, carb

-- Add compliance fields to drivers
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS cdl_number VARCHAR(50);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS cdl_class VARCHAR(10); -- A, B, C
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS cdl_endorsements VARCHAR(50); -- H, N, P, S, T, X
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS cdl_restrictions VARCHAR(50);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS cdl_expiry_date DATE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS medical_card_expiry_date DATE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS last_drug_test_date DATE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS drug_test_result VARCHAR(20); -- passed, failed, pending
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS last_alcohol_test_date DATE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS alcohol_test_result VARCHAR(20);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS hos_violation_count INTEGER DEFAULT 0;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS csa_score DECIMAL(5,2);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS psp_report_date DATE;

-- Add compliance fields to trips
ALTER TABLE trips ADD COLUMN IF NOT EXISTS eld_log_id VARCHAR(100);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS hos_compliant BOOLEAN DEFAULT TRUE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS hos_violation_type VARCHAR(50);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS pre_trip_inspection_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS post_trip_inspection_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS hazmat_placard_required BOOLEAN DEFAULT FALSE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS hazmat_class VARCHAR(20);

-- ===========================================
-- COMPLIANCE AUDIT TRAIL ENHANCEMENT
-- ===========================================

-- Add compliance-specific columns to audit_log
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS compliance_category VARCHAR(50); -- gdpr, sox, ifrs15, dot, fmcsa
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS compliance_control_id VARCHAR(50);
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS risk_level VARCHAR(20);
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS requires_review BOOLEAN DEFAULT FALSE;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS reviewed_by INTEGER;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

-- Create index for compliance queries
CREATE INDEX IF NOT EXISTS idx_audit_log_compliance ON audit_log(compliance_category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_review ON audit_log(requires_review, reviewed_at);

-- ===========================================
-- COMPLIANCE SUMMARY VIEW
-- ===========================================

CREATE OR REPLACE VIEW compliance_summary AS
SELECT 
    'GDPR' as compliance_type,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_items,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_items,
    COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'completed') as overdue_items
FROM gdpr_data_requests
UNION ALL
SELECT 
    'SOX' as compliance_type,
    COUNT(*) FILTER (WHERE last_test_result = 'failed') as pending_items,
    COUNT(*) FILTER (WHERE last_test_result = 'passed') as completed_items,
    COUNT(*) FILTER (WHERE next_test_date < NOW()) as overdue_items
FROM sox_controls
WHERE is_active = TRUE;

COMMENT ON TABLE gdpr_data_requests IS 'GDPR data subject requests tracking for EU compliance';
COMMENT ON TABLE sox_controls IS 'SOX internal controls registry for Sarbanes-Oxley compliance';
COMMENT ON TABLE sox_control_tests IS 'SOX control testing history and results';
COMMENT ON TABLE ifrs15_contracts IS 'IFRS 15 revenue contracts for proper revenue recognition';
COMMENT ON TABLE ifrs15_performance_obligations IS 'IFRS 15 performance obligations per contract';
