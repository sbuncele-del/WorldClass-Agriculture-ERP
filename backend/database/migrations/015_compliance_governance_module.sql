-- ============================================================================
-- COMPLIANCE & GOVERNANCE MODULE - DATABASE SCHEMA
-- Worldclass ERP Software
-- Created: November 13, 2025
-- ============================================================================

-- ============================================================================
-- 1. REGULATORY FRAMEWORKS & REQUIREMENTS
-- ============================================================================

-- Regulatory Frameworks
CREATE TABLE IF NOT EXISTS regulatory_frameworks (
    framework_id SERIAL PRIMARY KEY,
    
    framework_code VARCHAR(50) NOT NULL UNIQUE,
    framework_name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Classification
    jurisdiction VARCHAR(100), -- South Africa, EU, USA, etc.
    category VARCHAR(50), -- FINANCIAL, LABOR, DATA_PROTECTION, ENVIRONMENTAL, etc.
    
    -- Authority
    regulatory_body VARCHAR(200), -- FSCA, SARS, ICO, SEC, etc.
    website_url VARCHAR(500),
    
    -- Applicability
    industry VARCHAR(100)[], -- Array of applicable industries
    company_size VARCHAR(50)[], -- SMALL, MEDIUM, LARGE, ALL
    
    effective_date DATE,
    review_frequency_months INTEGER, -- How often to review compliance
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_regulatory_frameworks_active ON regulatory_frameworks(is_active);
CREATE INDEX IF NOT EXISTS idx_regulatory_frameworks_category ON regulatory_frameworks(category);

-- Pre-populate South African regulatory frameworks
INSERT INTO regulatory_frameworks (framework_code, framework_name, description, jurisdiction, category, regulatory_body, review_frequency_months) VALUES
-- Financial
('FICA', 'Financial Intelligence Centre Act', 'Anti-money laundering and counter-terrorism financing', 'South Africa', 'FINANCIAL', 'Financial Intelligence Centre', 12),
('FSR', 'Financial Sector Regulation Act', 'Financial services regulation and supervision', 'South Africa', 'FINANCIAL', 'FSCA', 12),
('KING_IV', 'King IV Code on Corporate Governance', 'Corporate governance principles', 'South Africa', 'GOVERNANCE', 'IoDSA', 12),
-- Tax
('TAA', 'Tax Administration Act', 'Tax administration and compliance', 'South Africa', 'TAX', 'SARS', 6),
('VAT_ACT', 'Value-Added Tax Act', 'VAT compliance and reporting', 'South Africa', 'TAX', 'SARS', 6),
('ITA', 'Income Tax Act', 'Income tax compliance', 'South Africa', 'TAX', 'SARS', 12),
-- Labor
('BCEA', 'Basic Conditions of Employment Act', 'Employment standards and conditions', 'South Africa', 'LABOR', 'Department of Employment and Labour', 12),
('LRA', 'Labour Relations Act', 'Labor relations and dispute resolution', 'South Africa', 'LABOR', 'Department of Employment and Labour', 12),
('EEA', 'Employment Equity Act', 'Employment equity and transformation', 'South Africa', 'LABOR', 'Department of Employment and Labour', 12),
('SDA', 'Skills Development Act', 'Skills development and training', 'South Africa', 'LABOR', 'Department of Higher Education', 12),
('COIDA', 'Compensation for Occupational Injuries and Diseases Act', 'Workplace injury compensation', 'South Africa', 'LABOR', 'Compensation Fund', 12),
-- Data Protection
('POPIA', 'Protection of Personal Information Act', 'Data privacy and protection', 'South Africa', 'DATA_PROTECTION', 'Information Regulator', 6),
('ECT_ACT', 'Electronic Communications and Transactions Act', 'E-commerce and electronic transactions', 'South Africa', 'DATA_PROTECTION', 'ICASA', 12),
-- Health & Safety
('OHS_ACT', 'Occupational Health and Safety Act', 'Workplace health and safety', 'South Africa', 'HEALTH_SAFETY', 'Department of Employment and Labour', 6),
-- Companies
('COMPANIES_ACT', 'Companies Act 71 of 2008', 'Company formation, governance, and compliance', 'South Africa', 'CORPORATE', 'CIPC', 12),
('CIPC_ANNUAL', 'CIPC Annual Returns', 'Annual company returns and filings', 'South Africa', 'CORPORATE', 'CIPC', 12)
ON CONFLICT (framework_code) DO NOTHING;


-- Compliance Requirements
CREATE TABLE IF NOT EXISTS compliance_requirements (
    requirement_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    framework_id INTEGER NOT NULL REFERENCES regulatory_frameworks(framework_id),
    
    requirement_code VARCHAR(100) NOT NULL,
    requirement_name VARCHAR(300) NOT NULL,
    description TEXT,
    
    -- Obligation Details
    obligation_type VARCHAR(50), -- REPORTING, DOCUMENTATION, TRAINING, POLICY, PROCESS, etc.
    frequency VARCHAR(50), -- MONTHLY, QUARTERLY, ANNUALLY, ONCE_OFF, CONTINUOUS
    
    -- Responsibility
    responsible_role VARCHAR(100),
    department VARCHAR(100),
    
    -- Deadlines
    due_date_type VARCHAR(50), -- FIXED_DATE, RELATIVE_TO_EVENT, ONGOING
    due_date DATE,
    days_before_warning INTEGER DEFAULT 30,
    
    -- Risk
    criticality VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    non_compliance_penalty TEXT,
    
    -- Documentation
    reference_documents TEXT[],
    checklist_items TEXT[],
    
    is_active BOOLEAN DEFAULT true,
    
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_criticality CHECK (criticality IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'))
);

CREATE INDEX IF NOT EXISTS idx_compliance_requirements_tenant ON compliance_requirements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_compliance_requirements_framework ON compliance_requirements(framework_id);
CREATE INDEX IF NOT EXISTS idx_compliance_requirements_active ON compliance_requirements(is_active);

-- Pre-populate common requirements
INSERT INTO compliance_requirements (framework_id, requirement_code, requirement_name, description, obligation_type, frequency, criticality) VALUES
-- POPIA
((SELECT framework_id FROM regulatory_frameworks WHERE framework_code = 'POPIA'), 'POPIA_CONSENT', 'Obtain Data Subject Consent', 'Obtain explicit consent for personal data processing', 'PROCESS', 'CONTINUOUS', 'CRITICAL'),
((SELECT framework_id FROM regulatory_frameworks WHERE framework_code = 'POPIA'), 'POPIA_TRAINING', 'Staff Data Protection Training', 'Annual training on data protection compliance', 'TRAINING', 'ANNUALLY', 'HIGH'),
((SELECT framework_id FROM regulatory_frameworks WHERE framework_code = 'POPIA'), 'POPIA_BREACH', 'Data Breach Response Plan', 'Maintain and test data breach response procedures', 'DOCUMENTATION', 'ANNUALLY', 'CRITICAL'),
-- FICA
((SELECT framework_id FROM regulatory_frameworks WHERE framework_code = 'FICA'), 'FICA_KYC', 'Know Your Customer (KYC)', 'Customer due diligence and verification', 'PROCESS', 'CONTINUOUS', 'CRITICAL'),
((SELECT framework_id FROM regulatory_frameworks WHERE framework_code = 'FICA'), 'FICA_STR', 'Suspicious Transaction Reporting', 'Report suspicious transactions to FIC', 'REPORTING', 'AS_REQUIRED', 'CRITICAL'),
-- Companies Act
((SELECT framework_id FROM regulatory_frameworks WHERE framework_code = 'COMPANIES_ACT'), 'COMP_ANNUAL_FS', 'Annual Financial Statements', 'Prepare and file annual financial statements', 'REPORTING', 'ANNUALLY', 'HIGH'),
((SELECT framework_id FROM regulatory_frameworks WHERE framework_code = 'COMPANIES_ACT'), 'COMP_AGM', 'Annual General Meeting', 'Hold annual general meeting within 15 months', 'PROCESS', 'ANNUALLY', 'HIGH'),
-- EEA
((SELECT framework_id FROM regulatory_frameworks WHERE framework_code = 'EEA'), 'EEA_REPORT', 'Employment Equity Report', 'Submit annual EE report to Department of Labour', 'REPORTING', 'ANNUALLY', 'HIGH')
ON CONFLICT DO NOTHING;


-- Compliance Status Tracking
CREATE TABLE IF NOT EXISTS compliance_status (
    status_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    requirement_id INTEGER NOT NULL REFERENCES compliance_requirements(requirement_id),
    
    -- Period
    compliance_period VARCHAR(50), -- 2024-Q1, 2024-FY, etc.
    period_start_date DATE,
    period_end_date DATE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'NOT_STARTED', -- NOT_STARTED, IN_PROGRESS, COMPLETED, OVERDUE, NON_COMPLIANT
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    
    due_date DATE,
    completed_date DATE,
    
    -- Responsibility
    assigned_to UUID,
    reviewed_by UUID,
    approved_by UUID,
    
    -- Evidence
    evidence_documents TEXT[], -- Array of document URLs/paths
    notes TEXT,
    
    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_status CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'NON_COMPLIANT'))
);

