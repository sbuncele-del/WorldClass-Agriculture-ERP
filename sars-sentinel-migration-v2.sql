-- ============================================================================
-- SARS SENTINEL - TAX COMPLIANCE MANAGEMENT
-- Migration for aetheros_erp database
-- ============================================================================

-- SARS Correspondence Types
CREATE TABLE IF NOT EXISTS sars_correspondence_types (
    type_id SERIAL PRIMARY KEY,
    
    type_code VARCHAR(50) NOT NULL UNIQUE,
    type_name VARCHAR(200) NOT NULL,
    description TEXT,
    
    category VARCHAR(50), -- VAT, PAYE, INCOME_TAX, CIT, etc.
    
    -- Default Settings
    default_urgency VARCHAR(20) DEFAULT 'MEDIUM',
    default_response_days INTEGER DEFAULT 21,
    
    -- Workflow Template
    workflow_template_id INTEGER,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Pre-populate SARS correspondence types
INSERT INTO sars_correspondence_types (type_code, type_name, category, default_urgency, default_response_days) VALUES
-- VAT
('VAT_VERIFICATION', 'VAT Verification Request', 'VAT', 'HIGH', 21),
('VAT_AUDIT', 'VAT Audit Notice', 'VAT', 'CRITICAL', 21),
('VAT_REFUND_QUERY', 'VAT Refund Query', 'VAT', 'HIGH', 14),
('VAT_201_QUERY', 'VAT201 Return Query', 'VAT', 'MEDIUM', 21),
-- PAYE
('PAYE_RECONCILIATION', 'PAYE Reconciliation Query', 'PAYE', 'HIGH', 21),
('PAYE_AUDIT', 'PAYE Audit Notice', 'PAYE', 'CRITICAL', 21),
('PAYE_EMP201_QUERY', 'EMP201 Return Query', 'PAYE', 'MEDIUM', 21),
-- Income Tax
('ITA_ASSESSMENT', 'Income Tax Assessment', 'INCOME_TAX', 'HIGH', 30),
('ITA_VERIFICATION', 'Income Tax Verification', 'INCOME_TAX', 'MEDIUM', 21),
('ITA_AUDIT', 'Income Tax Audit', 'INCOME_TAX', 'CRITICAL', 30),
-- Corporate Tax
('CIT_ASSESSMENT', 'Corporate Income Tax Assessment', 'CIT', 'HIGH', 30),
('CIT_AUDIT', 'Corporate Tax Audit', 'CIT', 'CRITICAL', 30),
-- Other
('SDL_QUERY', 'SDL Query', 'SDL', 'MEDIUM', 21),
('UIF_QUERY', 'UIF Query', 'UIF', 'MEDIUM', 21),
('CUSTOMS_DUTY', 'Customs Duty Query', 'CUSTOMS', 'HIGH', 14),
('PENALTY_INTEREST', 'Penalty and Interest Notice', 'GENERAL', 'HIGH', 21)
ON CONFLICT (type_code) DO NOTHING;


-- SARS Correspondence (without generated column - we'll compute days_to_deadline in the application)
CREATE TABLE IF NOT EXISTS sars_correspondence (
    correspondence_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    -- Reference
    reference_number VARCHAR(100) NOT NULL,
    sars_reference VARCHAR(100), -- SARS's own reference
    
    correspondence_type_id INTEGER NOT NULL REFERENCES sars_correspondence_types(type_id),
    
    -- Client/Entity
    client_id UUID,
    client_name VARCHAR(200),
    taxpayer_number VARCHAR(50),
    
    -- Document Details
    subject VARCHAR(500) NOT NULL,
    description TEXT,
    
    document_url VARCHAR(500),
    attachments TEXT[], -- Array of attachment URLs
    
    -- Dates
    received_date DATE NOT NULL DEFAULT CURRENT_DATE,
    deadline_date DATE NOT NULL,
    
    -- Urgency
    urgency_level VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    auto_escalate BOOLEAN DEFAULT true,
    
    -- Tax Period
    tax_period VARCHAR(20), -- 202411, 2024-FY, etc.
    tax_year INTEGER,
    
    -- Assignment
    assigned_to UUID,
    assigned_date TIMESTAMP,
    assigned_by UUID,
    
    -- Status
    status VARCHAR(50) DEFAULT 'NEW', -- NEW, IN_PROGRESS, REVIEW, SUBMITTED, COMPLETED, CLOSED
    
    -- Response
    response_date TIMESTAMP,
    response_submitted_by UUID,
    response_method VARCHAR(50), -- EFILING, EMAIL, POST, IN_PERSON
    response_reference VARCHAR(100),
    response_document_url VARCHAR(500),
    
    -- Outcome
    outcome VARCHAR(50), -- ACCEPTED, PARTIALLY_ACCEPTED, REJECTED, APPEALING
    outcome_notes TEXT,
    closure_date TIMESTAMP,
    
    -- Financial Impact
    amount_assessed DECIMAL(15,2),
    amount_disputed DECIMAL(15,2),
    amount_paid DECIMAL(15,2),
    
    -- Workflow
    workflow_id INTEGER,
    current_step INTEGER,
    
    -- Alerts
    reminder_sent BOOLEAN DEFAULT false,
    escalation_sent BOOLEAN DEFAULT false,
    
    -- AI Analysis
    ai_summary TEXT,
    ai_suggested_actions TEXT[],
    ai_risk_score INTEGER, -- 0-100
    
    is_archived BOOLEAN DEFAULT false,
    
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_sars_reference_tenant UNIQUE (tenant_id, reference_number)
);

CREATE INDEX IF NOT EXISTS idx_sars_correspondence_tenant ON sars_correspondence(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sars_correspondence_type ON sars_correspondence(correspondence_type_id);
CREATE INDEX IF NOT EXISTS idx_sars_correspondence_client ON sars_correspondence(client_id);
CREATE INDEX IF NOT EXISTS idx_sars_correspondence_status ON sars_correspondence(status);
CREATE INDEX IF NOT EXISTS idx_sars_correspondence_deadline ON sars_correspondence(deadline_date);
CREATE INDEX IF NOT EXISTS idx_sars_correspondence_urgency ON sars_correspondence(urgency_level);


-- SARS Correspondence Comments
CREATE TABLE IF NOT EXISTS sars_correspondence_comments (
    comment_id SERIAL PRIMARY KEY,
    correspondence_id INTEGER NOT NULL REFERENCES sars_correspondence(correspondence_id) ON DELETE CASCADE,
    
    comment_text TEXT NOT NULL,
    
    -- Visibility
    is_internal BOOLEAN DEFAULT true,
    is_client_visible BOOLEAN DEFAULT false,
    
    created_by UUID,
    created_by_name VARCHAR(200),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sars_comments_correspondence ON sars_correspondence_comments(correspondence_id);


-- SARS Workflows
CREATE TABLE IF NOT EXISTS sars_workflows (
    workflow_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    correspondence_id INTEGER NOT NULL REFERENCES sars_correspondence(correspondence_id),
    
    workflow_name VARCHAR(200) NOT NULL,
    workflow_type VARCHAR(50), -- STANDARD, CUSTOM, AI_GENERATED
    
    total_steps INTEGER NOT NULL,
    completed_steps INTEGER DEFAULT 0,
    
    status VARCHAR(50) DEFAULT 'IN_PROGRESS', -- IN_PROGRESS, COMPLETED, CANCELLED
    
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sars_workflows_correspondence ON sars_workflows(correspondence_id);


-- SARS Workflow Steps
CREATE TABLE IF NOT EXISTS sars_workflow_steps (
    step_id SERIAL PRIMARY KEY,
    workflow_id INTEGER NOT NULL REFERENCES sars_workflows(workflow_id) ON DELETE CASCADE,
    
    step_number INTEGER NOT NULL,
    step_title VARCHAR(200) NOT NULL,
    step_description TEXT,
    
    -- Assignment
    assigned_to UUID,
    assigned_to_name VARCHAR(200),
    
    -- Status
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, SKIPPED
    
    due_date DATE,
    
    completed_date TIMESTAMP,
    completed_by UUID,
    completion_notes TEXT,
    
    -- Attachments
    attachments TEXT[],
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sars_workflow_steps_workflow ON sars_workflow_steps(workflow_id);


-- SARS Submission History
CREATE TABLE IF NOT EXISTS sars_submission_history (
    submission_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    client_id UUID,
    taxpayer_number VARCHAR(50),
    
    -- Submission Details
    submission_type VARCHAR(50) NOT NULL, -- VAT201, EMP201, IT12, IT14, etc.
    tax_period VARCHAR(20) NOT NULL,
    
    submission_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted_by UUID,
    submitted_by_name VARCHAR(200),
    
    -- eFiling Details
    efiling_reference VARCHAR(100),
    submission_method VARCHAR(50), -- EFILING, MANUAL, API
    
    -- Status
    status VARCHAR(50) DEFAULT 'SUBMITTED', -- SUBMITTED, ACCEPTED, REJECTED, PENDING
    
    sars_response TEXT,
    response_date TIMESTAMP,
    
    -- Financial
    amount_payable DECIMAL(15,2),
    amount_refundable DECIMAL(15,2),
    
    -- Document
    submission_document_url VARCHAR(500),
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sars_submission_tenant ON sars_submission_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sars_submission_client ON sars_submission_history(client_id);
CREATE INDEX IF NOT EXISTS idx_sars_submission_type ON sars_submission_history(submission_type);
CREATE INDEX IF NOT EXISTS idx_sars_submission_date ON sars_submission_history(submission_date DESC);


-- SARS Deadline Calendar
CREATE TABLE IF NOT EXISTS sars_deadline_calendar (
    deadline_id SERIAL PRIMARY KEY,
    
    deadline_type VARCHAR(50) NOT NULL, -- VAT201, EMP201, IT12, etc.
    description VARCHAR(300) NOT NULL,
    
    -- Frequency
    frequency VARCHAR(50) NOT NULL, -- MONTHLY, BI_MONTHLY, ANNUALLY
    
    -- Due Day
    due_day_of_month INTEGER, -- For monthly submissions
    due_month INTEGER, -- For annual submissions
    
    -- Applicable To
    taxpayer_categories VARCHAR(50)[], -- VENDOR, EMPLOYER, COMPANY, etc.
    
    -- Reminders
    reminder_days_before INTEGER[] DEFAULT ARRAY[7, 3, 1],
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Pre-populate common SARS deadlines
INSERT INTO sars_deadline_calendar (deadline_type, description, frequency, due_day_of_month, taxpayer_categories) VALUES
('VAT201', 'VAT Return (Category A)', 'MONTHLY', 25, ARRAY['VENDOR_CATEGORY_A']),
('VAT201', 'VAT Return (Category B)', 'BI_MONTHLY', 25, ARRAY['VENDOR_CATEGORY_B']),
('EMP201', 'PAYE Monthly Declaration', 'MONTHLY', 7, ARRAY['EMPLOYER']),
('EMP501', 'PAYE Annual Reconciliation', 'ANNUALLY', NULL, ARRAY['EMPLOYER']),
('IT14', 'Provisional Tax Return', 'BI_ANNUALLY', NULL, ARRAY['PROVISIONAL_TAXPAYER'])
ON CONFLICT DO NOTHING;


-- Add comments
COMMENT ON TABLE sars_correspondence_types IS 'SARS correspondence type definitions';
COMMENT ON TABLE sars_correspondence IS 'SARS tax correspondence and verification requests';
COMMENT ON TABLE sars_correspondence_comments IS 'Comments on SARS correspondence';
COMMENT ON TABLE sars_workflows IS 'Workflows for processing SARS correspondence';
COMMENT ON TABLE sars_workflow_steps IS 'Individual steps within SARS workflows';
COMMENT ON TABLE sars_submission_history IS 'History of SARS submissions (VAT201, EMP201, etc.)';
COMMENT ON TABLE sars_deadline_calendar IS 'SARS deadline calendar and reminder configuration';

-- Add tenant_id index on deadline calendar if needed
CREATE INDEX IF NOT EXISTS idx_sars_deadline_type ON sars_deadline_calendar(deadline_type);
