-- ============================================================================
-- COMPLETE FIX FOR ALL 17 FAILING ENDPOINTS
-- WorldClass ERP - Production Readiness Migration
-- Created: January 2026
-- ============================================================================

-- ISSUE #1: Admin - Audit Log (audit_log table)
-- Required columns: tenant_id, user_id, action, entity_type, created_at
DROP TABLE IF EXISTS audit_log CASCADE;
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_log_tenant ON audit_log(tenant_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);

-- ISSUE #2: Admin - Settings (tenant_settings table)
-- Required columns: tenant_id, setting_key, setting_value, setting_type, description
DROP TABLE IF EXISTS tenant_settings CASCADE;
CREATE TABLE tenant_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    setting_key VARCHAR(255) NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'string',
    description TEXT,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, setting_key)
);

CREATE INDEX idx_tenant_settings_tenant ON tenant_settings(tenant_id);

-- ISSUE #3: Financial - Dashboard (journal_entry_lines)
-- First ensure financial schema exists
CREATE SCHEMA IF NOT EXISTS financial;

-- Drop and recreate journal_entries with correct structure
DROP TABLE IF EXISTS financial.journal_entry_lines CASCADE;
DROP TABLE IF EXISTS financial.journal_entries CASCADE;

CREATE TABLE financial.journal_entries (
    entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entry_number VARCHAR(50),
    entry_date DATE NOT NULL,
    reference VARCHAR(100),
    description TEXT,
    status VARCHAR(50) DEFAULT 'Draft',
    total_debit DECIMAL(18, 2) DEFAULT 0,
    total_credit DECIMAL(18, 2) DEFAULT 0,
    posted_at TIMESTAMP,
    posted_by UUID,
    reversed_at TIMESTAMP,
    reversed_by UUID,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE financial.journal_entry_lines (
    line_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID REFERENCES financial.journal_entries(entry_id),
    tenant_id UUID NOT NULL,
    account_id UUID,
    account_code VARCHAR(20),
    account_name VARCHAR(255),
    description TEXT,
    debit_amount DECIMAL(18, 2) DEFAULT 0,
    credit_amount DECIMAL(18, 2) DEFAULT 0,
    cost_center_id UUID,
    project_id UUID,
    line_number INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_journal_entries_tenant ON financial.journal_entries(tenant_id);
CREATE INDEX idx_journal_entry_lines_entry ON financial.journal_entry_lines(entry_id);
CREATE INDEX idx_journal_entry_lines_tenant ON financial.journal_entry_lines(tenant_id);

-- ISSUE #4 & #5: Financial - Budget vs Actual (budget_vs_actual table)
DROP TABLE IF EXISTS financial.budget_vs_actual CASCADE;
CREATE TABLE financial.budget_vs_actual (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    fiscal_year INTEGER,
    fiscal_period INTEGER,
    account_id UUID,
    account_code VARCHAR(20),
    account_name VARCHAR(255),
    budget_amount DECIMAL(18, 2) DEFAULT 0,
    actual_amount DECIMAL(18, 2) DEFAULT 0,
    variance DECIMAL(18, 2) DEFAULT 0,
    variance_percent DECIMAL(8, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_budget_vs_actual_tenant ON financial.budget_vs_actual(tenant_id);

-- ISSUE #6 & #7: Assets - Get Locations & Fixed Assets
CREATE SCHEMA IF NOT EXISTS assets;

DROP TABLE IF EXISTS assets.asset_locations CASCADE;
CREATE TABLE assets.asset_locations (
    location_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    location_code VARCHAR(50),
    location_name VARCHAR(255) NOT NULL,
    address TEXT,
    building VARCHAR(100),
    floor VARCHAR(50),
    room VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_asset_locations_tenant ON assets.asset_locations(tenant_id);

-- Ensure fixed_assets table has book_value column
ALTER TABLE assets.fixed_assets ADD COLUMN IF NOT EXISTS book_value DECIMAL(18, 2) DEFAULT 0;
ALTER TABLE assets.fixed_assets ADD COLUMN IF NOT EXISTS location_id UUID;

-- ISSUE #8: Manufacturing - Production Orders (proper structure)
CREATE SCHEMA IF NOT EXISTS manufacturing;

DROP TABLE IF EXISTS manufacturing.production_orders CASCADE;
CREATE TABLE manufacturing.production_orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    order_number VARCHAR(50),
    product_id UUID,
    product_name VARCHAR(255),
    bom_id UUID,
    quantity_planned DECIMAL(18, 4) DEFAULT 0,
    quantity_produced DECIMAL(18, 4) DEFAULT 0,
    start_date DATE,
    due_date DATE,
    completed_date DATE,
    status VARCHAR(50) DEFAULT 'Draft',
    priority VARCHAR(20) DEFAULT 'Normal',
    work_center_id UUID,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_production_orders_tenant ON manufacturing.production_orders(tenant_id);
CREATE INDEX idx_production_orders_status ON manufacturing.production_orders(status);

-- ISSUE #9 & #10: Logistics - Routes & Trips
CREATE SCHEMA IF NOT EXISTS logistics;

DROP TABLE IF EXISTS logistics.routes CASCADE;
CREATE TABLE logistics.routes (
    route_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    route_code VARCHAR(50),
    route_name VARCHAR(255) NOT NULL,
    origin VARCHAR(255),
    destination VARCHAR(255),
    distance_km DECIMAL(10, 2),
    estimated_time_hours DECIMAL(6, 2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

DROP TABLE IF EXISTS logistics.trips CASCADE;
CREATE TABLE logistics.trips (
    trip_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    trip_number VARCHAR(50),
    vehicle_id UUID,
    driver_id UUID,
    route_id UUID,
    departure_time TIMESTAMP,
    arrival_time TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Scheduled',
    distance_traveled DECIMAL(10, 2),
    fuel_consumed DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_routes_tenant ON logistics.routes(tenant_id);
CREATE INDEX idx_trips_tenant ON logistics.trips(tenant_id);
CREATE INDEX idx_trips_status ON logistics.trips(status);

-- ISSUE #11: Compliance - Dashboard (audits, requirements)
CREATE SCHEMA IF NOT EXISTS compliance;

DROP TABLE IF EXISTS compliance.audits CASCADE;
CREATE TABLE compliance.audits (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    audit_type VARCHAR(100),
    audit_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    scheduled_date DATE,
    completion_date DATE,
    auditor VARCHAR(255),
    findings TEXT,
    score DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

DROP TABLE IF EXISTS compliance.requirements CASCADE;
CREATE TABLE compliance.requirements (
    requirement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    requirement_code VARCHAR(50),
    requirement_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    regulatory_body VARCHAR(100),
    compliance_status VARCHAR(50) DEFAULT 'Pending',
    due_date DATE,
    last_review_date DATE,
    next_review_date DATE,
    responsible_person UUID,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audits_tenant ON compliance.audits(tenant_id);
CREATE INDEX idx_requirements_tenant ON compliance.requirements(tenant_id);
CREATE INDEX idx_requirements_status ON compliance.requirements(compliance_status);

-- ISSUE #12: Proposals (proposal_items)
DROP TABLE IF EXISTS proposal_items CASCADE;
CREATE TABLE proposal_items (
    item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    proposal_id UUID,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity DECIMAL(18, 4) DEFAULT 1,
    unit_price DECIMAL(18, 2) DEFAULT 0,
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    total_amount DECIMAL(18, 2) DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_proposal_items_proposal ON proposal_items(proposal_id);
CREATE INDEX idx_proposal_items_tenant ON proposal_items(tenant_id);

-- ISSUE #13, #14, #15: Projects - Get All, Tasks, Time Tracking
-- The controllers query: client_projects, project_tasks, project_team_members, time_entries

DROP TABLE IF EXISTS time_entries CASCADE;
DROP TABLE IF EXISTS project_tasks CASCADE;
DROP TABLE IF EXISTS project_team_members CASCADE;
DROP TABLE IF EXISTS client_projects CASCADE;

CREATE TABLE client_projects (
    project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    project_number VARCHAR(50),
    project_name VARCHAR(255) NOT NULL,
    project_type VARCHAR(100),
    customer_id UUID,
    project_manager_id UUID,
    project_partner_id UUID,
    status VARCHAR(50) DEFAULT 'Planning',
    priority VARCHAR(20) DEFAULT 'Normal',
    start_date DATE,
    end_date DATE,
    budget DECIMAL(18, 2) DEFAULT 0,
    description TEXT,
    billing_type VARCHAR(50),
    hourly_rate DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE project_team_members (
    assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    project_id UUID REFERENCES client_projects(project_id),
    employee_id UUID,
    role VARCHAR(100),
    hourly_billing_rate DECIMAL(10, 2),
    hourly_cost_rate DECIMAL(10, 2),
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE project_tasks (
    task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    project_id UUID REFERENCES client_projects(project_id),
    task_number VARCHAR(50),
    task_name VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID,
    status VARCHAR(50) DEFAULT 'Not Started',
    priority VARCHAR(20) DEFAULT 'Normal',
    estimated_hours DECIMAL(8, 2),
    actual_hours DECIMAL(8, 2),
    start_date DATE,
    due_date DATE,
    completed_date DATE,
    parent_task_id UUID,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE time_entries (
    entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    project_id UUID REFERENCES client_projects(project_id),
    task_id UUID REFERENCES project_tasks(task_id),
    employee_id UUID,
    entry_date DATE NOT NULL,
    hours DECIMAL(6, 2) NOT NULL,
    description TEXT,
    billable BOOLEAN DEFAULT true,
    status VARCHAR(50) DEFAULT 'Draft',
    approved_by UUID,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_client_projects_tenant ON client_projects(tenant_id);
CREATE INDEX idx_client_projects_customer ON client_projects(customer_id);
CREATE INDEX idx_project_team_tenant ON project_team_members(tenant_id);
CREATE INDEX idx_project_team_project ON project_team_members(project_id);
CREATE INDEX idx_project_tasks_tenant ON project_tasks(tenant_id);
CREATE INDEX idx_project_tasks_project ON project_tasks(project_id);
CREATE INDEX idx_time_entries_tenant ON time_entries(tenant_id);
CREATE INDEX idx_time_entries_project ON time_entries(project_id);
CREATE INDEX idx_time_entries_employee ON time_entries(employee_id);

-- ISSUE #16 & #17: AI Conversations, Suggestions (ai_agents table)
DROP TABLE IF EXISTS ai_conversations CASCADE;
DROP TABLE IF EXISTS ai_agents CASCADE;

CREATE TABLE ai_agents (
    agent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_code VARCHAR(50) UNIQUE NOT NULL,
    agent_name VARCHAR(255) NOT NULL,
    description TEXT,
    model VARCHAR(100) DEFAULT 'gpt-4',
    system_prompt TEXT,
    capabilities TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ai_conversations (
    conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    agent_id UUID REFERENCES ai_agents(agent_id),
    user_id UUID,
    context_data JSONB,
    last_message_at TIMESTAMP DEFAULT NOW(),
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ai_messages (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES ai_conversations(conversation_id),
    role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    tokens_used INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_conversations_tenant ON ai_conversations(tenant_id);
CREATE INDEX idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX idx_ai_messages_conversation ON ai_messages(conversation_id);

-- Insert default AI agents
INSERT INTO ai_agents (agent_code, agent_name, description, capabilities) VALUES
('general', 'General Assistant', 'General purpose AI assistant for ERP tasks', ARRAY['chat', 'suggestions', 'search']),
('sales', 'Sales Assistant', 'Specialized in sales analytics and customer insights', ARRAY['sales_analysis', 'customer_insights', 'pipeline_management']),
('finance', 'Finance Assistant', 'Financial analysis and reporting assistant', ARRAY['financial_analysis', 'reporting', 'budgeting']),
('compliance', 'Compliance Assistant', 'Regulatory compliance and audit assistant', ARRAY['compliance_check', 'audit_prep', 'regulatory_updates']),
('hr', 'HR Assistant', 'Human resources and payroll assistant', ARRAY['employee_management', 'payroll_queries', 'leave_management'])
ON CONFLICT (agent_code) DO NOTHING;

-- ISSUE: Treasury - Dashboard (treasury schema)
CREATE SCHEMA IF NOT EXISTS treasury;

DROP TABLE IF EXISTS treasury.cash_positions CASCADE;
CREATE TABLE treasury.cash_positions (
    position_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    position_date DATE NOT NULL,
    account_id UUID,
    account_name VARCHAR(255),
    opening_balance DECIMAL(18, 2) DEFAULT 0,
    receipts DECIMAL(18, 2) DEFAULT 0,
    payments DECIMAL(18, 2) DEFAULT 0,
    closing_balance DECIMAL(18, 2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'ZAR',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

DROP TABLE IF EXISTS treasury.bank_accounts CASCADE;
CREATE TABLE treasury.bank_accounts (
    account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    account_number VARCHAR(50),
    account_name VARCHAR(255) NOT NULL,
    bank_name VARCHAR(255),
    branch_code VARCHAR(20),
    account_type VARCHAR(50),
    currency VARCHAR(3) DEFAULT 'ZAR',
    current_balance DECIMAL(18, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cash_positions_tenant ON treasury.cash_positions(tenant_id);
CREATE INDEX idx_bank_accounts_tenant ON treasury.bank_accounts(tenant_id);

-- ============================================================================
-- FIX ISSUES WITH EXISTING TABLES THAT MAY HAVE WRONG STRUCTURE
-- ============================================================================

-- Ensure proposals table has all required columns
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS total_value DECIMAL(18, 2) DEFAULT 0;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(18, 2) DEFAULT 0;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(18, 2) DEFAULT 0;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS final_value DECIMAL(18, 2) DEFAULT 0;

-- Ensure employees table exists and has required columns
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employee_id UUID;
UPDATE employees SET employee_id = id WHERE employee_id IS NULL;

-- Ensure customers table has id column
ALTER TABLE customers ADD COLUMN IF NOT EXISTS id UUID;
UPDATE customers SET id = customer_id WHERE id IS NULL AND customer_id IS NOT NULL;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
GRANT USAGE ON SCHEMA financial TO postgres;
GRANT USAGE ON SCHEMA assets TO postgres;
GRANT USAGE ON SCHEMA manufacturing TO postgres;
GRANT USAGE ON SCHEMA logistics TO postgres;
GRANT USAGE ON SCHEMA compliance TO postgres;
GRANT USAGE ON SCHEMA treasury TO postgres;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA financial TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA assets TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA manufacturing TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA logistics TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA compliance TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA treasury TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;

-- ============================================================================
-- VERIFY MIGRATION SUCCESS
-- ============================================================================
SELECT 'Migration Complete!' as status;
SELECT schemaname, count(*) as table_count 
FROM pg_tables 
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
GROUP BY schemaname
ORDER BY schemaname;
