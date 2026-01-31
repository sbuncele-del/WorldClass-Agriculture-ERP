-- ============================================================================
-- SARS Schema Tables
-- Tax returns, VAT returns, PAYE submissions, Tax certificates
-- ============================================================================

-- Create SARS schema
CREATE SCHEMA IF NOT EXISTS sars;

-- Tax Returns
CREATE TABLE IF NOT EXISTS sars.tax_returns (
    tax_return_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    return_type VARCHAR(50) NOT NULL, -- IT12, IT14, IRP5, etc.
    tax_year INTEGER NOT NULL,
    
    period_start DATE,
    period_end DATE,
    due_date DATE NOT NULL,
    
    status VARCHAR(50) DEFAULT 'DRAFT', -- DRAFT, PENDING, SUBMITTED, ACCEPTED, REJECTED
    
    taxable_income DECIMAL(15,2),
    tax_payable DECIMAL(15,2),
    tax_paid DECIMAL(15,2),
    
    sars_reference VARCHAR(100),
    submission_date TIMESTAMP,
    
    notes TEXT,
    
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sars_tax_returns_tenant ON sars.tax_returns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sars_tax_returns_year ON sars.tax_returns(tax_year);
CREATE INDEX IF NOT EXISTS idx_sars_tax_returns_due ON sars.tax_returns(due_date);


-- VAT Returns
CREATE TABLE IF NOT EXISTS sars.vat_returns (
    vat_return_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    vat_number VARCHAR(50),
    
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    due_date DATE NOT NULL,
    
    status VARCHAR(50) DEFAULT 'DRAFT', -- DRAFT, PENDING, SUBMITTED, ACCEPTED, REJECTED
    
    -- VAT Figures
    output_vat DECIMAL(15,2) DEFAULT 0,
    input_vat DECIMAL(15,2) DEFAULT 0,
    vat_payable DECIMAL(15,2) DEFAULT 0,
    vat_refundable DECIMAL(15,2) DEFAULT 0,
    
    -- Standard VAT201 fields
    total_standard_rated DECIMAL(15,2) DEFAULT 0,
    total_zero_rated DECIMAL(15,2) DEFAULT 0,
    total_exempt DECIMAL(15,2) DEFAULT 0,
    capital_goods_vat DECIMAL(15,2) DEFAULT 0,
    
    sars_reference VARCHAR(100),
    submission_date TIMESTAMP,
    
    notes TEXT,
    
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sars_vat_returns_tenant ON sars.vat_returns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sars_vat_returns_period ON sars.vat_returns(period_end);
CREATE INDEX IF NOT EXISTS idx_sars_vat_returns_due ON sars.vat_returns(due_date);


-- PAYE Submissions (EMP201)
CREATE TABLE IF NOT EXISTS sars.paye_submissions (
    paye_submission_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    paye_reference VARCHAR(50),
    
    tax_year INTEGER NOT NULL,
    month INTEGER NOT NULL, -- 1-12
    
    due_date DATE NOT NULL,
    
    status VARCHAR(50) DEFAULT 'DRAFT', -- DRAFT, PENDING, SUBMITTED, ACCEPTED, REJECTED
    
    -- PAYE Figures
    total_employees INTEGER DEFAULT 0,
    gross_remuneration DECIMAL(15,2) DEFAULT 0,
    paye_deducted DECIMAL(15,2) DEFAULT 0,
    uif_employee DECIMAL(15,2) DEFAULT 0,
    uif_employer DECIMAL(15,2) DEFAULT 0,
    sdl_amount DECIMAL(15,2) DEFAULT 0,
    total_payable DECIMAL(15,2) DEFAULT 0,
    
    sars_reference VARCHAR(100),
    submission_date TIMESTAMP,
    
    notes TEXT,
    
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sars_paye_tenant ON sars.paye_submissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sars_paye_year_month ON sars.paye_submissions(tax_year, month);
CREATE INDEX IF NOT EXISTS idx_sars_paye_due ON sars.paye_submissions(due_date);


-- Tax Certificates (IT3, IRP5, etc.)
CREATE TABLE IF NOT EXISTS sars.tax_certificates (
    certificate_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    certificate_type VARCHAR(50) NOT NULL, -- IT3(a), IT3(b), IRP5, etc.
    certificate_number VARCHAR(100),
    
    tax_year INTEGER NOT NULL,
    
    -- Recipient
    recipient_name VARCHAR(200),
    recipient_id_number VARCHAR(20),
    recipient_tax_number VARCHAR(20),
    
    -- Source
    source_name VARCHAR(200),
    source_tax_number VARCHAR(20),
    
    -- Amounts
    gross_amount DECIMAL(15,2) DEFAULT 0,
    tax_deducted DECIMAL(15,2) DEFAULT 0,
    nett_amount DECIMAL(15,2) DEFAULT 0,
    
    issue_date DATE,
    document_url VARCHAR(500),
    
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sars_certificates_tenant ON sars.tax_certificates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sars_certificates_year ON sars.tax_certificates(tax_year);
CREATE INDEX IF NOT EXISTS idx_sars_certificates_recipient ON sars.tax_certificates(recipient_id_number);


-- Add comments
COMMENT ON SCHEMA sars IS 'SARS tax compliance schema';
COMMENT ON TABLE sars.tax_returns IS 'Income tax returns (IT12, IT14)';
COMMENT ON TABLE sars.vat_returns IS 'VAT201 returns';
COMMENT ON TABLE sars.paye_submissions IS 'EMP201 monthly PAYE submissions';
COMMENT ON TABLE sars.tax_certificates IS 'Tax certificates (IT3, IRP5)';
