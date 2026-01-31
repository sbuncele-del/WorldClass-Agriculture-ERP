-- ============================================================================
-- WorldClass ERP - Complete Database Schema Migration
-- Date: January 7, 2026
-- Purpose: Create all tables needed for ERP API endpoints
-- 
-- IMPORTANT: Run this on a fresh database or use IF NOT EXISTS
-- ============================================================================

-- ============================================================================
-- SCHEMA CREATION
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS hr;
CREATE SCHEMA IF NOT EXISTS manufacturing;
CREATE SCHEMA IF NOT EXISTS compliance;
CREATE SCHEMA IF NOT EXISTS inventory;

-- ============================================================================
-- HR MODULE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS hr.leave_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    leave_type_name VARCHAR(100) NOT NULL,
    description TEXT,
    default_days INTEGER DEFAULT 0,
    carry_over_allowed BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr.leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    employee_id UUID NOT NULL,
    leave_type_id UUID,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_requested DECIMAL(5,2),
    status VARCHAR(50) DEFAULT 'pending',
    reason TEXT,
    request_date TIMESTAMP DEFAULT NOW(),
    approved_by UUID,
    approved_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr.payroll_runs (
    payroll_run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    period_id UUID,
    period_start DATE,
    period_end DATE,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- MANUFACTURING MODULE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS manufacturing.boms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    product_id UUID,
    bom_name VARCHAR(255),
    version VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS manufacturing.work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    order_number VARCHAR(100),
    product_id UUID,
    quantity INTEGER,
    status VARCHAR(50) DEFAULT 'pending',
    start_date DATE,
    due_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS manufacturing.work_centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255),
    efficiency_factor DECIMAL(5,2) DEFAULT 1.0,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- COMPLIANCE MODULE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance.requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    requirement_name VARCHAR(255),
    regulatory_body VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    due_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compliance.sars_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    submission_type VARCHAR(100),
    submission_date DATE,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compliance.filings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    filing_type VARCHAR(100),
    filing_date DATE,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- HEALTHCARE VERTICAL TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS healthcare_facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    facility_name VARCHAR(255),
    facility_type VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS healthcare_patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS healthcare_appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    patient_id UUID,
    appointment_date DATE,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- MINING VERTICAL TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS mining_sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    site_name VARCHAR(255),
    location TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mining_production (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    site_id UUID,
    production_date DATE,
    quantity DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mining_safety_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    incident_date DATE,
    severity VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- CONSTRUCTION VERTICAL TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS construction_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    project_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    budget DECIMAL(15,2),
    spent_amount DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS construction_safety_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    incident_date DATE,
    severity VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- PROPERTY VERTICAL TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS property_properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    property_name VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS property_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    property_id UUID,
    unit_number VARCHAR(50),
    status VARCHAR(50) DEFAULT 'vacant',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS property_leases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    unit_id UUID,
    status VARCHAR(50) DEFAULT 'active',
    monthly_rent DECIMAL(15,2),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- AGRICULTURE VERTICAL TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS agriculture_farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    farm_name VARCHAR(255),
    total_area DECIMAL(15,2),
    location VARCHAR(255),
    hectares DECIMAL(12,2),
    crop_type VARCHAR(100),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS farm_crops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    farm_id UUID,
    crop_name VARCHAR(100),
    planted_area DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS farm_livestock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    livestock_type VARCHAR(100),
    quantity INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS farm_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    task_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- COMMUNICATIONS TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID,
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    title VARCHAR(255),
    content TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    title VARCHAR(255),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    sender_id UUID,
    recipient_id UUID,
    subject VARCHAR(255),
    body TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- MULTI-ENTITY TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    entity_name VARCHAR(255),
    entity_type VARCHAR(100),
    name VARCHAR(255),
    parent_id UUID,
    status VARCHAR(50) DEFAULT 'active',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS legal_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    entity_name VARCHAR(255),
    name VARCHAR(255),
    legal_name VARCHAR(255),
    registration_number VARCHAR(100),
    tax_number VARCHAR(100),
    entity_type VARCHAR(100),
    parent_id UUID,
    parent_entity_id UUID,
    level INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS intercompany_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    source_entity_id UUID,
    target_entity_id UUID,
    amount DECIMAL(15,2),
    status VARCHAR(50) DEFAULT 'pending',
    transaction_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- TREASURY TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS treasury_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    account_name VARCHAR(255),
    account_type VARCHAR(100),
    currency VARCHAR(10) DEFAULT 'ZAR',
    current_balance DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- AUDIT TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID,
    action VARCHAR(100),
    entity_type VARCHAR(100),
    entity_id UUID,
    details JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_engagements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    engagement_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    engagement_id UUID,
    finding_title VARCHAR(255),
    severity VARCHAR(50),
    status VARCHAR(50) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- PROJECTS TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    proposal_number VARCHAR(100),
    title VARCHAR(255),
    status VARCHAR(50) DEFAULT 'draft',
    total_amount DECIMAL(15,2),
    valid_until DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    project_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    project_id UUID,
    task_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID,
    project_id UUID,
    task_id UUID,
    hours DECIMAL(5,2),
    entry_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- AI TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID,
    suggestion_type VARCHAR(100),
    suggestion_text TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- INVENTORY TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS inventory.stock_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    item_id UUID,
    warehouse_id UUID,
    quantity DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- FINANCIAL TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    module_name VARCHAR(100),
    is_enabled BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tax_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    tax_name VARCHAR(100),
    tax_rate DECIMAL(5,2),
    tax_type VARCHAR(50),
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS asset_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    location_name VARCHAR(255),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fiscal_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    period_name VARCHAR(100),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gl_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    account_code VARCHAR(50),
    account_name VARCHAR(255),
    account_type VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_hr_leave_requests_tenant ON hr.leave_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hr_payroll_runs_tenant ON hr.payroll_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_manufacturing_boms_tenant ON manufacturing.boms(tenant_id);
CREATE INDEX IF NOT EXISTS idx_manufacturing_work_orders_tenant ON manufacturing.work_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_compliance_requirements_tenant ON compliance.requirements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_projects_tenant ON projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_tenant ON project_tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_tenant ON time_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_proposals_tenant ON proposals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_entities_tenant ON entities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_legal_entities_tenant ON legal_entities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_treasury_accounts_tenant ON treasury_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant ON audit_log(tenant_id);

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
