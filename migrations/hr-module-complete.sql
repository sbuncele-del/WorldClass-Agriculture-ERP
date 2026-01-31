-- ============================================================================
-- HR MODULE - COMPLETE DATABASE SCHEMA
-- Created: November 20, 2025
-- ============================================================================

-- Create hr schema
CREATE SCHEMA IF NOT EXISTS hr;

-- ============================================================================
-- DEPARTMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS hr.departments (
    department_id SERIAL PRIMARY KEY,
    department_code VARCHAR(50) UNIQUE NOT NULL,
    department_name VARCHAR(255) NOT NULL,
    description TEXT,
    manager_id INTEGER,
    parent_department_id INTEGER REFERENCES hr.departments(department_id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- POSITIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS hr.positions (
    position_id SERIAL PRIMARY KEY,
    position_code VARCHAR(50) UNIQUE NOT NULL,
    position_title VARCHAR(255) NOT NULL,
    department_id INTEGER REFERENCES hr.departments(department_id),
    description TEXT,
    minimum_salary NUMERIC(15,2),
    maximum_salary NUMERIC(15,2),
    required_qualifications TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- EMPLOYEES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS hr.employees (
    employee_id SERIAL PRIMARY KEY,
    employee_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    mobile VARCHAR(50),
    date_of_birth DATE,
    gender VARCHAR(20),
    marital_status VARCHAR(50),
    id_number VARCHAR(50),
    tax_number VARCHAR(50),
    department_id INTEGER REFERENCES hr.departments(department_id),
    position_id INTEGER REFERENCES hr.positions(position_id),
    manager_id INTEGER REFERENCES hr.employees(employee_id),
    employment_type VARCHAR(50) DEFAULT 'Full-Time',
    employment_status VARCHAR(50) DEFAULT 'Active',
    hire_date DATE NOT NULL,
    termination_date DATE,
    probation_end_date DATE,
    basic_salary NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    housing_allowance NUMERIC(15,2) DEFAULT 0.00,
    transport_allowance NUMERIC(15,2) DEFAULT 0.00,
    other_allowances NUMERIC(15,2) DEFAULT 0.00,
    bank_name VARCHAR(255),
    bank_account_number VARCHAR(50),
    bank_branch VARCHAR(100),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    address TEXT,
    postal_code VARCHAR(20),
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'South Africa',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PAYROLL PERIODS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS hr.payroll_periods (
    period_id SERIAL PRIMARY KEY,
    period_name VARCHAR(100) NOT NULL,
    period_type VARCHAR(20) DEFAULT 'Monthly',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    payment_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Open',
    is_closed BOOLEAN DEFAULT FALSE,
    closed_by INTEGER,
    closed_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PAYROLL RUNS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS hr.payroll_runs (
    run_id SERIAL PRIMARY KEY,
    run_number VARCHAR(50) UNIQUE NOT NULL,
    period_id INTEGER REFERENCES hr.payroll_periods(period_id),
    run_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'Draft',
    total_employees INTEGER DEFAULT 0,
    total_basic_salary NUMERIC(15,2) DEFAULT 0.00,
    total_allowances NUMERIC(15,2) DEFAULT 0.00,
    total_deductions NUMERIC(15,2) DEFAULT 0.00,
    total_net_pay NUMERIC(15,2) DEFAULT 0.00,
    posted_to_gl BOOLEAN DEFAULT FALSE,
    gl_journal_entry_id INTEGER,
    processed_by INTEGER,
    processed_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PAYROLL DETAILS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS hr.payroll_details (
    detail_id SERIAL PRIMARY KEY,
    run_id INTEGER REFERENCES hr.payroll_runs(run_id) ON DELETE CASCADE,
    employee_id INTEGER REFERENCES hr.employees(employee_id),
    basic_salary NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    housing_allowance NUMERIC(15,2) DEFAULT 0.00,
    transport_allowance NUMERIC(15,2) DEFAULT 0.00,
    other_allowances NUMERIC(15,2) DEFAULT 0.00,
    gross_pay NUMERIC(15,2) DEFAULT 0.00,
    paye_tax NUMERIC(15,2) DEFAULT 0.00,
    uif NUMERIC(15,2) DEFAULT 0.00,
    pension_contribution NUMERIC(15,2) DEFAULT 0.00,
    medical_aid NUMERIC(15,2) DEFAULT 0.00,
    other_deductions NUMERIC(15,2) DEFAULT 0.00,
    total_deductions NUMERIC(15,2) DEFAULT 0.00,
    net_pay NUMERIC(15,2) DEFAULT 0.00,
    days_worked NUMERIC(5,2) DEFAULT 0.00,
    days_absent NUMERIC(5,2) DEFAULT 0.00,
    overtime_hours NUMERIC(7,2) DEFAULT 0.00,
    overtime_pay NUMERIC(15,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- LEAVE TYPES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS hr.leave_types (
    leave_type_id SERIAL PRIMARY KEY,
    leave_type_code VARCHAR(50) UNIQUE NOT NULL,
    leave_type_name VARCHAR(255) NOT NULL,
    description TEXT,
    default_days_per_year NUMERIC(5,2) DEFAULT 0.00,
    is_paid BOOLEAN DEFAULT TRUE,
    requires_approval BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- LEAVE BALANCES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS hr.leave_balances (
    balance_id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES hr.employees(employee_id),
    leave_type_id INTEGER REFERENCES hr.leave_types(leave_type_id),
    year INTEGER NOT NULL,
    entitled_days NUMERIC(5,2) DEFAULT 0.00,
    taken_days NUMERIC(5,2) DEFAULT 0.00,
    pending_days NUMERIC(5,2) DEFAULT 0.00,
    balance_days NUMERIC(5,2) DEFAULT 0.00,
    carried_forward NUMERIC(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, leave_type_id, year)
);

-- ============================================================================
-- LEAVE REQUESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS hr.leave_requests (
    request_id SERIAL PRIMARY KEY,
    request_number VARCHAR(50) UNIQUE NOT NULL,
    employee_id INTEGER REFERENCES hr.employees(employee_id),
    leave_type_id INTEGER REFERENCES hr.leave_types(leave_type_id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days NUMERIC(5,2) NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'Pending',
    submitted_date DATE DEFAULT CURRENT_DATE,
    reviewed_by INTEGER,
    reviewed_date TIMESTAMP,
    review_comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ATTENDANCE RECORDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS hr.attendance_records (
    record_id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES hr.employees(employee_id),
    attendance_date DATE NOT NULL,
    clock_in_time TIMESTAMP,
    clock_out_time TIMESTAMP,
    total_hours NUMERIC(5,2),
    status VARCHAR(20) DEFAULT 'Present',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, attendance_date)
);

-- ============================================================================
-- SAMPLE DATA - DEPARTMENTS
-- ============================================================================
INSERT INTO hr.departments (department_code, department_name, description, is_active)
VALUES
    ('DEPT-001', 'Executive Management', 'C-Level executives and strategic leadership', TRUE),
    ('DEPT-002', 'Finance & Accounting', 'Financial management and accounting operations', TRUE),
    ('DEPT-003', 'Sales & Marketing', 'Sales operations and marketing campaigns', TRUE),
    ('DEPT-004', 'Operations', 'Operational management and logistics', TRUE),
    ('DEPT-005', 'Human Resources', 'HR management and employee relations', TRUE),
    ('DEPT-006', 'Information Technology', 'IT infrastructure and software development', TRUE),
    ('DEPT-007', 'Customer Service', 'Customer support and service operations', TRUE)
ON CONFLICT (department_code) DO NOTHING;

-- ============================================================================
-- SAMPLE DATA - POSITIONS
-- ============================================================================
INSERT INTO hr.positions (position_code, position_title, department_id, minimum_salary, maximum_salary, is_active)
VALUES
    ('POS-001', 'Chief Executive Officer', 1, 150000.00, 250000.00, TRUE),
    ('POS-002', 'Chief Financial Officer', 2, 120000.00, 180000.00, TRUE),
    ('POS-003', 'Sales Manager', 3, 60000.00, 90000.00, TRUE),
    ('POS-004', 'Operations Manager', 4, 55000.00, 85000.00, TRUE),
    ('POS-005', 'HR Manager', 5, 50000.00, 75000.00, TRUE),
    ('POS-006', 'IT Manager', 6, 70000.00, 110000.00, TRUE),
    ('POS-007', 'Software Developer', 6, 45000.00, 80000.00, TRUE),
    ('POS-008', 'Accountant', 2, 35000.00, 55000.00, TRUE),
    ('POS-009', 'Sales Representative', 3, 25000.00, 45000.00, TRUE),
    ('POS-010', 'Customer Service Agent', 7, 18000.00, 30000.00, TRUE)
ON CONFLICT (position_code) DO NOTHING;

-- ============================================================================
-- SAMPLE DATA - EMPLOYEES
-- ============================================================================
INSERT INTO hr.employees (employee_number, first_name, last_name, email, phone, department_id, position_id, employment_status, hire_date, basic_salary, housing_allowance, transport_allowance)
VALUES
    ('EMP-001', 'John', 'Smith', 'john.smith@company.com', '+27 11 555 0001', 1, 1, 'Active', '2020-01-15', 180000.00, 25000.00, 8000.00),
    ('EMP-002', 'Sarah', 'Johnson', 'sarah.johnson@company.com', '+27 11 555 0002', 2, 2, 'Active', '2020-03-01', 140000.00, 20000.00, 7000.00),
    ('EMP-003', 'Michael', 'Brown', 'michael.brown@company.com', '+27 11 555 0003', 3, 3, 'Active', '2021-06-15', 75000.00, 12000.00, 5000.00),
    ('EMP-004', 'Lisa', 'Davis', 'lisa.davis@company.com', '+27 11 555 0004', 4, 4, 'Active', '2021-09-01', 70000.00, 11000.00, 5000.00),
    ('EMP-005', 'David', 'Wilson', 'david.wilson@company.com', '+27 11 555 0005', 5, 5, 'Active', '2022-01-10', 60000.00, 10000.00, 4500.00),
    ('EMP-006', 'Emily', 'Anderson', 'emily.anderson@company.com', '+27 11 555 0006', 6, 6, 'Active', '2022-04-01', 85000.00, 13000.00, 5500.00),
    ('EMP-007', 'James', 'Taylor', 'james.taylor@company.com', '+27 11 555 0007', 6, 7, 'Active', '2023-02-15', 55000.00, 8000.00, 4000.00),
    ('EMP-008', 'Anna', 'Martinez', 'anna.martinez@company.com', '+27 11 555 0008', 2, 8, 'Active', '2023-05-01', 42000.00, 6000.00, 3500.00),
    ('EMP-009', 'Robert', 'Garcia', 'robert.garcia@company.com', '+27 11 555 0009', 3, 9, 'Active', '2023-08-15', 32000.00, 4000.00, 3000.00),
    ('EMP-010', 'Jennifer', 'Lee', 'jennifer.lee@company.com', '+27 11 555 0010', 7, 10, 'Active', '2024-01-10', 22000.00, 3000.00, 2500.00)
ON CONFLICT (employee_number) DO NOTHING;

-- ============================================================================
-- SAMPLE DATA - LEAVE TYPES
-- ============================================================================
INSERT INTO hr.leave_types (leave_type_code, leave_type_name, description, default_days_per_year, is_paid, requires_approval)
VALUES
    ('LT-001', 'Annual Leave', 'Paid annual vacation leave', 21.00, TRUE, TRUE),
    ('LT-002', 'Sick Leave', 'Paid sick leave', 30.00, TRUE, FALSE),
    ('LT-003', 'Family Responsibility', 'Family responsibility leave', 3.00, TRUE, TRUE),
    ('LT-004', 'Maternity Leave', 'Maternity leave', 120.00, TRUE, TRUE),
    ('LT-005', 'Unpaid Leave', 'Unpaid leave of absence', 0.00, FALSE, TRUE)
ON CONFLICT (leave_type_code) DO NOTHING;

-- ============================================================================
-- SAMPLE DATA - PAYROLL PERIODS
-- ============================================================================
INSERT INTO hr.payroll_periods (period_name, period_type, start_date, end_date, payment_date, status)
VALUES
    ('October 2024', 'Monthly', '2024-10-01', '2024-10-31', '2024-11-05', 'Closed'),
    ('November 2024', 'Monthly', '2024-11-01', '2024-11-30', '2024-12-05', 'Open'),
    ('December 2024', 'Monthly', '2024-12-01', '2024-12-31', '2025-01-05', 'Open')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SAMPLE DATA - PAYROLL RUNS
-- ============================================================================
INSERT INTO hr.payroll_runs (run_number, period_id, run_date, status, total_employees, total_basic_salary, total_allowances, total_deductions, total_net_pay, posted_to_gl)
VALUES
    ('PAY-2024-10', 1, '2024-10-31', 'Posted', 10, 761000.00, 156500.00, 183100.00, 734400.00, TRUE),
    ('PAY-2024-11', 2, '2024-11-30', 'Draft', 0, 0.00, 0.00, 0.00, 0.00, FALSE)
ON CONFLICT (run_number) DO NOTHING;

-- ============================================================================
-- SAMPLE DATA - LEAVE REQUESTS
-- ============================================================================
INSERT INTO hr.leave_requests (request_number, employee_id, leave_type_id, start_date, end_date, total_days, reason, status)
VALUES
    ('LR-2024-001', 3, 1, '2024-12-15', '2024-12-25', 11.00, 'Family vacation', 'Approved'),
    ('LR-2024-002', 7, 1, '2024-12-20', '2024-12-31', 12.00, 'End of year break', 'Pending'),
    ('LR-2024-003', 9, 2, '2024-11-18', '2024-11-20', 3.00, 'Flu symptoms', 'Approved')
ON CONFLICT (request_number) DO NOTHING;

-- ============================================================================
-- SAMPLE DATA - ATTENDANCE RECORDS
-- ============================================================================
INSERT INTO hr.attendance_records (employee_id, attendance_date, clock_in_time, clock_out_time, total_hours, status)
VALUES
    (1, '2024-11-18', '2024-11-18 08:00:00', '2024-11-18 17:00:00', 9.00, 'Present'),
    (2, '2024-11-18', '2024-11-18 08:15:00', '2024-11-18 17:30:00', 9.25, 'Present'),
    (3, '2024-11-18', '2024-11-18 08:30:00', '2024-11-18 17:15:00', 8.75, 'Present'),
    (1, '2024-11-19', '2024-11-19 08:05:00', '2024-11-19 17:10:00', 9.08, 'Present'),
    (2, '2024-11-19', '2024-11-19 08:00:00', '2024-11-19 17:00:00', 9.00, 'Present')
ON CONFLICT (employee_id, attendance_date) DO NOTHING;

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_employees_number ON hr.employees(employee_number);
CREATE INDEX IF NOT EXISTS idx_employees_department ON hr.employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON hr.employees(employment_status);
CREATE INDEX IF NOT EXISTS idx_payroll_periods_dates ON hr.payroll_periods(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_period ON hr.payroll_runs(period_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON hr.leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON hr.leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_attendance_employee ON hr.attendance_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON hr.attendance_records(attendance_date);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT 'HR module database schema created successfully!' AS status;
SELECT COUNT(*) AS department_count FROM hr.departments;
SELECT COUNT(*) AS position_count FROM hr.positions;
SELECT COUNT(*) AS employee_count FROM hr.employees;
SELECT COUNT(*) AS payroll_period_count FROM hr.payroll_periods;
SELECT COUNT(*) AS leave_request_count FROM hr.leave_requests;
