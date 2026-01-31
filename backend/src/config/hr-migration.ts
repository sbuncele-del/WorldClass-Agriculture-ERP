/**
 * HR & PAYROLL MODULE - DATABASE MIGRATION
 * 
 * Complete HR & Payroll system with:
 * - Employee master data (personal, employment, compensation)
 * - Payroll processing (monthly/weekly, SARS PAYE/UIF/SDL)
 * - Leave management (types, accrual, approval)
 * - Attendance tracking (clock in/out, overtime)
 * - Organizational structure (departments, positions, reporting)
 * - Benefits and deductions
 * - Tax certificates (IRP5, IT3a)
 */

import { Pool } from 'pg';

export async function runHRMigration(pool: Pool): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Drop existing tables if they exist (in reverse order due to foreign keys)
    await client.query('DROP TABLE IF EXISTS tax_certificates CASCADE');
    await client.query('DROP TABLE IF EXISTS sars_tax_brackets CASCADE');
    await client.query('DROP TABLE IF EXISTS attendance_records CASCADE');
    await client.query('DROP TABLE IF EXISTS leave_requests CASCADE');
    await client.query('DROP TABLE IF EXISTS employee_leave_balances CASCADE');
    await client.query('DROP TABLE IF EXISTS leave_types CASCADE');
    await client.query('DROP TABLE IF EXISTS payroll_run_lines CASCADE');
    await client.query('DROP TABLE IF EXISTS payroll_run_details CASCADE');
    await client.query('DROP TABLE IF EXISTS payroll_runs CASCADE');
    await client.query('DROP TABLE IF EXISTS employee_recurring_components CASCADE');
    await client.query('DROP TABLE IF EXISTS payroll_components CASCADE');
    await client.query('DROP TABLE IF EXISTS payroll_periods CASCADE');
    await client.query('DROP TABLE IF EXISTS employees CASCADE');
    await client.query('DROP TABLE IF EXISTS positions CASCADE');
    await client.query('DROP TABLE IF EXISTS departments CASCADE');

    // ============================================================================
    // TABLE 1: DEPARTMENTS
    // ============================================================================
    await client.query(`
      CREATE TABLE departments (
        department_id SERIAL PRIMARY KEY,
        department_code VARCHAR(20) UNIQUE NOT NULL,
        department_name VARCHAR(100) NOT NULL,
        parent_department_id INTEGER,
        manager_id INTEGER,
        cost_center_code VARCHAR(20),
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        updated_by INTEGER,
        CONSTRAINT fk_parent_department FOREIGN KEY (parent_department_id) REFERENCES departments(department_id)
      )
    `);

    // ============================================================================
    // TABLE 2: POSITIONS/JOB TITLES
    // ============================================================================
    await client.query(`
      CREATE TABLE positions (
        position_id SERIAL PRIMARY KEY,
        position_code VARCHAR(20) UNIQUE NOT NULL,
        position_title VARCHAR(100) NOT NULL,
        department_id INTEGER,
        reports_to_position_id INTEGER,
        job_level VARCHAR(30),
        job_category VARCHAR(30),
        description TEXT,
        requirements TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_position_department FOREIGN KEY (department_id) REFERENCES departments(department_id),
        CONSTRAINT fk_position_reports_to FOREIGN KEY (reports_to_position_id) REFERENCES positions(position_id)
      )
    `);

    // ============================================================================
    // TABLE 3: EMPLOYEES
    // ============================================================================
    await client.query(`
      CREATE TABLE employees (
        employee_id SERIAL PRIMARY KEY,
        employee_number VARCHAR(30) UNIQUE NOT NULL,
        
        -- Personal Information
        title VARCHAR(10),
        first_name VARCHAR(100) NOT NULL,
        middle_name VARCHAR(100),
        last_name VARCHAR(100) NOT NULL,
        preferred_name VARCHAR(100),
        date_of_birth DATE NOT NULL,
        gender VARCHAR(20) CHECK (gender IN ('Male', 'Female', 'Other', 'Prefer not to say')),
        nationality VARCHAR(50),
        id_number VARCHAR(20) UNIQUE,
        passport_number VARCHAR(20),
        tax_number VARCHAR(20),
        
        -- Contact Information
        email_personal VARCHAR(100),
        email_work VARCHAR(100),
        phone_mobile VARCHAR(20),
        phone_home VARCHAR(20),
        address_line1 VARCHAR(200),
        address_line2 VARCHAR(200),
        city VARCHAR(100),
        state_province VARCHAR(100),
        postal_code VARCHAR(20),
        country VARCHAR(100) DEFAULT 'South Africa',
        
        -- Emergency Contact
        emergency_contact_name VARCHAR(100),
        emergency_contact_relationship VARCHAR(50),
        emergency_contact_phone VARCHAR(20),
        
        -- Employment Details
        employment_status VARCHAR(30) CHECK (employment_status IN ('Active', 'Probation', 'Notice Period', 'Suspended', 'Terminated', 'Resigned', 'Retired')) DEFAULT 'Active',
        employment_type VARCHAR(30) CHECK (employment_type IN ('Permanent', 'Contract', 'Temporary', 'Intern', 'Part-Time')) DEFAULT 'Permanent',
        hire_date DATE NOT NULL,
        probation_end_date DATE,
        confirmation_date DATE,
        termination_date DATE,
        termination_reason TEXT,
        
        -- Organizational Assignment
        department_id INTEGER REFERENCES departments(department_id),
        position_id INTEGER REFERENCES positions(position_id),
        reports_to_employee_id INTEGER REFERENCES employees(employee_id),
        work_location VARCHAR(100),
        
        -- Compensation
        salary_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
        salary_frequency VARCHAR(20) CHECK (salary_frequency IN ('Monthly', 'Weekly', 'Bi-Weekly', 'Hourly')) DEFAULT 'Monthly',
        salary_currency VARCHAR(3) DEFAULT 'ZAR',
        payment_method VARCHAR(30) CHECK (payment_method IN ('Bank Transfer', 'Cash', 'Cheque')) DEFAULT 'Bank Transfer',
        
        -- Bank Details
        bank_name VARCHAR(100),
        bank_branch VARCHAR(100),
        bank_branch_code VARCHAR(20),
        bank_account_number VARCHAR(30),
        bank_account_type VARCHAR(30) CHECK (bank_account_type IN ('Savings', 'Cheque', 'Transmission')),
        
        -- Tax Information
        tax_status VARCHAR(30) CHECK (tax_status IN ('Resident', 'Non-Resident')) DEFAULT 'Resident',
        tax_directive_number VARCHAR(50),
        uif_number VARCHAR(20),
        medical_aid_number VARCHAR(50),
        medical_aid_scheme VARCHAR(100),
        pension_fund_number VARCHAR(50),
        
        -- Photo
        photo_url VARCHAR(500),
        
        -- System
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        updated_by INTEGER
      )
    `);

    // ============================================================================
    // TABLE 4: PAYROLL PERIODS
    // ============================================================================
    await client.query(`
      CREATE TABLE payroll_periods (
        period_id SERIAL PRIMARY KEY,
        period_name VARCHAR(50) NOT NULL,
        period_type VARCHAR(20) CHECK (period_type IN ('Monthly', 'Weekly', 'Bi-Weekly')) DEFAULT 'Monthly',
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        pay_date DATE NOT NULL,
        tax_year INTEGER NOT NULL,
        tax_period INTEGER NOT NULL,
        status VARCHAR(20) CHECK (status IN ('Open', 'Processing', 'Processed', 'Posted', 'Closed')) DEFAULT 'Open',
        processed_by INTEGER,
        processed_at TIMESTAMP,
        posted_by INTEGER,
        posted_at TIMESTAMP,
        closed_by INTEGER,
        closed_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(tax_year, tax_period, period_type)
      )
    `);

    // ============================================================================
    // TABLE 5: PAYROLL COMPONENTS (Earnings & Deductions)
    // ============================================================================
    await client.query(`
      CREATE TABLE payroll_components (
        component_id SERIAL PRIMARY KEY,
        component_code VARCHAR(20) UNIQUE NOT NULL,
        component_name VARCHAR(100) NOT NULL,
        component_type VARCHAR(30) CHECK (component_type IN ('Earning', 'Deduction', 'Employer Contribution')) NOT NULL,
        component_category VARCHAR(50),
        
        -- Tax Treatment
        is_taxable BOOLEAN DEFAULT false,
        is_uif_applicable BOOLEAN DEFAULT false,
        is_pension_applicable BOOLEAN DEFAULT false,
        
        -- Calculation
        calculation_method VARCHAR(30) CHECK (calculation_method IN ('Fixed Amount', 'Percentage of Basic', 'Percentage of Gross', 'Hours x Rate', 'Formula')),
        calculation_value DECIMAL(15,4),
        calculation_formula TEXT,
        
        -- GL Account
        gl_account_id INTEGER,
        
        -- Display
        display_on_payslip BOOLEAN DEFAULT true,
        display_order INTEGER,
        
        -- System
        is_system_component BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ============================================================================
    // TABLE 6: EMPLOYEE RECURRING COMPONENTS
    // ============================================================================
    await client.query(`
      CREATE TABLE employee_recurring_components (
        recurring_component_id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(employee_id) NOT NULL,
        component_id INTEGER REFERENCES payroll_components(component_id) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE,
        is_active BOOLEAN DEFAULT true,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ============================================================================
    // TABLE 7: PAYROLL RUNS
    // ============================================================================
    await client.query(`
      CREATE TABLE payroll_runs (
        payroll_run_id SERIAL PRIMARY KEY,
        period_id INTEGER REFERENCES payroll_periods(period_id) NOT NULL,
        run_number INTEGER NOT NULL,
        run_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        run_type VARCHAR(30) CHECK (run_type IN ('Regular', 'Off-Cycle', 'Bonus', 'Final', 'Adjustment')) DEFAULT 'Regular',
        status VARCHAR(20) CHECK (status IN ('Draft', 'Calculated', 'Approved', 'Posted', 'Paid', 'Cancelled')) DEFAULT 'Draft',
        
        -- Totals
        total_employees INTEGER DEFAULT 0,
        total_gross_pay DECIMAL(15,2) DEFAULT 0,
        total_deductions DECIMAL(15,2) DEFAULT 0,
        total_net_pay DECIMAL(15,2) DEFAULT 0,
        total_paye DECIMAL(15,2) DEFAULT 0,
        total_uif_employee DECIMAL(15,2) DEFAULT 0,
        total_uif_employer DECIMAL(15,2) DEFAULT 0,
        total_sdl DECIMAL(15,2) DEFAULT 0,
        
        -- GL Posting
        journal_entry_id INTEGER,
        posting_date DATE,
        
        -- Approval
        approved_by INTEGER,
        approved_at TIMESTAMP,
        
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        
        UNIQUE(period_id, run_number)
      )
    `);

    // ============================================================================
    // TABLE 8: PAYROLL RUN DETAILS (Payslips)
    // ============================================================================
    await client.query(`
      CREATE TABLE payroll_run_details (
        payslip_id SERIAL PRIMARY KEY,
        payroll_run_id INTEGER REFERENCES payroll_runs(payroll_run_id) ON DELETE CASCADE,
        employee_id INTEGER REFERENCES employees(employee_id) NOT NULL,
        
        -- Period
        period_id INTEGER REFERENCES payroll_periods(period_id),
        pay_date DATE NOT NULL,
        
        -- Basic Pay
        basic_salary DECIMAL(15,2) DEFAULT 0,
        days_worked DECIMAL(5,2) DEFAULT 0,
        days_in_period DECIMAL(5,2) DEFAULT 0,
        
        -- Earnings
        total_earnings DECIMAL(15,2) DEFAULT 0,
        taxable_income DECIMAL(15,2) DEFAULT 0,
        non_taxable_income DECIMAL(15,2) DEFAULT 0,
        
        -- Deductions
        paye DECIMAL(15,2) DEFAULT 0,
        uif_employee DECIMAL(15,2) DEFAULT 0,
        total_deductions DECIMAL(15,2) DEFAULT 0,
        
        -- Net Pay
        net_pay DECIMAL(15,2) DEFAULT 0,
        
        -- Employer Costs
        uif_employer DECIMAL(15,2) DEFAULT 0,
        sdl DECIMAL(15,2) DEFAULT 0,
        total_employer_cost DECIMAL(15,2) DEFAULT 0,
        
        -- YTD Totals
        ytd_gross DECIMAL(15,2) DEFAULT 0,
        ytd_paye DECIMAL(15,2) DEFAULT 0,
        ytd_uif DECIMAL(15,2) DEFAULT 0,
        
        -- Payment
        payment_status VARCHAR(20) CHECK (payment_status IN ('Pending', 'Paid', 'Failed', 'Cancelled')) DEFAULT 'Pending',
        payment_reference VARCHAR(100),
        payment_date DATE,
        
        -- System
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ============================================================================
    // TABLE 9: PAYROLL RUN LINE ITEMS
    // ============================================================================
    await client.query(`
      CREATE TABLE payroll_run_lines (
        line_id SERIAL PRIMARY KEY,
        payslip_id INTEGER REFERENCES payroll_run_details(payslip_id) ON DELETE CASCADE,
        component_id INTEGER REFERENCES payroll_components(component_id),
        component_code VARCHAR(20) NOT NULL,
        component_name VARCHAR(100) NOT NULL,
        component_type VARCHAR(30) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        is_taxable BOOLEAN DEFAULT false,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ============================================================================
    // TABLE 10: LEAVE TYPES
    // ============================================================================
    await client.query(`
      CREATE TABLE leave_types (
        leave_type_id SERIAL PRIMARY KEY,
        leave_type_code VARCHAR(20) UNIQUE NOT NULL,
        leave_type_name VARCHAR(100) NOT NULL,
        description TEXT,
        
        -- Accrual
        accrual_method VARCHAR(30) CHECK (accrual_method IN ('Annual', 'Monthly', 'Per Pay Period', 'None')) DEFAULT 'Annual',
        accrual_days_per_year DECIMAL(5,2) DEFAULT 0,
        accrual_start_month INTEGER,
        
        -- Limits
        max_days_per_year DECIMAL(5,2),
        max_carryover_days DECIMAL(5,2),
        min_days_per_request DECIMAL(5,2),
        max_days_per_request DECIMAL(5,2),
        
        -- Approval
        requires_approval BOOLEAN DEFAULT true,
        approval_levels INTEGER DEFAULT 1,
        
        -- Payroll
        is_paid BOOLEAN DEFAULT true,
        affects_attendance BOOLEAN DEFAULT true,
        
        -- Settings
        allow_negative_balance BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ============================================================================
    // TABLE 11: EMPLOYEE LEAVE BALANCES
    // ============================================================================
    await client.query(`
      CREATE TABLE employee_leave_balances (
        balance_id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(employee_id) NOT NULL,
        leave_type_id INTEGER REFERENCES leave_types(leave_type_id) NOT NULL,
        leave_year INTEGER NOT NULL,
        
        opening_balance DECIMAL(5,2) DEFAULT 0,
        accrued DECIMAL(5,2) DEFAULT 0,
        taken DECIMAL(5,2) DEFAULT 0,
        pending DECIMAL(5,2) DEFAULT 0,
        closing_balance DECIMAL(5,2) DEFAULT 0,
        
        last_accrual_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(employee_id, leave_type_id, leave_year)
      )
    `);

    // ============================================================================
    // TABLE 12: LEAVE REQUESTS
    // ============================================================================
    await client.query(`
      CREATE TABLE leave_requests (
        leave_request_id SERIAL PRIMARY KEY,
        request_number VARCHAR(30) UNIQUE NOT NULL,
        employee_id INTEGER REFERENCES employees(employee_id) NOT NULL,
        leave_type_id INTEGER REFERENCES leave_types(leave_type_id) NOT NULL,
        
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        days_requested DECIMAL(5,2) NOT NULL,
        return_date DATE,
        
        reason TEXT,
        attachment_url VARCHAR(500),
        
        status VARCHAR(20) CHECK (status IN ('Draft', 'Pending', 'Approved', 'Rejected', 'Cancelled')) DEFAULT 'Pending',
        
        requested_by INTEGER,
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        approved_by INTEGER,
        approved_at TIMESTAMP,
        rejection_reason TEXT,
        
        cancelled_by INTEGER,
        cancelled_at TIMESTAMP,
        cancellation_reason TEXT,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ============================================================================
    // TABLE 13: ATTENDANCE RECORDS
    // ============================================================================
    await client.query(`
      CREATE TABLE attendance_records (
        attendance_id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(employee_id) NOT NULL,
        attendance_date DATE NOT NULL,
        
        clock_in_time TIME,
        clock_out_time TIME,
        total_hours DECIMAL(5,2),
        
        regular_hours DECIMAL(5,2) DEFAULT 0,
        overtime_hours DECIMAL(5,2) DEFAULT 0,
        break_hours DECIMAL(5,2) DEFAULT 0,
        
        attendance_status VARCHAR(30) CHECK (attendance_status IN ('Present', 'Absent', 'Late', 'Half Day', 'On Leave', 'Public Holiday', 'Weekend')) DEFAULT 'Present',
        
        leave_request_id INTEGER REFERENCES leave_requests(leave_request_id),
        
        notes TEXT,
        approved_by INTEGER,
        approved_at TIMESTAMP,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(employee_id, attendance_date)
      )
    `);

    // ============================================================================
    // TABLE 14: SARS TAX TABLES
    // ============================================================================
    await client.query(`
      CREATE TABLE sars_tax_brackets (
        bracket_id SERIAL PRIMARY KEY,
        tax_year INTEGER NOT NULL,
        min_income DECIMAL(15,2) NOT NULL,
        max_income DECIMAL(15,2),
        base_tax DECIMAL(15,2) NOT NULL,
        tax_rate DECIMAL(5,4) NOT NULL,
        threshold DECIMAL(15,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ============================================================================
    // TABLE 15: TAX CERTIFICATES (IRP5)
    // ============================================================================
    await client.query(`
      CREATE TABLE tax_certificates (
        certificate_id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(employee_id) NOT NULL,
        tax_year INTEGER NOT NULL,
        certificate_type VARCHAR(20) CHECK (certificate_type IN ('IRP5', 'IT3a')) DEFAULT 'IRP5',
        
        -- Income
        total_remuneration DECIMAL(15,2) DEFAULT 0,
        pension_fund_contributions DECIMAL(15,2) DEFAULT 0,
        retirement_annuity_contributions DECIMAL(15,2) DEFAULT 0,
        medical_aid_contributions DECIMAL(15,2) DEFAULT 0,
        
        -- Tax
        total_paye DECIMAL(15,2) DEFAULT 0,
        total_uif DECIMAL(15,2) DEFAULT 0,
        total_sdl DECIMAL(15,2) DEFAULT 0,
        
        -- Status
        status VARCHAR(20) CHECK (status IN ('Draft', 'Finalized', 'Submitted to SARS', 'Issued to Employee')) DEFAULT 'Draft',
        finalized_by INTEGER,
        finalized_at TIMESTAMP,
        issued_at TIMESTAMP,
        
        pdf_url VARCHAR(500),
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(employee_id, tax_year, certificate_type)
      )
    `);

    // ============================================================================
    // INDEXES FOR PERFORMANCE
    // ============================================================================
    
    await client.query(`CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(employment_status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_employees_hire_date ON employees(hire_date);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(is_active);`);
    
    await client.query(`CREATE INDEX IF NOT EXISTS idx_payroll_runs_period ON payroll_runs(period_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_payroll_runs_status ON payroll_runs(status);`);
    
    await client.query(`CREATE INDEX IF NOT EXISTS idx_payslip_employee ON payroll_run_details(employee_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_payslip_period ON payroll_run_details(period_id);`);
    
    await client.query(`CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);`);
    
    await client.query(`CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance_records(employee_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(attendance_date);`);

    // ============================================================================
    // VIEWS FOR REPORTING
    // ============================================================================

    // View 1: Employee Summary
    await client.query(`
      CREATE OR REPLACE VIEW v_employee_summary AS
      SELECT 
        e.employee_id,
        e.employee_number,
        e.first_name || ' ' || e.last_name as full_name,
        e.email_work,
        e.phone_mobile,
        e.employment_status,
        e.employment_type,
        e.hire_date,
        d.department_name,
        p.position_title,
        e.salary_amount,
        e.salary_frequency,
        COALESCE(mgr.first_name || ' ' || mgr.last_name, '') as manager_name,
        e.is_active
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.department_id
      LEFT JOIN positions p ON e.position_id = p.position_id
      LEFT JOIN employees mgr ON e.reports_to_employee_id = mgr.employee_id
    `);

    // View 2: Current Period Payroll Summary
    await client.query(`
      CREATE OR REPLACE VIEW v_current_payroll_summary AS
      SELECT 
        pr.payroll_run_id,
        pp.period_name,
        pr.run_date,
        pr.status,
        pr.total_employees,
        pr.total_gross_pay,
        pr.total_deductions,
        pr.total_net_pay,
        pr.total_paye,
        pr.total_uif_employee + pr.total_uif_employer as total_uif,
        pr.total_sdl
      FROM payroll_runs pr
      JOIN payroll_periods pp ON pr.period_id = pp.period_id
      WHERE pp.status IN ('Open', 'Processing')
      ORDER BY pr.run_date DESC
    `);

    // View 3: Leave Balance Summary
    await client.query(`
      CREATE OR REPLACE VIEW v_leave_balance_summary AS
      SELECT 
        e.employee_id,
        e.employee_number,
        e.first_name || ' ' || e.last_name as employee_name,
        lt.leave_type_name,
        lb.leave_year,
        lb.opening_balance,
        lb.accrued,
        lb.taken,
        lb.pending,
        lb.closing_balance
      FROM employee_leave_balances lb
      JOIN employees e ON lb.employee_id = e.employee_id
      JOIN leave_types lt ON lb.leave_type_id = lt.leave_type_id
      WHERE e.is_active = true
    `);

    // View 4: Pending Leave Requests
    await client.query(`
      CREATE OR REPLACE VIEW v_pending_leave_requests AS
      SELECT 
        lr.leave_request_id,
        lr.request_number,
        e.employee_number,
        e.first_name || ' ' || e.last_name as employee_name,
        lt.leave_type_name,
        lr.start_date,
        lr.end_date,
        lr.days_requested,
        lr.reason,
        lr.requested_at,
        d.department_name
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.employee_id
      JOIN leave_types lt ON lr.leave_type_id = lt.leave_type_id
      LEFT JOIN departments d ON e.department_id = d.department_id
      WHERE lr.status = 'Pending'
      ORDER BY lr.requested_at ASC
    `);

    // ============================================================================
    // SEED DATA
    // ============================================================================

    // Seed Departments
    await client.query(`
      INSERT INTO departments (department_code, department_name, description)
      VALUES 
        ('EXEC', 'Executive', 'Executive management'),
        ('FIN', 'Finance', 'Finance and accounting'),
        ('HR', 'Human Resources', 'HR and payroll'),
        ('IT', 'Information Technology', 'IT and systems'),
        ('SALES', 'Sales', 'Sales and business development'),
        ('OPS', 'Operations', 'Operations and logistics')
      ON CONFLICT (department_code) DO NOTHING
    `);

    // Seed Leave Types
    await client.query(`
      INSERT INTO leave_types (leave_type_code, leave_type_name, accrual_method, accrual_days_per_year, is_paid, requires_approval)
      VALUES 
        ('ANNUAL', 'Annual Leave', 'Annual', 15, true, true),
        ('SICK', 'Sick Leave', 'Annual', 30, true, false),
        ('FAMILY', 'Family Responsibility Leave', 'Annual', 3, true, true),
        ('MATERNITY', 'Maternity Leave', 'None', 0, true, true),
        ('PATERNITY', 'Paternity Leave', 'None', 0, true, true),
        ('UNPAID', 'Unpaid Leave', 'None', 0, false, true),
        ('STUDY', 'Study Leave', 'None', 0, true, true)
      ON CONFLICT (leave_type_code) DO NOTHING
    `);

    // Seed Payroll Components
    await client.query(`
      INSERT INTO payroll_components (component_code, component_name, component_type, is_taxable, is_uif_applicable, is_system_component, display_order)
      VALUES 
        ('BASIC', 'Basic Salary', 'Earning', true, true, true, 1),
        ('OVERTIME', 'Overtime Pay', 'Earning', true, true, false, 2),
        ('BONUS', 'Performance Bonus', 'Earning', true, true, false, 3),
        ('ALLOWANCE', 'Travel Allowance', 'Earning', true, true, false, 4),
        ('PAYE', 'PAYE Tax', 'Deduction', false, false, true, 10),
        ('UIF', 'UIF Employee', 'Deduction', false, false, true, 11),
        ('PENSION', 'Pension Fund', 'Deduction', false, false, false, 12),
        ('MEDICAL', 'Medical Aid', 'Deduction', false, false, false, 13),
        ('UIF_EMPLOYER', 'UIF Employer Contribution', 'Employer Contribution', false, false, true, 20),
        ('SDL', 'Skills Development Levy', 'Employer Contribution', false, false, true, 21)
      ON CONFLICT (component_code) DO NOTHING
    `);

    // Seed 2025 SARS Tax Tables
    await client.query(`
      INSERT INTO sars_tax_brackets (tax_year, min_income, max_income, base_tax, tax_rate, threshold)
      VALUES 
        (2025, 0, 237100, 0, 0.18, 95750),
        (2025, 237101, 370500, 42678, 0.26, 95750),
        (2025, 370501, 512800, 77362, 0.31, 95750),
        (2025, 512801, 673000, 121475, 0.36, 95750),
        (2025, 673001, 857900, 179147, 0.39, 95750),
        (2025, 857901, 1817000, 251258, 0.41, 95750),
        (2025, 1817001, NULL, 644489, 0.45, 95750)
      ON CONFLICT DO NOTHING
    `);

    await client.query('COMMIT');
    console.log('✅ HR & Payroll migration completed successfully');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ HR & Payroll migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}
