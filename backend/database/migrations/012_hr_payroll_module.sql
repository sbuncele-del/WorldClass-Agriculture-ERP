-- ============================================================================
-- HR & PAYROLL MODULE - DATABASE SCHEMA
-- Worldclass ERP Software
-- Created: November 13, 2025
-- ============================================================================

-- ============================================================================
-- 1. ORGANIZATION STRUCTURE
-- ============================================================================

-- Positions/Job Titles
CREATE TABLE IF NOT EXISTS positions (
    position_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    position_code VARCHAR(50) NOT NULL UNIQUE,
    position_title VARCHAR(200) NOT NULL,
    department_id INTEGER,
    
    -- Hierarchy
    reports_to_position_id INTEGER REFERENCES positions(position_id),
    position_level INTEGER DEFAULT 1,
    
    -- Job Details
    job_description TEXT,
    responsibilities TEXT,
    requirements TEXT,
    
    -- Compensation Range
    min_salary DECIMAL(12,2),
    max_salary DECIMAL(12,2),
    salary_currency VARCHAR(3) DEFAULT 'ZAR',
    
    -- Headcount
    authorized_headcount INTEGER DEFAULT 1,
    current_headcount INTEGER DEFAULT 0,
    
    is_active BOOLEAN DEFAULT true,
    
    created_by UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_positions_department ON positions(department_id);
CREATE INDEX IF NOT EXISTS idx_positions_active ON positions(is_active) WHERE is_active = true;


-- ============================================================================
-- 2. EMPLOYEE MASTER
-- ============================================================================

-- Employees
CREATE TABLE IF NOT EXISTS employees (
    employee_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    -- Employee Identification
    employee_number VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(10), -- Mr, Mrs, Ms, Dr, Prof
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    preferred_name VARCHAR(100),
    
    -- Personal Information
    date_of_birth DATE,
    gender VARCHAR(20),
    nationality VARCHAR(50) DEFAULT 'South African',
    id_number VARCHAR(50), -- SA ID or Passport
    passport_number VARCHAR(50),
    marital_status VARCHAR(20),
    
    -- Contact Information
    personal_email VARCHAR(200),
    work_email VARCHAR(200),
    mobile_phone VARCHAR(50),
    home_phone VARCHAR(50),
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(50),
    emergency_contact_relationship VARCHAR(50),
    
    -- Address
    street_address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'South Africa',
    
    -- Employment Details
    hire_date DATE NOT NULL,
    probation_end_date DATE,
    confirmation_date DATE,
    termination_date DATE,
    employment_status VARCHAR(50) DEFAULT 'Active', -- Active, Probation, Notice, Terminated, Retired
    employment_type VARCHAR(50) DEFAULT 'Full-Time', -- Full-Time, Part-Time, Contract, Intern
    
    -- Position & Department
    position_id INTEGER REFERENCES positions(position_id),
    department_id INTEGER,
    reports_to_employee_id INTEGER REFERENCES employees(employee_id),
    
    -- Compensation
    basic_salary DECIMAL(12,2) NOT NULL,
    salary_frequency VARCHAR(20) DEFAULT 'Monthly', -- Monthly, Bi-Weekly, Weekly
    pay_grade VARCHAR(50),
    
    -- Bank Details
    bank_name VARCHAR(100),
    bank_account_number VARCHAR(50),
    bank_branch_code VARCHAR(20),
    bank_account_type VARCHAR(20), -- Cheque, Savings
    
    -- Tax Information
    tax_number VARCHAR(50), -- SARS Tax Number
    uif_number VARCHAR(50),
    medical_aid_number VARCHAR(50),
    pension_fund_number VARCHAR(50),
    
    -- Medical Aid
    medical_aid_scheme VARCHAR(100),
    medical_aid_plan VARCHAR(100),
    medical_aid_main_member BOOLEAN DEFAULT true,
    medical_aid_dependents INTEGER DEFAULT 0,
    medical_aid_contribution DECIMAL(10,2) DEFAULT 0,
    
    -- Pension/Provident Fund
    pension_fund_name VARCHAR(100),
    pension_contribution_percentage DECIMAL(5,2) DEFAULT 0,
    employer_pension_contribution_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Leave Balances
    annual_leave_balance DECIMAL(5,2) DEFAULT 0,
    sick_leave_balance DECIMAL(5,2) DEFAULT 0,
    family_responsibility_leave DECIMAL(5,2) DEFAULT 0,
    
    -- System Access
    user_id UUID,
    has_system_access BOOLEAN DEFAULT false,
    
    -- Photo
    photo_url VARCHAR(500),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Audit
    created_by UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_employment_status CHECK (employment_status IN ('Active', 'Probation', 'Notice', 'Suspended', 'Terminated', 'Retired')),
    CONSTRAINT chk_employment_type CHECK (employment_type IN ('Full-Time', 'Part-Time', 'Contract', 'Intern', 'Casual'))
);

CREATE INDEX IF NOT EXISTS idx_employees_number ON employees(employee_number);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(employment_status);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_position ON employees(position_id);
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_employees_name ON employees(last_name, first_name);


-- Employee Documents
CREATE TABLE IF NOT EXISTS employee_documents (
    document_id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
    
    document_type VARCHAR(100) NOT NULL, -- ID_COPY, CV, CONTRACT, PAYSLIP, etc.
    document_name VARCHAR(200) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    
    expiry_date DATE,
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID,
    verified_at TIMESTAMP,
    
    uploaded_by UUID NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_employee_documents_employee ON employee_documents(employee_id);


-- ============================================================================
-- 3. PAYROLL SYSTEM
-- ============================================================================

-- Payroll Periods
CREATE TABLE IF NOT EXISTS payroll_periods (
    period_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    period_name VARCHAR(100) NOT NULL, -- January 2025, Feb 2025, etc.
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    payment_date DATE NOT NULL,
    
    status VARCHAR(20) DEFAULT 'Open', -- Open, Processing, Processed, Posted, Closed
    
    created_by UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_payroll_period_status CHECK (status IN ('Open', 'Processing', 'Processed', 'Posted', 'Closed'))
);

CREATE INDEX IF NOT EXISTS idx_payroll_periods_dates ON payroll_periods(period_start, period_end);


-- Payroll Runs
CREATE TABLE IF NOT EXISTS payroll_runs (
    run_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    period_id INTEGER NOT NULL REFERENCES payroll_periods(period_id),
    run_number VARCHAR(50) NOT NULL UNIQUE,
    run_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Statistics
    employee_count INTEGER DEFAULT 0,
    total_gross DECIMAL(15,2) DEFAULT 0,
    total_deductions DECIMAL(15,2) DEFAULT 0,
    total_net DECIMAL(15,2) DEFAULT 0,
    total_employer_contributions DECIMAL(15,2) DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'Draft', -- Draft, Approved, Posted, Paid
    
    -- GL Integration
    journal_entry_id INTEGER,
    posted_to_gl BOOLEAN DEFAULT false,
    posted_at TIMESTAMP,
    
    -- Approval
    approved_by UUID,
    approved_at TIMESTAMP,
    
    created_by UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_payroll_run_status CHECK (status IN ('Draft', 'Approved', 'Posted', 'Paid', 'Void'))
);

CREATE INDEX IF NOT EXISTS idx_payroll_runs_period ON payroll_runs(period_id);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_status ON payroll_runs(status);


-- Payroll Items (Individual Employee Payslips)
CREATE TABLE IF NOT EXISTS payroll_items (
    payroll_item_id SERIAL PRIMARY KEY,
    run_id INTEGER NOT NULL REFERENCES payroll_runs(run_id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES employees(employee_id),
    
    -- Earnings
    basic_salary DECIMAL(12,2) NOT NULL,
    overtime_pay DECIMAL(12,2) DEFAULT 0,
    bonus DECIMAL(12,2) DEFAULT 0,
    commission DECIMAL(12,2) DEFAULT 0,
    allowances DECIMAL(12,2) DEFAULT 0,
    other_earnings DECIMAL(12,2) DEFAULT 0,
    gross_pay DECIMAL(12,2) NOT NULL,
    
    -- Deductions
    paye_tax DECIMAL(12,2) DEFAULT 0,
    uif_employee DECIMAL(12,2) DEFAULT 0,
    medical_aid DECIMAL(12,2) DEFAULT 0,
    pension_contribution DECIMAL(12,2) DEFAULT 0,
    loan_deductions DECIMAL(12,2) DEFAULT 0,
    garnishments DECIMAL(12,2) DEFAULT 0,
    other_deductions DECIMAL(12,2) DEFAULT 0,
    total_deductions DECIMAL(12,2) NOT NULL,
    
    -- Net Pay
    net_pay DECIMAL(12,2) NOT NULL,
    
    -- Employer Contributions
    uif_employer DECIMAL(12,2) DEFAULT 0,
    sdl_contribution DECIMAL(12,2) DEFAULT 0,
    wca_contribution DECIMAL(12,2) DEFAULT 0, -- Workmen's Compensation
    employer_pension DECIMAL(12,2) DEFAULT 0,
    total_employer_cost DECIMAL(12,2) NOT NULL,
    
    -- Tax Calculation Details
    taxable_income DECIMAL(12,2) NOT NULL,
    tax_bracket INTEGER,
    tax_threshold_amount DECIMAL(12,2),
    
    -- Working Days
    working_days DECIMAL(5,2) DEFAULT 0,
    days_worked DECIMAL(5,2) DEFAULT 0,
    days_absent DECIMAL(5,2) DEFAULT 0,
    overtime_hours DECIMAL(6,2) DEFAULT 0,
    
    -- Payment Details
    payment_method VARCHAR(20) DEFAULT 'EFT', -- EFT, Cash, Cheque
    payment_reference VARCHAR(100),
    payment_date DATE,
    payment_status VARCHAR(20) DEFAULT 'Pending', -- Pending, Paid, Failed
    
    -- Payslip
    payslip_pdf_path VARCHAR(500),
    payslip_sent_at TIMESTAMP,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_payment_method CHECK (payment_method IN ('EFT', 'Cash', 'Cheque')),
    CONSTRAINT chk_payment_status CHECK (payment_status IN ('Pending', 'Paid', 'Failed', 'Reversed'))
);

CREATE INDEX IF NOT EXISTS idx_payroll_items_run ON payroll_items(run_id);
CREATE INDEX IF NOT EXISTS idx_payroll_items_employee ON payroll_items(employee_id);


-- Payroll Adjustments (One-time additions/deductions)
CREATE TABLE IF NOT EXISTS payroll_adjustments (
    adjustment_id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(employee_id),
    
    adjustment_type VARCHAR(50) NOT NULL, -- EARNING, DEDUCTION
    adjustment_category VARCHAR(100) NOT NULL, -- Bonus, Commission, Loan, Garnishment, etc.
    amount DECIMAL(12,2) NOT NULL,
    
    description TEXT NOT NULL,
    reference VARCHAR(100),
    
    effective_date DATE NOT NULL,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_count INTEGER,
    
    status VARCHAR(20) DEFAULT 'Pending', -- Pending, Applied, Cancelled
    applied_in_run_id INTEGER REFERENCES payroll_runs(run_id),
    
    created_by UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_adjustment_type CHECK (adjustment_type IN ('EARNING', 'DEDUCTION')),
    CONSTRAINT chk_adjustment_status CHECK (status IN ('Pending', 'Applied', 'Cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_payroll_adjustments_employee ON payroll_adjustments(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_adjustments_status ON payroll_adjustments(status);


-- ============================================================================
-- 4. LEAVE MANAGEMENT
-- ============================================================================

-- Leave Types
CREATE TABLE IF NOT EXISTS leave_types (
    leave_type_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    leave_type_code VARCHAR(50) NOT NULL UNIQUE,
    leave_type_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Accrual
    days_per_year DECIMAL(5,2) NOT NULL,
    accrual_frequency VARCHAR(20) DEFAULT 'Monthly', -- Monthly, Annually, None
    
    -- Rules
    max_carryover DECIMAL(5,2) DEFAULT 0,
    requires_approval BOOLEAN DEFAULT true,
    requires_attachment BOOLEAN DEFAULT false,
    min_notice_days INTEGER DEFAULT 0,
    max_consecutive_days INTEGER,
    
    -- Pay
    is_paid BOOLEAN DEFAULT true,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Pre-populate South African leave types
INSERT INTO leave_types (leave_type_code, leave_type_name, days_per_year, accrual_frequency, is_paid) VALUES
('ANNUAL', 'Annual Leave', 21, 'Monthly', true),
('SICK', 'Sick Leave', 30, 'None', true),
('FAMILY', 'Family Responsibility Leave', 3, 'Annually', true),
('MATERNITY', 'Maternity Leave', 122, 'None', true),
('PATERNITY', 'Paternity Leave', 10, 'None', true),
('STUDY', 'Study Leave', 0, 'None', false),
('UNPAID', 'Unpaid Leave', 0, 'None', false)
ON CONFLICT (leave_type_code) DO NOTHING;


-- Leave Requests
CREATE TABLE IF NOT EXISTS leave_requests (
    request_id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(employee_id),
    leave_type_id INTEGER NOT NULL REFERENCES leave_types(leave_type_id),
    
    -- Request Details
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_requested DECIMAL(5,2) NOT NULL,
    reason TEXT,
    
    -- Handover
    handover_notes TEXT,
    cover_employee_id INTEGER REFERENCES employees(employee_id),
    
    -- Attachments
    attachment_path VARCHAR(500),
    
    -- Status & Approval
    status VARCHAR(20) DEFAULT 'Pending', -- Pending, Approved, Rejected, Cancelled
    approved_by UUID,
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    
    -- Audit
    created_by UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_leave_status CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);


-- Leave Accruals (Track monthly accrual)
CREATE TABLE IF NOT EXISTS leave_accruals (
    accrual_id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(employee_id),
    leave_type_id INTEGER NOT NULL REFERENCES leave_types(leave_type_id),
    
    accrual_date DATE NOT NULL,
    days_accrued DECIMAL(5,2) NOT NULL,
    
    opening_balance DECIMAL(5,2) DEFAULT 0,
    closing_balance DECIMAL(5,2) NOT NULL,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_leave_accrual UNIQUE (employee_id, leave_type_id, accrual_date)
);

CREATE INDEX IF NOT EXISTS idx_leave_accruals_employee ON leave_accruals(employee_id);


-- ============================================================================
-- 5. ATTENDANCE TRACKING
-- ============================================================================

-- Attendance Records
CREATE TABLE IF NOT EXISTS attendance_records (
    attendance_id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(employee_id),
    
    attendance_date DATE NOT NULL,
    
    -- Clock Times
    clock_in_time TIMESTAMP,
    clock_in_location VARCHAR(200),
    clock_in_ip VARCHAR(50),
    
    clock_out_time TIMESTAMP,
    clock_out_location VARCHAR(200),
    clock_out_ip VARCHAR(50),
    
    -- Calculated
    hours_worked DECIMAL(5,2),
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    
    -- Status
    attendance_status VARCHAR(20) DEFAULT 'Present', -- Present, Absent, Late, Half-Day, Leave
    is_overtime BOOLEAN DEFAULT false,
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_attendance_status CHECK (attendance_status IN ('Present', 'Absent', 'Late', 'Half-Day', 'Leave', 'Public-Holiday'))
);

CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(attendance_date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance_records(employee_id, attendance_date);


-- ============================================================================
-- 6. PERFORMANCE MANAGEMENT
-- ============================================================================

-- Performance Reviews
CREATE TABLE IF NOT EXISTS performance_reviews (
    review_id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(employee_id),
    
    review_period_start DATE NOT NULL,
    review_period_end DATE NOT NULL,
    review_date DATE NOT NULL,
    
    reviewer_id INTEGER REFERENCES employees(employee_id),
    review_type VARCHAR(50) DEFAULT 'Annual', -- Annual, Mid-Year, Probation, Ad-Hoc
    
    -- Ratings (1-5 scale)
    job_knowledge_rating INTEGER,
    quality_of_work_rating INTEGER,
    productivity_rating INTEGER,
    communication_rating INTEGER,
    teamwork_rating INTEGER,
    leadership_rating INTEGER,
    initiative_rating INTEGER,
    overall_rating DECIMAL(3,2),
    
    -- Comments
    strengths TEXT,
    areas_for_improvement TEXT,
    goals_for_next_period TEXT,
    reviewer_comments TEXT,
    employee_comments TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'Draft', -- Draft, Submitted, Acknowledged, Completed
    
    -- Signatures
    reviewed_by UUID,
    reviewed_at TIMESTAMP,
    acknowledged_by_employee BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMP,
    
    created_by UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_review_status CHECK (status IN ('Draft', 'Submitted', 'Acknowledged', 'Completed'))
);

CREATE INDEX IF NOT EXISTS idx_performance_reviews_employee ON performance_reviews(employee_id);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_date ON performance_reviews(review_date DESC);


-- ============================================================================
-- 7. RECRUITMENT
-- ============================================================================

-- Job Postings
CREATE TABLE IF NOT EXISTS job_postings (
    posting_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    position_id INTEGER NOT NULL REFERENCES positions(position_id),
    department_id INTEGER,
    
    job_title VARCHAR(200) NOT NULL,
    job_description TEXT NOT NULL,
    requirements TEXT,
    responsibilities TEXT,
    
    -- Compensation
    salary_range_min DECIMAL(12,2),
    salary_range_max DECIMAL(12,2),
    benefits TEXT,
    
    -- Posting Details
    posting_date DATE NOT NULL,
    closing_date DATE NOT NULL,
    location VARCHAR(200),
    employment_type VARCHAR(50),
    
    -- Vacancies
    vacancies INTEGER DEFAULT 1,
    applications_count INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'Draft', -- Draft, Active, Closed, Filled
    
    created_by UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_posting_status CHECK (status IN ('Draft', 'Active', 'Closed', 'Filled', 'Cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_job_postings_position ON job_postings(position_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);


-- Job Applications
CREATE TABLE IF NOT EXISTS job_applications (
    application_id SERIAL PRIMARY KEY,
    posting_id INTEGER NOT NULL REFERENCES job_postings(posting_id),
    
    -- Applicant Details
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(200) NOT NULL,
    phone VARCHAR(50),
    
    -- Application
    cv_path VARCHAR(500),
    cover_letter TEXT,
    applied_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Screening
    status VARCHAR(20) DEFAULT 'New', -- New, Screening, Interview, Offered, Accepted, Rejected
    screening_notes TEXT,
    interview_date TIMESTAMP,
    
    -- Decision
    decision VARCHAR(20),
    decision_by UUID,
    decision_date DATE,
    decision_notes TEXT,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_application_status CHECK (status IN ('New', 'Screening', 'Interview', 'Assessment', 'Offered', 'Accepted', 'Rejected', 'Withdrawn'))
);

CREATE INDEX IF NOT EXISTS idx_job_applications_posting ON job_applications(posting_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);


-- ============================================================================
-- COMMENTS & DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE positions IS 'Job positions/titles within the organization';
COMMENT ON TABLE employees IS 'Employee master data with full employment details';
COMMENT ON TABLE payroll_runs IS 'Payroll processing runs per period';
COMMENT ON TABLE payroll_items IS 'Individual employee payslips';
COMMENT ON TABLE leave_requests IS 'Employee leave requests and approvals';
COMMENT ON TABLE attendance_records IS 'Daily attendance clock in/out records';
COMMENT ON TABLE performance_reviews IS 'Employee performance review records';
COMMENT ON TABLE job_postings IS 'Job vacancy postings for recruitment';

-- ============================================================================
-- END OF HR & PAYROLL MODULE SCHEMA
-- ============================================================================
