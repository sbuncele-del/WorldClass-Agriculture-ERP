-- ============================================================================
-- HR MODULE - COMPLETE DATABASE SCHEMA
-- South African compliant HR & Payroll system
-- ============================================================================

-- Create HR schema if not exists
CREATE SCHEMA IF NOT EXISTS hr;

-- ============================================================================
-- LEAVE TYPES
-- ============================================================================
CREATE TABLE IF NOT EXISTS hr.leave_types (
    leave_type_id SERIAL PRIMARY KEY,
    leave_code VARCHAR(20) NOT NULL UNIQUE,
    leave_name VARCHAR(100) NOT NULL,
    default_days DECIMAL(5,2) DEFAULT 0,
    accrual_method VARCHAR(20) DEFAULT 'NONE', -- NONE, MONTHLY, ANNUAL, HOURLY
    accrual_rate DECIMAL(5,2) DEFAULT 0,
    max_carryover DECIMAL(5,2) DEFAULT 0,
    max_balance DECIMAL(5,2) DEFAULT 365,
    requires_approval BOOLEAN DEFAULT TRUE,
    min_notice_days INTEGER DEFAULT 0,
    is_paid BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert statutory leave types
INSERT INTO hr.leave_types (leave_code, leave_name, default_days, accrual_method, accrual_rate, max_carryover, max_balance, min_notice_days, is_paid) VALUES
('ANNUAL', 'Annual Leave', 21, 'MONTHLY', 1.75, 10, 30, 14, TRUE),
('SICK', 'Sick Leave', 30, 'NONE', 0, 0, 30, 0, TRUE),
('FAMILY', 'Family Responsibility Leave', 3, 'ANNUAL', 3, 0, 3, 0, TRUE),
('MATERNITY', 'Maternity Leave', 120, 'NONE', 0, 0, 120, 30, FALSE),
('PATERNITY', 'Parental Leave', 10, 'NONE', 0, 0, 10, 7, TRUE),
('STUDY', 'Study Leave', 5, 'ANNUAL', 5, 0, 10, 14, TRUE),
('UNPAID', 'Unpaid Leave', 0, 'NONE', 0, 0, 365, 14, FALSE)
ON CONFLICT (leave_code) DO NOTHING;

-- ============================================================================
-- EMPLOYEE LEAVE BALANCES
-- ============================================================================
CREATE TABLE IF NOT EXISTS hr.employee_leave_balances (
    balance_id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    leave_type_id INTEGER NOT NULL REFERENCES hr.leave_types(leave_type_id),
    year INTEGER NOT NULL,
    opening_balance DECIMAL(8,2) DEFAULT 0,
    accrued DECIMAL(8,2) DEFAULT 0,
    taken DECIMAL(8,2) DEFAULT 0,
    adjustment DECIMAL(8,2) DEFAULT 0,
    pending DECIMAL(8,2) DEFAULT 0,
    closing_balance DECIMAL(8,2) DEFAULT 0,
    carryover_from_previous DECIMAL(8,2) DEFAULT 0,
    forfeited DECIMAL(8,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, leave_type_id, year)
);

-- ============================================================================
-- LEAVE REQUESTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS hr.leave_requests (
    request_id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    leave_type_id INTEGER NOT NULL REFERENCES hr.leave_types(leave_type_id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_requested DECIMAL(5,2) NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'Pending', -- Pending, Approved, Rejected, Cancelled
    request_date DATE DEFAULT CURRENT_DATE,
    approver_comments TEXT,
    approved_by INTEGER,
    approval_date DATE,
    attachment_path VARCHAR(500),
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- LEAVE ACCRUAL LOG
-- ============================================================================
CREATE TABLE IF NOT EXISTS hr.leave_accrual_log (
    log_id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    leave_type_id INTEGER NOT NULL REFERENCES hr.leave_types(leave_type_id),
    accrual_year INTEGER NOT NULL,
    accrual_month INTEGER NOT NULL,
    accrual_amount DECIMAL(8,2) NOT NULL,
    previous_balance DECIMAL(8,2),
    new_balance DECIMAL(8,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, leave_type_id, accrual_year, accrual_month)
);

-- ============================================================================
-- EMPLOYEE DOCUMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS hr.employee_documents (
    document_id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    document_type VARCHAR(50) NOT NULL, -- ID_DOCUMENT, PASSPORT, CONTRACT, QUALIFICATION, etc
    document_name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    description TEXT,
    expiry_date DATE,
    is_confidential BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    uploaded_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_employee_documents_employee ON hr.employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_expiry ON hr.employee_documents(expiry_date) WHERE expiry_date IS NOT NULL;

-- ============================================================================
-- EMPLOYEE CONTRACTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS hr.employee_contracts (
    contract_id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    contract_type VARCHAR(50) NOT NULL, -- PERMANENT, FIXED_TERM, PART_TIME, etc
    contract_number VARCHAR(50) UNIQUE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    job_title VARCHAR(200) NOT NULL,
    department_id INTEGER,
    reporting_to INTEGER,
    basic_salary DECIMAL(15,2) NOT NULL,
    salary_frequency VARCHAR(20) DEFAULT 'MONTHLY', -- MONTHLY, WEEKLY, HOURLY
    working_hours_per_week INTEGER DEFAULT 40,
    probation_period_months INTEGER DEFAULT 3,
    notice_period_days INTEGER DEFAULT 30,
    benefits JSONB DEFAULT '{}',
    special_conditions TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, TERMINATED, EXPIRED, SUPERSEDED
    termination_reason TEXT,
    terminated_by INTEGER,
    terminated_at TIMESTAMP,
    document_id INTEGER REFERENCES hr.employee_documents(document_id),
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_employee_contracts_employee ON hr.employee_contracts(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_contracts_status ON hr.employee_contracts(status);
CREATE INDEX IF NOT EXISTS idx_employee_contracts_end_date ON hr.employee_contracts(end_date) WHERE end_date IS NOT NULL;

-- ============================================================================
-- PAYROLL COMPONENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS hr.payroll_components (
    component_id SERIAL PRIMARY KEY,
    component_code VARCHAR(20) NOT NULL UNIQUE,
    component_name VARCHAR(100) NOT NULL,
    component_type VARCHAR(20) NOT NULL, -- Earning, Deduction
    calculation_type VARCHAR(20) DEFAULT 'Fixed', -- Fixed, Percentage
    amount DECIMAL(15,2) DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0,
    is_taxable BOOLEAN DEFAULT TRUE,
    is_statutory BOOLEAN DEFAULT FALSE,
    gl_account_code VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert common payroll components
INSERT INTO hr.payroll_components (component_code, component_name, component_type, calculation_type, is_taxable, is_statutory) VALUES
('BASIC', 'Basic Salary', 'Earning', 'Fixed', TRUE, FALSE),
('OVERTIME', 'Overtime Pay', 'Earning', 'Fixed', TRUE, FALSE),
('COMMISSION', 'Commission', 'Earning', 'Fixed', TRUE, FALSE),
('BONUS', 'Performance Bonus', 'Earning', 'Fixed', TRUE, FALSE),
('TRAVEL', 'Travel Allowance', 'Earning', 'Fixed', TRUE, FALSE),
('HOUSING', 'Housing Allowance', 'Earning', 'Fixed', TRUE, FALSE),
('MEDICAL', 'Medical Aid Contribution', 'Deduction', 'Fixed', FALSE, FALSE),
('PENSION', 'Pension Fund Contribution', 'Deduction', 'Percentage', FALSE, FALSE),
('PROVIDENT', 'Provident Fund Contribution', 'Deduction', 'Percentage', FALSE, FALSE),
('LOAN', 'Loan Repayment', 'Deduction', 'Fixed', FALSE, FALSE)
ON CONFLICT (component_code) DO NOTHING;

-- ============================================================================
-- EMPLOYEE RECURRING COMPONENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS hr.employee_recurring_components (
    recurring_id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    component_id INTEGER NOT NULL REFERENCES hr.payroll_components(component_id),
    employee_amount DECIMAL(15,2),
    employee_percentage DECIMAL(5,2),
    effective_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PAYROLL PERIODS
-- ============================================================================
CREATE TABLE IF NOT EXISTS hr.payroll_periods (
    period_id SERIAL PRIMARY KEY,
    period_code VARCHAR(20) NOT NULL UNIQUE,
    period_name VARCHAR(100) NOT NULL,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    payment_date DATE NOT NULL,
    frequency VARCHAR(20) DEFAULT 'Monthly', -- Monthly, Weekly, Bi-weekly
    status VARCHAR(20) DEFAULT 'Draft', -- Draft, Open, Processing, Closed
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PAYROLL RUNS
-- ============================================================================
CREATE TABLE IF NOT EXISTS hr.payroll_runs (
    run_id SERIAL PRIMARY KEY,
    period_id INTEGER NOT NULL REFERENCES hr.payroll_periods(period_id),
    run_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'Draft', -- Draft, Processed, Approved, Posted, Paid
    total_employees INTEGER DEFAULT 0,
    total_gross DECIMAL(18,2) DEFAULT 0,
    total_deductions DECIMAL(18,2) DEFAULT 0,
    total_net DECIMAL(18,2) DEFAULT 0,
    gl_entry_id INTEGER,
    posted_by INTEGER,
    posted_at TIMESTAMP,
    approved_by INTEGER,
    approved_at TIMESTAMP,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PAYROLL RUN DETAILS (per employee)
-- ============================================================================
CREATE TABLE IF NOT EXISTS hr.payroll_run_details (
    detail_id SERIAL PRIMARY KEY,
    run_id INTEGER NOT NULL REFERENCES hr.payroll_runs(run_id),
    employee_id INTEGER NOT NULL,
    basic_salary DECIMAL(15,2) DEFAULT 0,
    gross_pay DECIMAL(15,2) DEFAULT 0,
    total_deductions DECIMAL(15,2) DEFAULT 0,
    net_pay DECIMAL(15,2) DEFAULT 0,
    paye_tax DECIMAL(15,2) DEFAULT 0,
    uif_deduction DECIMAL(15,2) DEFAULT 0,
    sdl_amount DECIMAL(15,2) DEFAULT 0,
    overtime_hours DECIMAL(8,2) DEFAULT 0,
    overtime_pay DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(run_id, employee_id)
);

-- ============================================================================
-- PAYROLL RUN LINES (individual earnings/deductions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS hr.payroll_run_lines (
    line_id SERIAL PRIMARY KEY,
    detail_id INTEGER NOT NULL REFERENCES hr.payroll_run_details(detail_id),
    component_id INTEGER REFERENCES hr.payroll_components(component_id),
    line_type VARCHAR(20) NOT NULL, -- Earning, Deduction
    description VARCHAR(255),
    amount DECIMAL(15,2) NOT NULL,
    is_taxable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SARS TAX BRACKETS
-- ============================================================================
CREATE TABLE IF NOT EXISTS hr.sars_tax_brackets (
    bracket_id SERIAL PRIMARY KEY,
    tax_year INTEGER NOT NULL,
    min_income DECIMAL(15,2) NOT NULL,
    max_income DECIMAL(15,2),
    rate DECIMAL(5,2) NOT NULL,
    base_tax DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tax_year, min_income)
);

-- Insert 2024/2025 tax brackets
INSERT INTO hr.sars_tax_brackets (tax_year, min_income, max_income, rate, base_tax) VALUES
(2024, 0, 237100, 18, 0),
(2024, 237101, 370500, 26, 42678),
(2024, 370501, 512800, 31, 77362),
(2024, 512801, 673000, 36, 121475),
(2024, 673001, 857900, 39, 179147),
(2024, 857901, 1817000, 41, 251258),
(2024, 1817001, NULL, 45, 644489)
ON CONFLICT (tax_year, min_income) DO NOTHING;

-- ============================================================================
-- ATTENDANCE RECORDS
-- ============================================================================
CREATE TABLE IF NOT EXISTS hr.attendance_records (
    attendance_id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    attendance_date DATE NOT NULL,
    clock_in_time TIME,
    clock_out_time TIME,
    hours_worked DECIMAL(5,2),
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'Present', -- Present, Absent, Half-day, Leave
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, attendance_date)
);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Pending leave requests view
CREATE OR REPLACE VIEW hr.v_pending_leave_requests AS
SELECT 
    lr.request_id,
    lr.employee_id,
    e.employee_number,
    e.first_name || ' ' || e.last_name as employee_name,
    d.department_name,
    lt.leave_name,
    lr.start_date,
    lr.end_date,
    lr.days_requested,
    lr.reason,
    lr.status,
    lr.request_date,
    lr.created_at
FROM hr.leave_requests lr
JOIN hr.employees e ON lr.employee_id = e.employee_id
JOIN hr.leave_types lt ON lr.leave_type_id = lt.leave_type_id
LEFT JOIN hr.departments d ON e.department_id = d.department_id
WHERE lr.status = 'Pending'
ORDER BY lr.request_date;

-- Leave balance summary view
CREATE OR REPLACE VIEW hr.v_leave_balance_summary AS
SELECT 
    b.balance_id,
    b.employee_id,
    e.employee_number,
    e.first_name || ' ' || e.last_name as employee_name,
    lt.leave_name,
    lt.leave_code,
    b.year,
    b.opening_balance,
    b.accrued,
    b.taken,
    b.adjustment,
    b.pending,
    b.closing_balance
FROM hr.employee_leave_balances b
JOIN hr.employees e ON b.employee_id = e.employee_id
JOIN hr.leave_types lt ON b.leave_type_id = lt.leave_type_id;

-- Current payroll summary view
CREATE OR REPLACE VIEW hr.v_current_payroll_summary AS
SELECT 
    pr.run_id,
    pp.period_name,
    pr.run_date,
    pr.status,
    pr.total_employees,
    pr.total_gross,
    pr.total_deductions,
    pr.total_net,
    SUM(prd.paye_tax) as total_paye,
    SUM(prd.uif_deduction) as total_uif
FROM hr.payroll_runs pr
JOIN hr.payroll_periods pp ON pr.period_id = pp.period_id
LEFT JOIN hr.payroll_run_details prd ON pr.run_id = prd.run_id
WHERE pp.period_end_date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY pr.run_id, pp.period_name, pr.run_date, pr.status, pr.total_employees, pr.total_gross, pr.total_deductions, pr.total_net;

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON hr.leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON hr.leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON hr.leave_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_payroll_run_details_employee ON hr.payroll_run_details(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON hr.attendance_records(employee_id, attendance_date);

-- Grant permissions
GRANT USAGE ON SCHEMA hr TO PUBLIC;
GRANT ALL ON ALL TABLES IN SCHEMA hr TO PUBLIC;
GRANT ALL ON ALL SEQUENCES IN SCHEMA hr TO PUBLIC;
