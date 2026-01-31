-- ============================================================================
-- COMPREHENSIVE PRODUCTION DATABASE MIGRATION
-- WorldClass ERP - All Modules
-- Created: December 13, 2025
-- Purpose: Complete database setup for production RDS
-- ============================================================================

-- This script creates ALL required tables for the ERP system
-- Run this on production RDS to enable all hub pages

-- ============================================================================
-- STEP 1: CREATE ALL SCHEMAS
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS sales;
CREATE SCHEMA IF NOT EXISTS financial;
CREATE SCHEMA IF NOT EXISTS inventory;
CREATE SCHEMA IF NOT EXISTS hr;
CREATE SCHEMA IF NOT EXISTS logistics;
CREATE SCHEMA IF NOT EXISTS manufacturing;
CREATE SCHEMA IF NOT EXISTS purchasing;
CREATE SCHEMA IF NOT EXISTS warehouse;
CREATE SCHEMA IF NOT EXISTS assets;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STEP 2: CREATE TENANTS TABLE (if not exists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenants (
    tenant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_name VARCHAR(255) NOT NULL,
    tenant_code VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default tenant if not exists
INSERT INTO tenants (tenant_id, tenant_name, tenant_code, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Tenant', 'DEFAULT', TRUE)
ON CONFLICT (tenant_code) DO NOTHING;

-- ============================================================================
-- STEP 3: SALES MODULE - Complete Schema
-- ============================================================================

-- Customers Table
CREATE TABLE IF NOT EXISTS sales.customers (
    customer_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    customer_code VARCHAR(50),
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    vat_number VARCHAR(50),
    customer_type VARCHAR(50) DEFAULT 'retail',
    source VARCHAR(100),
    created_from_document VARCHAR(100),
    billing_address TEXT,
    shipping_address TEXT,
    payment_terms VARCHAR(100),
    credit_limit DECIMAL(12,2) DEFAULT 0.00,
    tax_id VARCHAR(50),
    industry VARCHAR(100),
    website VARCHAR(255),
    notes TEXT,
    assigned_to VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sales_customers_tenant ON sales.customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_customers_status ON sales.customers(status);

-- Leads Table
CREATE TABLE IF NOT EXISTS sales.leads (
    lead_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    lead_number VARCHAR(50) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    source VARCHAR(100),
    industry VARCHAR(100),
    lead_value DECIMAL(12,2),
    probability INTEGER DEFAULT 50,
    status VARCHAR(50) DEFAULT 'new',
    assigned_to VARCHAR(255),
    notes TEXT,
    next_follow_up DATE,
    converted_to_opportunity_id INTEGER,
    converted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sales_leads_tenant ON sales.leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_leads_status ON sales.leads(status);
CREATE INDEX IF NOT EXISTS idx_sales_leads_assigned_to ON sales.leads(assigned_to);

-- Opportunities Table
CREATE TABLE IF NOT EXISTS sales.opportunities (
    opportunity_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    opportunity_number VARCHAR(50) UNIQUE NOT NULL,
    lead_id INTEGER REFERENCES sales.leads(lead_id),
    customer_id INTEGER REFERENCES sales.customers(customer_id),
    opportunity_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    value DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    probability INTEGER DEFAULT 50,
    expected_close_date DATE,
    stage VARCHAR(50) DEFAULT 'qualification',
    source VARCHAR(100),
    assigned_to VARCHAR(255),
    notes TEXT,
    lost_reason TEXT,
    converted_to_quotation_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sales_opportunities_tenant ON sales.opportunities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_opportunities_stage ON sales.opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_sales_opportunities_customer_id ON sales.opportunities(customer_id);

-- Quotations Table
CREATE TABLE IF NOT EXISTS sales.quotations (
    quotation_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    quotation_number VARCHAR(50) UNIQUE NOT NULL,
    opportunity_id INTEGER REFERENCES sales.opportunities(opportunity_id),
    customer_id INTEGER REFERENCES sales.customers(customer_id),
    quotation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    vat_rate DECIMAL(5,2) DEFAULT 15.00,
    vat_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    terms TEXT,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    prepared_by VARCHAR(255),
    sent_at TIMESTAMP,
    accepted_at TIMESTAMP,
    declined_at TIMESTAMP,
    decline_reason TEXT,
    converted_to_order_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sales_quotations_tenant ON sales.quotations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_quotations_status ON sales.quotations(status);
CREATE INDEX IF NOT EXISTS idx_sales_quotations_customer_id ON sales.quotations(customer_id);

-- Quotation Line Items
CREATE TABLE IF NOT EXISTS sales.quotation_line_items (
    line_item_id SERIAL PRIMARY KEY,
    quotation_id INTEGER REFERENCES sales.quotations(quotation_id) ON DELETE CASCADE,
    item_code VARCHAR(100),
    description TEXT NOT NULL,
    quantity DECIMAL(10,4) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    vat_rate DECIMAL(5,2) DEFAULT 15.00,
    line_total DECIMAL(12,2) NOT NULL,
    line_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales Orders Table
CREATE TABLE IF NOT EXISTS sales.orders (
    order_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    order_number VARCHAR(50) UNIQUE NOT NULL,
    quotation_id INTEGER REFERENCES sales.quotations(quotation_id),
    customer_id INTEGER REFERENCES sales.customers(customer_id),
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    delivery_date DATE,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    delivery_address TEXT,
    special_instructions TEXT,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    vat_rate DECIMAL(5,2) DEFAULT 15.00,
    vat_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    payment_terms VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    assigned_to VARCHAR(255),
    confirmed_at TIMESTAMP,
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sales_orders_tenant ON sales.orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales.orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer_id ON sales.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_order_date ON sales.orders(order_date);

-- Sales Order Line Items
CREATE TABLE IF NOT EXISTS sales.order_line_items (
    line_item_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES sales.orders(order_id) ON DELETE CASCADE,
    item_code VARCHAR(100),
    description TEXT NOT NULL,
    quantity DECIMAL(10,4) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    vat_rate DECIMAL(5,2) DEFAULT 15.00,
    line_total DECIMAL(12,2) NOT NULL,
    quantity_shipped DECIMAL(10,4) DEFAULT 0.00,
    quantity_invoiced DECIMAL(10,4) DEFAULT 0.00,
    line_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity Log (for all sales activities)
CREATE TABLE IF NOT EXISTS sales.activity_log (
    activity_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    subject VARCHAR(255),
    description TEXT,
    activity_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sales_activity_log_entity ON sales.activity_log(entity_type, entity_id);

-- ============================================================================
-- STEP 4: INVENTORY MODULE - Complete Schema
-- ============================================================================

-- Item Categories
CREATE TABLE IF NOT EXISTS inventory.item_categories (
    category_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    category_code VARCHAR(50) UNIQUE NOT NULL,
    category_name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_category_id INTEGER REFERENCES inventory.item_categories(category_id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_categories_tenant ON inventory.item_categories(tenant_id);

-- Warehouses
CREATE TABLE IF NOT EXISTS inventory.warehouses (
    warehouse_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    warehouse_code VARCHAR(50) UNIQUE NOT NULL,
    warehouse_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    address TEXT,
    manager_name VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    capacity NUMERIC(15,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_warehouses_tenant ON inventory.warehouses(tenant_id);

-- Items
CREATE TABLE IF NOT EXISTS inventory.items (
    item_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    item_code VARCHAR(100) UNIQUE NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    category_id INTEGER REFERENCES inventory.item_categories(category_id),
    unit_of_measure VARCHAR(20) DEFAULT 'EA',
    reorder_level NUMERIC(15,3) DEFAULT 0,
    reorder_quantity NUMERIC(15,3) DEFAULT 0,
    minimum_stock NUMERIC(15,3) DEFAULT 0,
    maximum_stock NUMERIC(15,3),
    standard_cost NUMERIC(15,2) DEFAULT 0.00,
    selling_price NUMERIC(15,2),
    barcode VARCHAR(100),
    sku VARCHAR(100),
    is_serialized BOOLEAN DEFAULT FALSE,
    is_batch_tracked BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_tenant ON inventory.items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_code ON inventory.items(item_code);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory.items(category);

-- Stock Levels
CREATE TABLE IF NOT EXISTS inventory.stock_levels (
    stock_level_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    item_id INTEGER REFERENCES inventory.items(item_id),
    warehouse_id INTEGER REFERENCES inventory.warehouses(warehouse_id),
    quantity_on_hand NUMERIC(15,3) DEFAULT 0,
    quantity_reserved NUMERIC(15,3) DEFAULT 0,
    quantity_available NUMERIC(15,3) DEFAULT 0,
    quantity_on_order NUMERIC(15,3) DEFAULT 0,
    average_cost NUMERIC(15,2) DEFAULT 0.00,
    total_value NUMERIC(15,2) DEFAULT 0.00,
    last_stock_take_date DATE,
    last_movement_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(item_id, warehouse_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_stock_levels_tenant ON inventory.stock_levels(tenant_id);

-- Stock Movements
CREATE TABLE IF NOT EXISTS inventory.stock_movements (
    movement_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    movement_number VARCHAR(50) UNIQUE NOT NULL,
    movement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    movement_type VARCHAR(50) NOT NULL,
    item_id INTEGER REFERENCES inventory.items(item_id),
    from_warehouse_id INTEGER REFERENCES inventory.warehouses(warehouse_id),
    to_warehouse_id INTEGER REFERENCES inventory.warehouses(warehouse_id),
    quantity NUMERIC(15,3) NOT NULL,
    unit_cost NUMERIC(15,2),
    total_cost NUMERIC(15,2),
    reference_number VARCHAR(100),
    reference_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'Draft',
    posted BOOLEAN DEFAULT FALSE,
    posted_date TIMESTAMP,
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_tenant ON inventory.stock_movements(tenant_id);

-- Stock Adjustments
CREATE TABLE IF NOT EXISTS inventory.stock_adjustments (
    adjustment_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    adjustment_number VARCHAR(50) UNIQUE NOT NULL,
    adjustment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    warehouse_id INTEGER REFERENCES inventory.warehouses(warehouse_id),
    adjustment_type VARCHAR(50) DEFAULT 'COUNT',
    reason VARCHAR(255),
    status VARCHAR(20) DEFAULT 'Draft',
    posted BOOLEAN DEFAULT FALSE,
    posted_date TIMESTAMP,
    total_adjustment_value NUMERIC(15,2) DEFAULT 0.00,
    notes TEXT,
    created_by INTEGER,
    approved_by INTEGER,
    approved_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_tenant ON inventory.stock_adjustments(tenant_id);

-- ============================================================================
-- STEP 5: HR MODULE - Complete Schema
-- ============================================================================

-- Departments
CREATE TABLE IF NOT EXISTS hr.departments (
    department_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    department_code VARCHAR(50) UNIQUE NOT NULL,
    department_name VARCHAR(255) NOT NULL,
    description TEXT,
    manager_id INTEGER,
    parent_department_id INTEGER REFERENCES hr.departments(department_id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hr_departments_tenant ON hr.departments(tenant_id);

-- Positions
CREATE TABLE IF NOT EXISTS hr.positions (
    position_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
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

CREATE INDEX IF NOT EXISTS idx_hr_positions_tenant ON hr.positions(tenant_id);

-- Employees
CREATE TABLE IF NOT EXISTS hr.employees (
    employee_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
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

CREATE INDEX IF NOT EXISTS idx_hr_employees_tenant ON hr.employees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hr_employees_number ON hr.employees(employee_number);
CREATE INDEX IF NOT EXISTS idx_hr_employees_department ON hr.employees(department_id);
CREATE INDEX IF NOT EXISTS idx_hr_employees_status ON hr.employees(employment_status);

-- Payroll Periods
CREATE TABLE IF NOT EXISTS hr.payroll_periods (
    period_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
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

CREATE INDEX IF NOT EXISTS idx_hr_payroll_periods_tenant ON hr.payroll_periods(tenant_id);

-- Payroll Runs
CREATE TABLE IF NOT EXISTS hr.payroll_runs (
    run_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
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

CREATE INDEX IF NOT EXISTS idx_hr_payroll_runs_tenant ON hr.payroll_runs(tenant_id);

-- Leave Types
CREATE TABLE IF NOT EXISTS hr.leave_types (
    leave_type_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    leave_type_code VARCHAR(50) UNIQUE NOT NULL,
    leave_type_name VARCHAR(255) NOT NULL,
    description TEXT,
    default_days_per_year NUMERIC(5,2) DEFAULT 0.00,
    is_paid BOOLEAN DEFAULT TRUE,
    requires_approval BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hr_leave_types_tenant ON hr.leave_types(tenant_id);

-- Leave Requests
CREATE TABLE IF NOT EXISTS hr.leave_requests (
    request_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
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

CREATE INDEX IF NOT EXISTS idx_hr_leave_requests_tenant ON hr.leave_requests(tenant_id);

-- ============================================================================
-- STEP 6: FINANCIAL MODULE - Complete Schema
-- ============================================================================

-- Chart of Accounts
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    account_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    parent_code VARCHAR(50),
    account_level INTEGER NOT NULL DEFAULT 1,
    is_header BOOLEAN DEFAULT false,
    account_type VARCHAR(50) NOT NULL,
    account_subtype VARCHAR(50),
    category VARCHAR(100),
    balance_sheet_section VARCHAR(50),
    income_statement_section VARCHAR(50),
    cash_flow_category VARCHAR(50),
    normal_balance VARCHAR(10) NOT NULL DEFAULT 'DEBIT',
    is_control_account BOOLEAN DEFAULT false,
    allows_manual_entries BOOLEAN DEFAULT true,
    requires_dimensions BOOLEAN DEFAULT false,
    current_balance DECIMAL(15,2) DEFAULT 0,
    balance DECIMAL(15,2) DEFAULT 0,
    ytd_debit DECIMAL(15,2) DEFAULT 0,
    ytd_credit DECIMAL(15,2) DEFAULT 0,
    tax_type VARCHAR(50),
    vat_rate DECIMAL(5,2),
    is_bank_account BOOLEAN DEFAULT false,
    is_reconcilable BOOLEAN DEFAULT false,
    currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',
    allow_foreign_currency BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    is_system_account BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_by UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_coa_tenant ON chart_of_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_coa_code ON chart_of_accounts(code);
CREATE INDEX IF NOT EXISTS idx_coa_type ON chart_of_accounts(account_type);

-- Fiscal Years
CREATE TABLE IF NOT EXISTS fiscal_years (
    fiscal_year_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    year_code VARCHAR(20) NOT NULL,
    year_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    is_current BOOLEAN DEFAULT false,
    created_by UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, year_code)
);

CREATE INDEX IF NOT EXISTS idx_fiscal_years_tenant ON fiscal_years(tenant_id);

-- Fiscal Periods
CREATE TABLE IF NOT EXISTS fiscal_periods (
    period_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    fiscal_year_id INTEGER REFERENCES fiscal_years(fiscal_year_id),
    period_code VARCHAR(20) NOT NULL,
    period_name VARCHAR(50) NOT NULL,
    period_number INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    is_current BOOLEAN DEFAULT false,
    closed_by UUID,
    closed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, period_code)
);

CREATE INDEX IF NOT EXISTS idx_fiscal_periods_tenant ON fiscal_periods(tenant_id);

-- Journal Entries
CREATE TABLE IF NOT EXISTS journal_entries (
    journal_entry_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    journal_number VARCHAR(50) NOT NULL,
    journal_date DATE NOT NULL,
    posting_date DATE,
    fiscal_period_id INTEGER REFERENCES fiscal_periods(period_id),
    source VARCHAR(50) NOT NULL DEFAULT 'MANUAL',
    source_document_type VARCHAR(50),
    source_document_id INTEGER,
    description TEXT NOT NULL,
    reference VARCHAR(200),
    total_debit DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_credit DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    posted_by UUID,
    posted_at TIMESTAMP,
    is_reversal BOOLEAN DEFAULT false,
    reverses_entry_id INTEGER,
    reversed_by_entry_id INTEGER,
    reversal_reason TEXT,
    attachment_count INTEGER DEFAULT 0,
    created_by UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, journal_number)
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_tenant ON journal_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(journal_date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_status ON journal_entries(status);

-- Journal Entry Lines
CREATE TABLE IF NOT EXISTS journal_entry_lines (
    line_id SERIAL PRIMARY KEY,
    journal_entry_id INTEGER NOT NULL REFERENCES journal_entries(journal_entry_id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    account_code VARCHAR(50) NOT NULL,
    debit_amount DECIMAL(15,2) DEFAULT 0,
    credit_amount DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',
    description TEXT,
    department_code VARCHAR(50),
    project_code VARCHAR(50),
    cost_center_code VARCHAR(50),
    location_code VARCHAR(50),
    contact_type VARCHAR(20),
    contact_id INTEGER,
    contact_name VARCHAR(200),
    vat_code VARCHAR(20),
    vat_rate DECIMAL(5,2),
    vat_amount DECIMAL(15,2),
    is_reconciled BOOLEAN DEFAULT false,
    reconciled_date DATE,
    reconciled_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_journal_lines_entry ON journal_entry_lines(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_account ON journal_entry_lines(account_code);

-- Financial Invoices
CREATE TABLE IF NOT EXISTS financial.invoices (
    invoice_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    invoice_number VARCHAR(100) NOT NULL,
    customer_id INTEGER REFERENCES sales.customers(customer_id),
    order_id INTEGER,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    reference VARCHAR(255),
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    vat_rate DECIMAL(5,2) DEFAULT 15.00,
    vat_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    payment_terms VARCHAR(100),
    status VARCHAR(20) DEFAULT 'draft',
    pdf_s3_key VARCHAR(500),
    sent_at TIMESTAMP,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_financial_invoices_tenant ON financial.invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_financial_invoices_status ON financial.invoices(status);

-- ============================================================================
-- STEP 7: LOGISTICS MODULE - Basic Tables
-- ============================================================================

-- Processed Documents
CREATE TABLE IF NOT EXISTS logistics.processed_documents (
    document_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    document_type VARCHAR(50) NOT NULL,
    document_number VARCHAR(100),
    s3_key VARCHAR(500),
    extracted_data JSONB,
    confidence_score DECIMAL(5,2),
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_logistics_documents_tenant ON logistics.processed_documents(tenant_id);

-- Loads
CREATE TABLE IF NOT EXISTS logistics.loads (
    load_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    load_number VARCHAR(100) NOT NULL,
    customer_id INTEGER REFERENCES sales.customers(customer_id),
    load_date DATE,
    offload_date DATE,
    driver_name VARCHAR(255),
    vehicle_registration VARCHAR(50),
    commodity VARCHAR(255),
    rate DECIMAL(10,2),
    rate_type VARCHAR(20),
    quantity DECIMAL(10,4),
    load_value DECIMAL(12,2),
    collection_address TEXT,
    delivery_address TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, load_number)
);

CREATE INDEX IF NOT EXISTS idx_logistics_loads_tenant ON logistics.loads(tenant_id);

-- ============================================================================
-- STEP 8: SAMPLE DATA FOR TESTING
-- ============================================================================

-- Sample Customers
INSERT INTO sales.customers (tenant_id, customer_code, company_name, contact_person, email, phone, customer_type, status)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'CUST-001', 'Acme Corporation', 'John Smith', 'john@acme.com', '+27 11 555 0001', 'corporate', 'active'),
    ('00000000-0000-0000-0000-000000000001', 'CUST-002', 'Global Industries', 'Sarah Johnson', 'sarah@global.com', '+27 11 555 0002', 'corporate', 'active'),
    ('00000000-0000-0000-0000-000000000001', 'CUST-003', 'Tech Solutions Ltd', 'Mike Brown', 'mike@techsol.com', '+27 11 555 0003', 'corporate', 'active'),
    ('00000000-0000-0000-0000-000000000001', 'CUST-004', 'Metro Retail', 'Lisa Davis', 'lisa@metro.com', '+27 11 555 0004', 'retail', 'active'),
    ('00000000-0000-0000-0000-000000000001', 'CUST-005', 'Construction Plus', 'David Wilson', 'david@conplus.com', '+27 11 555 0005', 'corporate', 'active')
ON CONFLICT DO NOTHING;

-- Sample Leads
INSERT INTO sales.leads (tenant_id, lead_number, company_name, contact_person, email, phone, source, lead_value, probability, status, assigned_to)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'LEAD-001', 'Potential Corp', 'James Taylor', 'james@potential.com', '+27 11 555 0101', 'Website', 50000.00, 60, 'qualified', 'Sales Team'),
    ('00000000-0000-0000-0000-000000000001', 'LEAD-002', 'New Business Inc', 'Anna Martinez', 'anna@newbiz.com', '+27 11 555 0102', 'Referral', 75000.00, 40, 'new', 'Sales Team'),
    ('00000000-0000-0000-0000-000000000001', 'LEAD-003', 'Growth Partners', 'Robert Garcia', 'robert@growth.com', '+27 11 555 0103', 'LinkedIn', 100000.00, 70, 'contacted', 'Sales Team')
ON CONFLICT (lead_number) DO NOTHING;

-- Sample Opportunities
INSERT INTO sales.opportunities (tenant_id, opportunity_number, customer_id, opportunity_name, value, probability, expected_close_date, stage, assigned_to)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'OPP-001', 1, 'Acme Annual Contract', 250000.00, 75, CURRENT_DATE + 30, 'proposal', 'Sales Team'),
    ('00000000-0000-0000-0000-000000000001', 'OPP-002', 2, 'Global Industries Expansion', 500000.00, 50, CURRENT_DATE + 60, 'negotiation', 'Sales Team'),
    ('00000000-0000-0000-0000-000000000001', 'OPP-003', 3, 'Tech Solutions Upgrade', 150000.00, 80, CURRENT_DATE + 15, 'qualification', 'Sales Team')
ON CONFLICT (opportunity_number) DO NOTHING;

-- Sample Quotations
INSERT INTO sales.quotations (tenant_id, quotation_number, customer_id, opportunity_id, quotation_date, valid_until, subtotal, vat_amount, total, status, prepared_by)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'QT-001', 1, 1, CURRENT_DATE, CURRENT_DATE + 30, 217391.30, 32608.70, 250000.00, 'sent', 'Sales Team'),
    ('00000000-0000-0000-0000-000000000001', 'QT-002', 2, 2, CURRENT_DATE, CURRENT_DATE + 30, 434782.61, 65217.39, 500000.00, 'draft', 'Sales Team')
ON CONFLICT (quotation_number) DO NOTHING;

-- Sample Sales Orders
INSERT INTO sales.orders (tenant_id, order_number, customer_id, order_date, delivery_date, subtotal, vat_amount, total, status, assigned_to)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'SO-001', 1, CURRENT_DATE, CURRENT_DATE + 7, 86956.52, 13043.48, 100000.00, 'confirmed', 'Warehouse Team'),
    ('00000000-0000-0000-0000-000000000001', 'SO-002', 3, CURRENT_DATE - 5, CURRENT_DATE + 2, 43478.26, 6521.74, 50000.00, 'processing', 'Warehouse Team'),
    ('00000000-0000-0000-0000-000000000001', 'SO-003', 4, CURRENT_DATE - 10, CURRENT_DATE - 3, 21739.13, 3260.87, 25000.00, 'delivered', 'Warehouse Team')
ON CONFLICT (order_number) DO NOTHING;

-- Sample Item Categories
INSERT INTO inventory.item_categories (tenant_id, category_code, category_name, description, is_active)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'CAT-001', 'Raw Materials', 'Raw materials for production', TRUE),
    ('00000000-0000-0000-0000-000000000001', 'CAT-002', 'Finished Goods', 'Completed products ready for sale', TRUE),
    ('00000000-0000-0000-0000-000000000001', 'CAT-003', 'Office Supplies', 'Office consumables and supplies', TRUE),
    ('00000000-0000-0000-0000-000000000001', 'CAT-004', 'Electronics', 'Electronic components and devices', TRUE),
    ('00000000-0000-0000-0000-000000000001', 'CAT-005', 'Machinery Parts', 'Spare parts for machinery', TRUE)
ON CONFLICT (category_code) DO NOTHING;

-- Sample Warehouses
INSERT INTO inventory.warehouses (tenant_id, warehouse_code, warehouse_name, location, address, manager_name, phone, is_active)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'WH-001', 'Main Warehouse', 'Johannesburg', '123 Industrial Road, Johannesburg, 2000', 'John Manager', '+27 11 555 1234', TRUE),
    ('00000000-0000-0000-0000-000000000001', 'WH-002', 'Cape Town Warehouse', 'Cape Town', '45 Harbour Street, Cape Town, 8001', 'Sarah Supervisor', '+27 21 555 5678', TRUE),
    ('00000000-0000-0000-0000-000000000001', 'WH-003', 'Durban Distribution Center', 'Durban', '78 Port Avenue, Durban, 4001', 'Mike Logistics', '+27 31 555 9012', TRUE)
ON CONFLICT (warehouse_code) DO NOTHING;

-- Sample Items
INSERT INTO inventory.items (tenant_id, item_code, item_name, description, category, unit_of_measure, reorder_level, reorder_quantity, standard_cost, selling_price, is_active)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'ITEM-001', 'Steel Sheets 2mm', 'Cold rolled steel sheets 2mm thickness', 'Raw Materials', 'SHEET', 50, 100, 250.00, 350.00, TRUE),
    ('00000000-0000-0000-0000-000000000001', 'ITEM-002', 'Aluminum Rods 10mm', 'Aluminum rods 10mm diameter', 'Raw Materials', 'METER', 200, 500, 45.00, 65.00, TRUE),
    ('00000000-0000-0000-0000-000000000001', 'ITEM-003', 'Widget Type A', 'Standard widget type A', 'Finished Goods', 'EA', 100, 200, 125.00, 199.00, TRUE),
    ('00000000-0000-0000-0000-000000000001', 'ITEM-004', 'Widget Type B', 'Premium widget type B', 'Finished Goods', 'EA', 50, 100, 250.00, 399.00, TRUE),
    ('00000000-0000-0000-0000-000000000001', 'ITEM-005', 'Office Paper A4', 'A4 copy paper 80gsm', 'Office Supplies', 'REAM', 20, 50, 35.00, 55.00, TRUE)
ON CONFLICT (item_code) DO NOTHING;

-- Sample Stock Levels
INSERT INTO inventory.stock_levels (tenant_id, item_id, warehouse_id, quantity_on_hand, quantity_reserved, quantity_available, quantity_on_order, average_cost, total_value)
SELECT 
    '00000000-0000-0000-0000-000000000001',
    i.item_id,
    w.warehouse_id,
    150.000,
    20.000,
    130.000,
    100.000,
    i.standard_cost,
    150 * i.standard_cost
FROM inventory.items i, inventory.warehouses w
WHERE i.item_code IN ('ITEM-001', 'ITEM-002', 'ITEM-003')
AND w.warehouse_code = 'WH-001'
AND i.tenant_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (item_id, warehouse_id) DO NOTHING;

-- Sample HR Departments
INSERT INTO hr.departments (tenant_id, department_code, department_name, description, is_active)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'DEPT-001', 'Executive Management', 'C-Level executives and strategic leadership', TRUE),
    ('00000000-0000-0000-0000-000000000001', 'DEPT-002', 'Finance & Accounting', 'Financial management and accounting operations', TRUE),
    ('00000000-0000-0000-0000-000000000001', 'DEPT-003', 'Sales & Marketing', 'Sales operations and marketing campaigns', TRUE),
    ('00000000-0000-0000-0000-000000000001', 'DEPT-004', 'Operations', 'Operational management and logistics', TRUE),
    ('00000000-0000-0000-0000-000000000001', 'DEPT-005', 'Human Resources', 'HR management and employee relations', TRUE),
    ('00000000-0000-0000-0000-000000000001', 'DEPT-006', 'Information Technology', 'IT infrastructure and software development', TRUE)
ON CONFLICT (department_code) DO NOTHING;

-- Sample HR Positions
INSERT INTO hr.positions (tenant_id, position_code, position_title, department_id, minimum_salary, maximum_salary, is_active)
SELECT
    '00000000-0000-0000-0000-000000000001',
    pos.code,
    pos.title,
    d.department_id,
    pos.min_sal,
    pos.max_sal,
    TRUE
FROM (VALUES 
    ('POS-001', 'Chief Executive Officer', 'DEPT-001', 150000.00, 250000.00),
    ('POS-002', 'Chief Financial Officer', 'DEPT-002', 120000.00, 180000.00),
    ('POS-003', 'Sales Manager', 'DEPT-003', 60000.00, 90000.00),
    ('POS-004', 'Operations Manager', 'DEPT-004', 55000.00, 85000.00),
    ('POS-005', 'HR Manager', 'DEPT-005', 50000.00, 75000.00),
    ('POS-006', 'IT Manager', 'DEPT-006', 70000.00, 110000.00)
) AS pos(code, title, dept_code, min_sal, max_sal)
INNER JOIN hr.departments d ON d.department_code = pos.dept_code AND d.tenant_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (position_code) DO NOTHING;

-- Sample Employees
INSERT INTO hr.employees (tenant_id, employee_number, first_name, last_name, email, phone, department_id, position_id, employment_status, hire_date, basic_salary, housing_allowance, transport_allowance)
SELECT
    '00000000-0000-0000-0000-000000000001',
    emp.emp_no,
    emp.first_name,
    emp.last_name,
    emp.email,
    emp.phone,
    d.department_id,
    p.position_id,
    'Active',
    '2020-01-15'::DATE,
    emp.salary,
    emp.salary * 0.15,
    emp.salary * 0.05
FROM (VALUES
    ('EMP-001', 'John', 'Smith', 'john.smith@company.com', '+27 11 555 0001', 'DEPT-001', 'POS-001', 180000.00),
    ('EMP-002', 'Sarah', 'Johnson', 'sarah.johnson@company.com', '+27 11 555 0002', 'DEPT-002', 'POS-002', 140000.00),
    ('EMP-003', 'Michael', 'Brown', 'michael.brown@company.com', '+27 11 555 0003', 'DEPT-003', 'POS-003', 75000.00),
    ('EMP-004', 'Lisa', 'Davis', 'lisa.davis@company.com', '+27 11 555 0004', 'DEPT-004', 'POS-004', 70000.00),
    ('EMP-005', 'David', 'Wilson', 'david.wilson@company.com', '+27 11 555 0005', 'DEPT-005', 'POS-005', 60000.00)
) AS emp(emp_no, first_name, last_name, email, phone, dept_code, pos_code, salary)
INNER JOIN hr.departments d ON d.department_code = emp.dept_code AND d.tenant_id = '00000000-0000-0000-0000-000000000001'
INNER JOIN hr.positions p ON p.position_code = emp.pos_code AND p.tenant_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (employee_number) DO NOTHING;

-- Sample Leave Types
INSERT INTO hr.leave_types (tenant_id, leave_type_code, leave_type_name, description, default_days_per_year, is_paid, requires_approval)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'LT-001', 'Annual Leave', 'Paid annual vacation leave', 21.00, TRUE, TRUE),
    ('00000000-0000-0000-0000-000000000001', 'LT-002', 'Sick Leave', 'Paid sick leave', 30.00, TRUE, FALSE),
    ('00000000-0000-0000-0000-000000000001', 'LT-003', 'Family Responsibility', 'Family responsibility leave', 3.00, TRUE, TRUE),
    ('00000000-0000-0000-0000-000000000001', 'LT-004', 'Maternity Leave', 'Maternity leave', 120.00, TRUE, TRUE),
    ('00000000-0000-0000-0000-000000000001', 'LT-005', 'Unpaid Leave', 'Unpaid leave of absence', 0.00, FALSE, TRUE)
ON CONFLICT (leave_type_code) DO NOTHING;

-- Sample Chart of Accounts
INSERT INTO chart_of_accounts (tenant_id, code, name, account_type, account_subtype, normal_balance, current_balance, balance, is_active)
VALUES
    ('00000000-0000-0000-0000-000000000001', '1000', 'Cash and Cash Equivalents', 'ASSET', 'CURRENT_ASSET', 'DEBIT', 250000.00, 250000.00, TRUE),
    ('00000000-0000-0000-0000-000000000001', '1100', 'Accounts Receivable', 'ASSET', 'CURRENT_ASSET', 'DEBIT', 175000.00, 175000.00, TRUE),
    ('00000000-0000-0000-0000-000000000001', '1200', 'Inventory', 'ASSET', 'CURRENT_ASSET', 'DEBIT', 450000.00, 450000.00, TRUE),
    ('00000000-0000-0000-0000-000000000001', '1500', 'Fixed Assets', 'ASSET', 'FIXED_ASSET', 'DEBIT', 1200000.00, 1200000.00, TRUE),
    ('00000000-0000-0000-0000-000000000001', '2000', 'Accounts Payable', 'LIABILITY', 'CURRENT_LIABILITY', 'CREDIT', 95000.00, 95000.00, TRUE),
    ('00000000-0000-0000-0000-000000000001', '2100', 'VAT Payable', 'LIABILITY', 'CURRENT_LIABILITY', 'CREDIT', 32500.00, 32500.00, TRUE),
    ('00000000-0000-0000-0000-000000000001', '3000', 'Share Capital', 'EQUITY', 'EQUITY', 'CREDIT', 1000000.00, 1000000.00, TRUE),
    ('00000000-0000-0000-0000-000000000001', '3100', 'Retained Earnings', 'EQUITY', 'EQUITY', 'CREDIT', 500000.00, 500000.00, TRUE),
    ('00000000-0000-0000-0000-000000000001', '4000', 'Sales Revenue', 'REVENUE', 'REVENUE', 'CREDIT', 850000.00, 850000.00, TRUE),
    ('00000000-0000-0000-0000-000000000001', '5000', 'Cost of Goods Sold', 'EXPENSE', 'COGS', 'DEBIT', 340000.00, 340000.00, TRUE),
    ('00000000-0000-0000-0000-000000000001', '6000', 'Operating Expenses', 'EXPENSE', 'OPERATING_EXPENSE', 'DEBIT', 150000.00, 150000.00, TRUE)
ON CONFLICT (tenant_id, code) DO NOTHING;

-- Sample Fiscal Year
INSERT INTO fiscal_years (tenant_id, year_code, year_name, start_date, end_date, status, is_current)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'FY2025', 'Fiscal Year 2025', '2025-01-01', '2025-12-31', 'OPEN', TRUE)
ON CONFLICT (tenant_id, year_code) DO NOTHING;

-- Sample Fiscal Periods
INSERT INTO fiscal_periods (tenant_id, fiscal_year_id, period_code, period_name, period_number, start_date, end_date, status, is_current)
SELECT 
    '00000000-0000-0000-0000-000000000001',
    fy.fiscal_year_id,
    periods.code,
    periods.name,
    periods.num,
    periods.start_dt::DATE,
    periods.end_dt::DATE,
    periods.status,
    periods.current
FROM fiscal_years fy,
(VALUES
    ('2025-01', 'January 2025', 1, '2025-01-01', '2025-01-31', 'CLOSED', FALSE),
    ('2025-02', 'February 2025', 2, '2025-02-01', '2025-02-28', 'CLOSED', FALSE),
    ('2025-03', 'March 2025', 3, '2025-03-01', '2025-03-31', 'CLOSED', FALSE),
    ('2025-04', 'April 2025', 4, '2025-04-01', '2025-04-30', 'CLOSED', FALSE),
    ('2025-05', 'May 2025', 5, '2025-05-01', '2025-05-31', 'CLOSED', FALSE),
    ('2025-06', 'June 2025', 6, '2025-06-01', '2025-06-30', 'CLOSED', FALSE),
    ('2025-07', 'July 2025', 7, '2025-07-01', '2025-07-31', 'CLOSED', FALSE),
    ('2025-08', 'August 2025', 8, '2025-08-01', '2025-08-31', 'CLOSED', FALSE),
    ('2025-09', 'September 2025', 9, '2025-09-01', '2025-09-30', 'CLOSED', FALSE),
    ('2025-10', 'October 2025', 10, '2025-10-01', '2025-10-31', 'CLOSED', FALSE),
    ('2025-11', 'November 2025', 11, '2025-11-01', '2025-11-30', 'CLOSED', FALSE),
    ('2025-12', 'December 2025', 12, '2025-12-01', '2025-12-31', 'OPEN', TRUE)
) AS periods(code, name, num, start_dt, end_dt, status, current)
WHERE fy.year_code = 'FY2025' AND fy.tenant_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (tenant_id, period_code) DO NOTHING;

-- ============================================================================
-- STEP 9: VERIFICATION QUERIES
-- ============================================================================

-- Verify all tables created
SELECT 'SCHEMAS CREATED:' as info;
SELECT nspname FROM pg_namespace WHERE nspname IN ('sales', 'financial', 'inventory', 'hr', 'logistics', 'manufacturing', 'purchasing', 'warehouse', 'assets');

SELECT '--- SALES MODULE ---' as module;
SELECT 'Customers: ' || COUNT(*) FROM sales.customers;
SELECT 'Leads: ' || COUNT(*) FROM sales.leads;
SELECT 'Opportunities: ' || COUNT(*) FROM sales.opportunities;
SELECT 'Quotations: ' || COUNT(*) FROM sales.quotations;
SELECT 'Orders: ' || COUNT(*) FROM sales.orders;

SELECT '--- INVENTORY MODULE ---' as module;
SELECT 'Categories: ' || COUNT(*) FROM inventory.item_categories;
SELECT 'Warehouses: ' || COUNT(*) FROM inventory.warehouses;
SELECT 'Items: ' || COUNT(*) FROM inventory.items;
SELECT 'Stock Levels: ' || COUNT(*) FROM inventory.stock_levels;

SELECT '--- HR MODULE ---' as module;
SELECT 'Departments: ' || COUNT(*) FROM hr.departments;
SELECT 'Positions: ' || COUNT(*) FROM hr.positions;
SELECT 'Employees: ' || COUNT(*) FROM hr.employees;
SELECT 'Leave Types: ' || COUNT(*) FROM hr.leave_types;

SELECT '--- FINANCIAL MODULE ---' as module;
SELECT 'Chart of Accounts: ' || COUNT(*) FROM chart_of_accounts;
SELECT 'Fiscal Years: ' || COUNT(*) FROM fiscal_years;
SELECT 'Fiscal Periods: ' || COUNT(*) FROM fiscal_periods;

SELECT '=============================================' as separator;
SELECT 'MIGRATION COMPLETED SUCCESSFULLY!' as status;
SELECT '=============================================' as separator;