CREATE INDEX IF NOT EXISTS idx_compliance_status_tenant ON compliance_status(tenant_id);
CREATE INDEX IF NOT EXISTS idx_compliance_status_requirement ON compliance_status(requirement_id);
CREATE INDEX IF NOT EXISTS idx_compliance_status_status ON compliance_status(status);
CREATE INDEX IF NOT EXISTS idx_compliance_status_due_date ON compliance_status(due_date);


-- ============================================================================
-- 2. RISK MANAGEMENT
-- ============================================================================

-- Risk Categories
CREATE TABLE IF NOT EXISTS risk_categories (
    category_id SERIAL PRIMARY KEY,
    
    category_code VARCHAR(50) NOT NULL UNIQUE,
    category_name VARCHAR(200) NOT NULL,
    description TEXT,
    
    parent_category_id INTEGER REFERENCES risk_categories(category_id),
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Pre-populate risk categories
INSERT INTO risk_categories (category_code, category_name, description) VALUES
('FINANCIAL', 'Financial Risk', 'Risks related to financial loss or instability'),
('OPERATIONAL', 'Operational Risk', 'Risks from operational processes and systems'),
('COMPLIANCE', 'Compliance Risk', 'Risks of regulatory non-compliance'),
('STRATEGIC', 'Strategic Risk', 'Risks affecting strategic goals'),
('REPUTATIONAL', 'Reputational Risk', 'Risks to company reputation'),
('CYBERSECURITY', 'Cybersecurity Risk', 'IT security and data breach risks'),
('HUMAN_RESOURCES', 'Human Resources Risk', 'Employee-related risks'),
('LEGAL', 'Legal Risk', 'Litigation and legal dispute risks'),
('ENVIRONMENTAL', 'Environmental Risk', 'Environmental impact and sustainability risks'),
('SUPPLY_CHAIN', 'Supply Chain Risk', 'Supplier and logistics risks')
ON CONFLICT (category_code) DO NOTHING;


-- Risk Register
CREATE TABLE IF NOT EXISTS risk_register (
    risk_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    risk_code VARCHAR(50) NOT NULL,
    risk_title VARCHAR(300) NOT NULL,
    risk_description TEXT,
    
    category_id INTEGER NOT NULL REFERENCES risk_categories(category_id),
    
    -- Risk Owner
    risk_owner_id UUID,
    risk_owner_name VARCHAR(200),
    department VARCHAR(100),
    
    -- Risk Assessment (Inherent Risk - before controls)
    inherent_likelihood INTEGER, -- 1-5 scale
    inherent_impact INTEGER, -- 1-5 scale
    inherent_risk_score INTEGER, -- likelihood × impact
    
    -- Current Controls
    current_controls TEXT,
    control_effectiveness VARCHAR(20), -- INEFFECTIVE, PARTIALLY_EFFECTIVE, EFFECTIVE
    
    -- Residual Risk (after controls)
    residual_likelihood INTEGER, -- 1-5 scale
    residual_impact INTEGER, -- 1-5 scale
    residual_risk_score INTEGER, -- likelihood × impact
    
    -- Risk Response
    risk_response VARCHAR(50), -- ACCEPT, MITIGATE, TRANSFER, AVOID
    mitigation_actions TEXT,
    
    -- Target Risk (desired state)
    target_likelihood INTEGER,
    target_impact INTEGER,
    target_risk_score INTEGER,
    
    -- Timeline
    identified_date DATE NOT NULL DEFAULT CURRENT_DATE,
    target_resolution_date DATE,
    last_review_date DATE,
    next_review_date DATE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'IDENTIFIED', -- IDENTIFIED, ASSESSING, MITIGATING, MONITORING, CLOSED
    
    -- Linked Items
    linked_compliance_requirements INTEGER[],
    linked_incidents INTEGER[],
    
    is_active BOOLEAN DEFAULT true,
    
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_likelihood CHECK (inherent_likelihood BETWEEN 1 AND 5 AND residual_likelihood BETWEEN 1 AND 5),
    CONSTRAINT chk_impact CHECK (inherent_impact BETWEEN 1 AND 5 AND residual_impact BETWEEN 1 AND 5)
);

CREATE INDEX IF NOT EXISTS idx_risk_register_tenant ON risk_register(tenant_id);
CREATE INDEX IF NOT EXISTS idx_risk_register_category ON risk_register(category_id);
CREATE INDEX IF NOT EXISTS idx_risk_register_owner ON risk_register(risk_owner_id);
CREATE INDEX IF NOT EXISTS idx_risk_register_status ON risk_register(status);


-- Risk Assessments (periodic evaluations)
CREATE TABLE IF NOT EXISTS risk_assessments (
    assessment_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    risk_id INTEGER NOT NULL REFERENCES risk_register(risk_id),
    
    assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    assessed_by UUID,
    assessor_name VARCHAR(200),
    
    -- Updated Assessment
    likelihood INTEGER, -- 1-5
    impact INTEGER, -- 1-5
    risk_score INTEGER, -- likelihood × impact
    
    control_effectiveness VARCHAR(20),
    control_gaps TEXT,
    
    recommendations TEXT,
    action_items TEXT[],
    
    -- Status Change
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    
    notes TEXT,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_risk_assessments_risk ON risk_assessments(risk_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_date ON risk_assessments(assessment_date DESC);


-- ============================================================================
-- 3. POLICIES & PROCEDURES
-- ============================================================================

-- Policy Categories
CREATE TABLE IF NOT EXISTS policy_categories (
    category_id SERIAL PRIMARY KEY,
    
    category_name VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Pre-populate policy categories
INSERT INTO policy_categories (category_name, description) VALUES
('HR & Employment', 'Human resources and employment policies'),
('Information Security', 'IT security and data protection policies'),
('Financial', 'Financial management and accounting policies'),
('Compliance', 'Regulatory compliance policies'),
('Operations', 'Operational procedures and standards'),
('Health & Safety', 'Workplace health and safety policies'),
('Ethics & Conduct', 'Code of conduct and ethics policies'),
('Quality Management', 'Quality assurance and control policies')
ON CONFLICT (category_name) DO NOTHING;


-- Policies
CREATE TABLE IF NOT EXISTS policies (
    policy_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    policy_code VARCHAR(50) NOT NULL,
    policy_title VARCHAR(300) NOT NULL,
    policy_description TEXT,
    
    category_id INTEGER NOT NULL REFERENCES policy_categories(category_id),
    
    -- Content
    policy_document_url VARCHAR(500),
    policy_content TEXT,
    
    -- Version Control
    version VARCHAR(20) NOT NULL DEFAULT '1.0',
    version_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Approval
    author_id UUID,
    author_name VARCHAR(200),
    
    approved_by UUID,
    approved_by_name VARCHAR(200),
    approval_date DATE,
    
    -- Effective Dates
    effective_date DATE NOT NULL,
    review_date DATE,
    next_review_date DATE,
    review_frequency_months INTEGER DEFAULT 12,
    
    -- Status
    status VARCHAR(50) DEFAULT 'DRAFT', -- DRAFT, PENDING_APPROVAL, APPROVED, PUBLISHED, ARCHIVED
    
    -- Applicability
    applies_to VARCHAR(50)[], -- ALL_STAFF, MANAGERS, EXECUTIVES, SPECIFIC_DEPARTMENTS, etc.
    mandatory_acknowledgment BOOLEAN DEFAULT false,
    
    -- Linked Items
    linked_compliance_requirements INTEGER[],
    linked_risks INTEGER[],
    
    is_active BOOLEAN DEFAULT true,
    
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_policy_code_tenant UNIQUE (tenant_id, policy_code)
);

CREATE INDEX IF NOT EXISTS idx_policies_tenant ON policies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_policies_category ON policies(category_id);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);


-- Policy Acknowledgments
CREATE TABLE IF NOT EXISTS policy_acknowledgments (
    acknowledgment_id SERIAL PRIMARY KEY,
    
    policy_id INTEGER NOT NULL REFERENCES policies(policy_id),
    user_id UUID NOT NULL,
    
    acknowledged_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(50),
    
    -- Version acknowledged
    policy_version VARCHAR(20),
    
    CONSTRAINT uq_policy_user UNIQUE (policy_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_policy_acknowledgments_policy ON policy_acknowledgments(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_acknowledgments_user ON policy_acknowledgments(user_id);


-- Policy Violations
CREATE TABLE IF NOT EXISTS policy_violations (
    violation_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    policy_id INTEGER NOT NULL REFERENCES policies(policy_id),
    
    -- Violator
    violator_user_id UUID,
    violator_name VARCHAR(200),
    department VARCHAR(100),
    
    -- Incident Details
    violation_date DATE NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    
    -- Investigation
    reported_by UUID,
    reported_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    investigated_by UUID,
    investigation_notes TEXT,
    investigation_completed_date DATE,
    
    -- Resolution
    disciplinary_action TEXT,
    corrective_actions TEXT,
    
    resolution_date DATE,
    resolved_by UUID,
    
    status VARCHAR(50) DEFAULT 'REPORTED', -- REPORTED, INVESTIGATING, RESOLVED, CLOSED
    
    is_confidential BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_policy_violations_tenant ON policy_violations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_policy_violations_policy ON policy_violations(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_violations_status ON policy_violations(status);


-- ============================================================================
-- 4. INCIDENT MANAGEMENT
-- ============================================================================

-- Incident Types
CREATE TABLE IF NOT EXISTS incident_types (
    type_id SERIAL PRIMARY KEY,
    
    type_code VARCHAR(50) NOT NULL UNIQUE,
    type_name VARCHAR(200) NOT NULL,
    description TEXT,
    
    category VARCHAR(50), -- SECURITY, COMPLIANCE, SAFETY, OPERATIONAL, etc.
    severity_default VARCHAR(20) DEFAULT 'MEDIUM',
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Pre-populate incident types
INSERT INTO incident_types (type_code, type_name, category, severity_default) VALUES
('DATA_BREACH', 'Data Breach', 'SECURITY', 'CRITICAL'),
('CYBER_ATTACK', 'Cyber Attack', 'SECURITY', 'CRITICAL'),
('WORKPLACE_INJURY', 'Workplace Injury', 'SAFETY', 'HIGH'),
('COMPLIANCE_VIOLATION', 'Compliance Violation', 'COMPLIANCE', 'HIGH'),
('SYSTEM_OUTAGE', 'System Outage', 'OPERATIONAL', 'MEDIUM'),
('FRAUD', 'Fraud or Theft', 'SECURITY', 'CRITICAL'),
('HARASSMENT', 'Harassment or Discrimination', 'HR', 'HIGH'),
('ENVIRONMENTAL', 'Environmental Incident', 'ENVIRONMENTAL', 'MEDIUM'),
('SUPPLIER_FAILURE', 'Supplier Failure', 'OPERATIONAL', 'MEDIUM')
ON CONFLICT (type_code) DO NOTHING;


-- Incidents
CREATE TABLE IF NOT EXISTS incidents (
    incident_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    incident_number VARCHAR(50) NOT NULL,
    incident_type_id INTEGER NOT NULL REFERENCES incident_types(type_id),
    
    -- Details
    title VARCHAR(300) NOT NULL,
    description TEXT NOT NULL,
    
    incident_date TIMESTAMP NOT NULL,
    reported_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Location
    location VARCHAR(200),
    department VARCHAR(100),
    
    -- Involved Parties
    reported_by UUID,
    reporter_name VARCHAR(200),
    affected_parties TEXT[],
    
    -- Severity
    severity VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    
    -- Investigation
    assigned_to UUID,
    investigator_name VARCHAR(200),
    investigation_notes TEXT,
    
    root_cause TEXT,
    contributing_factors TEXT,
    
    -- Impact
    financial_impact DECIMAL(15,2),
    operational_impact TEXT,
    reputational_impact TEXT,
    
    -- Response
    immediate_actions TEXT,
    corrective_actions TEXT,
    preventive_actions TEXT,
    
    -- Timeline
    investigation_started_date TIMESTAMP,
    investigation_completed_date TIMESTAMP,
    resolution_date TIMESTAMP,
    
    -- Status
    status VARCHAR(50) DEFAULT 'REPORTED', -- REPORTED, INVESTIGATING, RESOLVED, CLOSED
    
    -- Follow-up
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    follow_up_notes TEXT,
    
    -- Linked Items
    linked_risks INTEGER[],
    linked_compliance_requirements INTEGER[],
    linked_policies INTEGER[],
    
    -- Notifications
    regulatory_notification_required BOOLEAN DEFAULT false,
    regulatory_notification_date TIMESTAMP,
    regulatory_authority VARCHAR(200),
    
    is_confidential BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_incident_number_tenant UNIQUE (tenant_id, incident_number)
);

CREATE INDEX IF NOT EXISTS idx_incidents_tenant ON incidents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_incidents_type ON incidents(incident_type_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_date ON incidents(incident_date DESC);


-- ============================================================================
-- 5. TRAINING & AWARENESS
-- ============================================================================

-- Training Courses
CREATE TABLE IF NOT EXISTS training_courses (
    course_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    course_code VARCHAR(50) NOT NULL,
    course_name VARCHAR(300) NOT NULL,
    description TEXT,
    
    category VARCHAR(100), -- COMPLIANCE, TECHNICAL, LEADERSHIP, SAFETY, etc.
    
    -- Content
    course_content TEXT,
    course_materials_url VARCHAR(500),
    duration_minutes INTEGER,
    
    -- Requirements
    is_mandatory BOOLEAN DEFAULT false,
    required_for_roles VARCHAR(100)[],
    required_for_departments VARCHAR(100)[],
    
    -- Compliance Link
    linked_compliance_requirements INTEGER[],
    
    -- Validity
    certificate_validity_months INTEGER, -- NULL = lifetime validity
    
    -- Provider
    training_provider VARCHAR(200),
    provider_contact VARCHAR(200),
    
    is_active BOOLEAN DEFAULT true,
    
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_course_code_tenant UNIQUE (tenant_id, course_code)
);

CREATE INDEX IF NOT EXISTS idx_training_courses_tenant ON training_courses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_training_courses_mandatory ON training_courses(is_mandatory);


-- Training Completions
CREATE TABLE IF NOT EXISTS training_completions (
    completion_id SERIAL PRIMARY KEY,
    
    course_id INTEGER NOT NULL REFERENCES training_courses(course_id),
    user_id UUID NOT NULL,
    user_name VARCHAR(200),
    
    -- Completion Details
    completion_date DATE NOT NULL,
    score DECIMAL(5,2), -- Percentage if assessment required
    passed BOOLEAN DEFAULT true,
    
    certificate_number VARCHAR(100),
    certificate_issued_date DATE,
    certificate_expiry_date DATE,
    
    -- Training Session
    session_date DATE,
    instructor VARCHAR(200),
    location VARCHAR(200),
    
    notes TEXT,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_course_user UNIQUE (course_id, user_id, completion_date)
);

CREATE INDEX IF NOT EXISTS idx_training_completions_course ON training_completions(course_id);
CREATE INDEX IF NOT EXISTS idx_training_completions_user ON training_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_training_completions_expiry ON training_completions(certificate_expiry_date);


-- ============================================================================
-- 6. AUDIT TRAIL (Compliance-specific)
-- ============================================================================

-- Compliance Audit Trail
CREATE TABLE IF NOT EXISTS compliance_audit_trail (
    audit_id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    -- Action Details
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL, -- compliance_requirement, risk, policy, incident, etc.
    entity_id INTEGER NOT NULL,
    
    -- User
    user_id UUID,
    user_email VARCHAR(255),
    user_name VARCHAR(200),
    
    -- Changes
    field_changed VARCHAR(200),
    old_value TEXT,
    new_value TEXT,
    
    -- Context
    ip_address VARCHAR(50),
    user_agent TEXT,
    
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Compliance Context
    compliance_impact VARCHAR(20), -- LOW, MEDIUM, HIGH
    
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_compliance_audit_tenant ON compliance_audit_trail(tenant_id);
CREATE INDEX IF NOT EXISTS idx_compliance_audit_entity ON compliance_audit_trail(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_compliance_audit_user ON compliance_audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_audit_timestamp ON compliance_audit_trail(timestamp DESC);


-- ============================================================================
-- 7. SARS SENTINEL - TAX COMPLIANCE MANAGEMENT
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


-- SARS Correspondence
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
    days_to_deadline INTEGER GENERATED ALWAYS AS (deadline_date - CURRENT_DATE) STORED,
    
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
    
    CONSTRAINT uq_reference_tenant UNIQUE (tenant_id, reference_number)
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


-- ============================================================================
-- 8. AUDIT-READY SUITE
-- ============================================================================

-- Audit Checklist Templates
CREATE TABLE IF NOT EXISTS audit_checklist_templates (
    template_id SERIAL PRIMARY KEY,
    
    template_code VARCHAR(50) NOT NULL UNIQUE,
    template_name VARCHAR(200) NOT NULL,
    description TEXT,
    
    audit_type VARCHAR(50) NOT NULL, -- FINANCIAL, TAX, COMPLIANCE, INTERNAL, EXTERNAL
    framework VARCHAR(100), -- IFRS, GAAP, SARS, etc.
    
    -- Scope
    applies_to VARCHAR(50)[], -- COMPANY, SME, NPO, etc.
    
    is_active BOOLEAN DEFAULT true,
    
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pre-populate audit checklist templates
INSERT INTO audit_checklist_templates (template_code, template_name, audit_type, framework) VALUES
('VAT_AUDIT', 'VAT Audit Checklist', 'TAX', 'SARS'),
('PAYE_AUDIT', 'PAYE Audit Checklist', 'TAX', 'SARS'),
('ANNUAL_FS_AUDIT', 'Annual Financial Statement Audit', 'FINANCIAL', 'IFRS'),
('INTERNAL_CONTROLS', 'Internal Controls Review', 'INTERNAL', 'COSO'),
('KING_IV_COMPLIANCE', 'King IV Governance Assessment', 'COMPLIANCE', 'KING_IV'),
('POPIA_COMPLIANCE', 'POPIA Compliance Audit', 'COMPLIANCE', 'POPIA')
ON CONFLICT (template_code) DO NOTHING;


-- Audit Checklist Items
CREATE TABLE IF NOT EXISTS audit_checklist_items (
    item_id SERIAL PRIMARY KEY,
    template_id INTEGER NOT NULL REFERENCES audit_checklist_templates(template_id) ON DELETE CASCADE,
    
    item_number VARCHAR(20) NOT NULL,
    item_title VARCHAR(300) NOT NULL,
    item_description TEXT,
    
    -- Category
    section VARCHAR(100),
    category VARCHAR(100),
    
    -- Guidance
    audit_procedure TEXT,
    expected_evidence TEXT[],
    regulatory_reference VARCHAR(200),
    
    -- Risk
    risk_level VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    
    -- Scoring
    is_scored BOOLEAN DEFAULT false,
    max_score INTEGER,
    
    -- Order
    display_order INTEGER,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_checklist_items_template ON audit_checklist_items(template_id);


-- Audit Engagements
CREATE TABLE IF NOT EXISTS audit_engagements (
    engagement_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    engagement_number VARCHAR(50) NOT NULL,
    
    -- Type
    audit_type VARCHAR(50) NOT NULL,
    template_id INTEGER REFERENCES audit_checklist_templates(template_id),
    
    -- Entity
    entity_id UUID,
    entity_name VARCHAR(200) NOT NULL,
    
    -- Period
    audit_period_start DATE NOT NULL,
    audit_period_end DATE NOT NULL,
    fiscal_year INTEGER,
    
    -- Team
    lead_auditor_id UUID,
    lead_auditor_name VARCHAR(200),
    audit_team_members UUID[],
    
    -- Dates
    planning_start_date DATE,
    fieldwork_start_date DATE,
    fieldwork_end_date DATE,
    report_date DATE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'PLANNING', -- PLANNING, FIELDWORK, REVIEW, REPORTING, COMPLETED
    
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Findings
    total_findings INTEGER DEFAULT 0,
    critical_findings INTEGER DEFAULT 0,
    high_findings INTEGER DEFAULT 0,
    medium_findings INTEGER DEFAULT 0,
    low_findings INTEGER DEFAULT 0,
    
    -- Scoring
    overall_score DECIMAL(5,2),
    pass_fail_status VARCHAR(20), -- PASS, FAIL, QUALIFIED
    
    -- Documents
    engagement_letter_url VARCHAR(500),
    final_report_url VARCHAR(500),
    management_letter_url VARCHAR(500),
    
    -- Notes
    scope_description TEXT,
    audit_opinion TEXT,
    
    is_archived BOOLEAN DEFAULT false,
    
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_engagement_number_tenant UNIQUE (tenant_id, engagement_number)
);

CREATE INDEX IF NOT EXISTS idx_audit_engagements_tenant ON audit_engagements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_engagements_type ON audit_engagements(audit_type);
CREATE INDEX IF NOT EXISTS idx_audit_engagements_status ON audit_engagements(status);


-- Audit Findings
CREATE TABLE IF NOT EXISTS audit_findings (
    finding_id SERIAL PRIMARY KEY,
    engagement_id INTEGER NOT NULL REFERENCES audit_engagements(engagement_id) ON DELETE CASCADE,
    
    finding_number VARCHAR(50) NOT NULL,
    
    -- Classification
    finding_type VARCHAR(50) NOT NULL, -- DEFICIENCY, NON_COMPLIANCE, MATERIAL_WEAKNESS, etc.
    severity VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    
    -- Details
    title VARCHAR(300) NOT NULL,
    description TEXT NOT NULL,
    
    -- Context
    area_affected VARCHAR(200),
    checklist_item_id INTEGER REFERENCES audit_checklist_items(item_id),
    
    -- Root Cause
    root_cause TEXT,
    impact_description TEXT,
    
    -- Financial Impact
    financial_impact DECIMAL(15,2),
    potential_exposure DECIMAL(15,2),
    
    -- Evidence
    evidence_references TEXT[],
    evidence_documents TEXT[],
    
    -- Recommendations
    auditor_recommendation TEXT NOT NULL,
    management_response TEXT,
    corrective_action_plan TEXT,
    
    -- Responsibility
    responsible_person_id UUID,
    responsible_person_name VARCHAR(200),
    
    -- Timeline
    target_resolution_date DATE,
    actual_resolution_date DATE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'OPEN', -- OPEN, IN_PROGRESS, RESOLVED, CLOSED, WONT_FIX
    
    -- Follow-up
    follow_up_required BOOLEAN DEFAULT true,
    follow_up_date DATE,
    follow_up_notes TEXT,
    
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_findings_engagement ON audit_findings(engagement_id);
CREATE INDEX IF NOT EXISTS idx_audit_findings_severity ON audit_findings(severity);
CREATE INDEX IF NOT EXISTS idx_audit_findings_status ON audit_findings(status);


-- Audit Evidence Repository
CREATE TABLE IF NOT EXISTS audit_evidence (
    evidence_id SERIAL PRIMARY KEY,
    engagement_id INTEGER NOT NULL REFERENCES audit_engagements(engagement_id),
    
    evidence_number VARCHAR(50) NOT NULL,
    
    -- Type
    evidence_type VARCHAR(50) NOT NULL, -- DOCUMENT, INTERVIEW, OBSERVATION, CONFIRMATION, ANALYTICAL
    
    -- Details
    description TEXT NOT NULL,
    source VARCHAR(200),
    
    -- Links
    related_checklist_items INTEGER[],
    related_findings INTEGER[],
    
    -- Files
    document_url VARCHAR(500),
    attachments TEXT[],
    
    -- Quality
    reliability VARCHAR(20) DEFAULT 'HIGH', -- LOW, MEDIUM, HIGH
    sufficiency VARCHAR(20) DEFAULT 'SUFFICIENT', -- INSUFFICIENT, SUFFICIENT
    
    -- Collection
    collected_by UUID,
    collected_by_name VARCHAR(200),
    collection_date DATE NOT NULL,
    
    -- Review
    reviewed_by UUID,
    review_date DATE,
    review_notes TEXT,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_evidence_engagement ON audit_evidence(engagement_id);
CREATE INDEX IF NOT EXISTS idx_audit_evidence_type ON audit_evidence(evidence_type);


-- Audit Trail Permanent Records
CREATE TABLE IF NOT EXISTS audit_permanent_records (
    record_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    entity_id UUID NOT NULL,
    
    -- Document Classification
    record_type VARCHAR(50) NOT NULL, -- INCORPORATION, LICENSES, CONTRACTS, POLICIES, etc.
    document_category VARCHAR(100),
    
    -- Details
    document_title VARCHAR(300) NOT NULL,
    document_description TEXT,
    
    document_url VARCHAR(500),
    document_hash VARCHAR(64), -- For integrity verification
    
    -- Validity
    issue_date DATE,
    expiry_date DATE,
    
    -- Custodian
    custodian_id UUID,
    custodian_name VARCHAR(200),
    
    -- Retention
    retention_years INTEGER,
    destruction_date DATE,
    
    is_active BOOLEAN DEFAULT true,
    
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_permanent_records_tenant ON audit_permanent_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_permanent_records_entity ON audit_permanent_records(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_permanent_records_type ON audit_permanent_records(record_type);


-- ============================================================================
-- COMMENTS & DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE regulatory_frameworks IS 'Master list of regulatory frameworks and standards';
COMMENT ON TABLE compliance_requirements IS 'Specific compliance obligations and requirements';
COMMENT ON TABLE compliance_status IS 'Track compliance status for each requirement';
COMMENT ON TABLE risk_register IS 'Enterprise risk register with assessments';
COMMENT ON TABLE policies IS 'Company policies and procedures';
COMMENT ON TABLE policy_acknowledgments IS 'Track policy acknowledgments by users';
COMMENT ON TABLE incidents IS 'Incident management and tracking';
COMMENT ON TABLE training_courses IS 'Compliance and regulatory training courses';
COMMENT ON TABLE training_completions IS 'Track training completions and certifications';
COMMENT ON TABLE sars_correspondence IS 'SARS tax correspondence and verification requests';
COMMENT ON TABLE sars_workflows IS 'Workflow management for SARS compliance';
COMMENT ON TABLE sars_submission_history IS 'History of all SARS tax submissions';
COMMENT ON TABLE audit_engagements IS 'Audit engagement management';
COMMENT ON TABLE audit_findings IS 'Audit findings and corrective actions';
COMMENT ON TABLE audit_evidence IS 'Audit evidence repository';

-- ============================================================================
-- END OF COMPLIANCE & GOVERNANCE MODULE SCHEMA
-- ============================================================================
