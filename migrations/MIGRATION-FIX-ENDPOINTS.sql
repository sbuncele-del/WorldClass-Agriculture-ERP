-- ============================================================================
-- MASTER MIGRATION RUNNER - All Backend Migrations
-- WorldClass ERP - January 2026
-- ============================================================================
-- 
-- This script ensures all tables expected by the backend exist
-- 
-- Run with: psql -f THIS_FILE.sql
-- ============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- PURCHASE MODULE (Backend expects purchase.suppliers not purchasing.suppliers)
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS purchase;

CREATE TABLE IF NOT EXISTS purchase.suppliers (
    supplier_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    supplier_code VARCHAR(50) UNIQUE,
    supplier_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    country VARCHAR(100) DEFAULT 'South Africa',
    postal_code VARCHAR(20),
    vat_number VARCHAR(50),
    registration_number VARCHAR(100),
    payment_terms VARCHAR(100) DEFAULT 'NET30',
    credit_limit DECIMAL(15,2) DEFAULT 0.00,
    bank_name VARCHAR(200),
    bank_account_number VARCHAR(50),
    bank_branch_code VARCHAR(20),
    currency VARCHAR(3) DEFAULT 'ZAR',
    is_active BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'active',
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_purchase_suppliers_tenant ON purchase.suppliers(tenant_id);

CREATE TABLE IF NOT EXISTS purchase.purchase_orders (
    purchase_order_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    po_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id INTEGER REFERENCES purchase.suppliers(supplier_id),
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    delivery_address TEXT,
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(15,2) DEFAULT 0.00,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'ZAR',
    status VARCHAR(50) DEFAULT 'draft',
    payment_terms VARCHAR(100),
    notes TEXT,
    created_by UUID,
    approved_by UUID,
    approved_at TIMESTAMP,
    received_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant ON purchase.purchase_orders(tenant_id);

CREATE TABLE IF NOT EXISTS purchase.purchase_order_items (
    item_id SERIAL PRIMARY KEY,
    purchase_order_id INTEGER REFERENCES purchase.purchase_orders(purchase_order_id) ON DELETE CASCADE,
    product_id INTEGER,
    product_code VARCHAR(50),
    description VARCHAR(500),
    quantity DECIMAL(15,3) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 15.00,
    total DECIMAL(15,2) NOT NULL,
    received_quantity DECIMAL(15,3) DEFAULT 0,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS purchase.requisitions (
    requisition_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    requisition_number VARCHAR(50) UNIQUE NOT NULL,
    requested_by UUID,
    department VARCHAR(100),
    required_date DATE,
    total_estimated DECIMAL(15,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'normal',
    justification TEXT,
    approved_by UUID,
    approved_at TIMESTAMP,
    converted_to_po_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_tenant ON purchase.requisitions(tenant_id);

-- ============================================================================
-- ASSET MANAGEMENT (Fixed Assets - public schema as expected by backend)
-- ============================================================================

-- Asset Categories
CREATE TABLE IF NOT EXISTS asset_categories (
    category_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    category_code VARCHAR(50) NOT NULL,
    category_name VARCHAR(200) NOT NULL,
    parent_category_id INTEGER REFERENCES asset_categories(category_id),
    asset_gl_account VARCHAR(50),
    depreciation_gl_account VARCHAR(50),
    depreciation_expense_account VARCHAR(50),
    default_depreciation_method VARCHAR(50) DEFAULT 'STRAIGHT_LINE',
    default_useful_life_years INTEGER DEFAULT 5,
    default_residual_value_percentage DECIMAL(5,2) DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, category_code)
);

-- Asset Locations
CREATE TABLE IF NOT EXISTS asset_locations (
    location_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    location_code VARCHAR(50) NOT NULL,
    location_name VARCHAR(200) NOT NULL,
    parent_location_id INTEGER REFERENCES asset_locations(location_id),
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    country VARCHAR(100) DEFAULT 'South Africa',
    contact_person VARCHAR(200),
    contact_phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, location_code)
);

-- Fixed Assets Register
CREATE TABLE IF NOT EXISTS fixed_assets (
    asset_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    asset_number VARCHAR(50) NOT NULL,
    asset_name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES asset_categories(category_id),
    sub_category VARCHAR(100),
    serial_number VARCHAR(100),
    barcode VARCHAR(100),
    manufacturer VARCHAR(200),
    model VARCHAR(200),
    location_id INTEGER REFERENCES asset_locations(location_id),
    department_id INTEGER,
    cost_center_id INTEGER,
    assigned_to_employee_id INTEGER,
    acquisition_date DATE NOT NULL DEFAULT CURRENT_DATE,
    purchase_order_number VARCHAR(50),
    supplier_id INTEGER,
    purchase_price DECIMAL(15,2) NOT NULL DEFAULT 0,
    installation_cost DECIMAL(15,2) DEFAULT 0,
    initial_cost DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'ZAR',
    funding_source VARCHAR(100),
    loan_account_number VARCHAR(50),
    depreciation_method VARCHAR(50) NOT NULL DEFAULT 'STRAIGHT_LINE',
    useful_life_years INTEGER NOT NULL DEFAULT 5,
    useful_life_months INTEGER,
    residual_value DECIMAL(15,2) DEFAULT 0,
    depreciation_start_date DATE,
    accumulated_depreciation DECIMAL(15,2) DEFAULT 0,
    net_book_value DECIMAL(15,2),
    last_depreciation_date DATE,
    revaluation_date DATE,
    revaluation_amount DECIMAL(15,2),
    revalued_by UUID,
    warranty_expiry_date DATE,
    insurance_policy_number VARCHAR(100),
    insurance_expiry_date DATE,
    insurance_value DECIMAL(15,2),
    asset_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    condition_rating VARCHAR(20),
    disposal_date DATE,
    disposal_method VARCHAR(50),
    disposal_value DECIMAL(15,2),
    disposal_buyer VARCHAR(200),
    primary_image_url VARCHAR(500),
    document_folder_path VARCHAR(500),
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, asset_number)
);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_tenant ON fixed_assets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_category ON fixed_assets(category_id);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_location ON fixed_assets(location_id);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_status ON fixed_assets(asset_status);

-- ============================================================================
-- LOGISTICS UPDATES (add vehicles to public schema as fallback)
-- ============================================================================

CREATE TABLE IF NOT EXISTS vehicles (
    vehicle_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    vehicle_code VARCHAR(50) NOT NULL,
    registration_number VARCHAR(20) NOT NULL,
    make VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    vehicle_type VARCHAR(50),
    fuel_type VARCHAR(20) DEFAULT 'diesel',
    tank_capacity DECIMAL(10,2),
    odometer_reading DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'available',
    assigned_driver_id INTEGER,
    last_service_date DATE,
    next_service_date DATE,
    insurance_expiry DATE,
    license_expiry DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, registration_number)
);
CREATE INDEX IF NOT EXISTS idx_vehicles_tenant ON vehicles(tenant_id);

CREATE TABLE IF NOT EXISTS trips (
    trip_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    trip_number VARCHAR(50) NOT NULL,
    vehicle_id INTEGER REFERENCES vehicles(vehicle_id),
    driver_id INTEGER,
    origin VARCHAR(255),
    destination VARCHAR(255),
    departure_time TIMESTAMP,
    arrival_time TIMESTAMP,
    distance_km DECIMAL(10,2),
    fuel_used DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'planned',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, trip_number)
);
CREATE INDEX IF NOT EXISTS idx_trips_tenant ON trips(tenant_id);

CREATE TABLE IF NOT EXISTS fuel_transactions (
    transaction_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    vehicle_id INTEGER REFERENCES vehicles(vehicle_id),
    driver_id INTEGER,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    fuel_type VARCHAR(20),
    quantity_liters DECIMAL(10,2) NOT NULL,
    price_per_liter DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(15,2) NOT NULL,
    odometer_reading DECIMAL(15,2),
    station_name VARCHAR(255),
    receipt_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_tenant ON fuel_transactions(tenant_id);

-- ============================================================================
-- PROPOSALS & PROJECTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS proposals (
    proposal_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    proposal_number VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    client_name VARCHAR(255),
    client_email VARCHAR(255),
    client_phone VARCHAR(50),
    description TEXT,
    value DECIMAL(15,2),
    status VARCHAR(50) DEFAULT 'draft',
    valid_until DATE,
    created_by UUID,
    sent_at TIMESTAMP,
    accepted_at TIMESTAMP,
    rejected_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, proposal_number)
);
CREATE INDEX IF NOT EXISTS idx_proposals_tenant ON proposals(tenant_id);

CREATE TABLE IF NOT EXISTS projects (
    project_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    project_code VARCHAR(50) NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    client_id UUID,
    description TEXT,
    start_date DATE,
    end_date DATE,
    budget DECIMAL(15,2),
    actual_cost DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'planning',
    progress_percent INTEGER DEFAULT 0,
    manager_id UUID,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, project_code)
);
CREATE INDEX IF NOT EXISTS idx_projects_tenant ON projects(tenant_id);

CREATE TABLE IF NOT EXISTS tasks (
    task_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    project_id INTEGER REFERENCES projects(project_id) ON DELETE CASCADE,
    task_name VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID,
    due_date DATE,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'pending',
    estimated_hours DECIMAL(10,2),
    actual_hours DECIMAL(10,2),
    completed_at TIMESTAMP,
    parent_task_id INTEGER REFERENCES tasks(task_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tasks_tenant ON tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);

CREATE TABLE IF NOT EXISTS time_entries (
    entry_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    project_id INTEGER REFERENCES projects(project_id) ON DELETE CASCADE,
    task_id INTEGER REFERENCES tasks(task_id) ON DELETE SET NULL,
    user_id UUID NOT NULL,
    entry_date DATE NOT NULL,
    hours DECIMAL(5,2) NOT NULL,
    description TEXT,
    billable BOOLEAN DEFAULT true,
    hourly_rate DECIMAL(10,2),
    approved BOOLEAN DEFAULT false,
    approved_by UUID,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_time_entries_tenant ON time_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_project ON time_entries(project_id);

-- ============================================================================
-- AI ASSISTANT
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_conversations (
    conversation_id SERIAL PRIMARY KEY,
    id UUID DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    user_id UUID NOT NULL,
    title VARCHAR(255),
    context JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_tenant ON ai_conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id);

CREATE TABLE IF NOT EXISTS ai_messages (
    message_id SERIAL PRIMARY KEY,
    id UUID DEFAULT gen_random_uuid(),
    conversation_id INTEGER REFERENCES ai_conversations(conversation_id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON ai_messages(conversation_id);

CREATE TABLE IF NOT EXISTS ai_suggestions (
    suggestion_id SERIAL PRIMARY KEY,
    id UUID DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    suggestion_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    data JSONB DEFAULT '{}',
    priority INTEGER DEFAULT 5,
    status VARCHAR(20) DEFAULT 'pending',
    dismissed_at TIMESTAMP,
    applied_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_tenant ON ai_suggestions(tenant_id);

-- ============================================================================
-- ADMIN & AUDIT
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_settings (
    setting_id SERIAL PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB DEFAULT '{}',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, setting_key)
);

-- Extend audit_log table if needed
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- ============================================================================
-- TREASURY
-- ============================================================================

CREATE TABLE IF NOT EXISTS treasury_accounts (
    account_id SERIAL PRIMARY KEY,
    id UUID DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    account_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(50),
    bank_name VARCHAR(255),
    account_type VARCHAR(50) DEFAULT 'checking',
    currency VARCHAR(10) DEFAULT 'ZAR',
    current_balance DECIMAL(15,2) DEFAULT 0.00,
    available_balance DECIMAL(15,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    gl_account_code VARCHAR(20),
    last_reconciled_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_treasury_accounts_tenant ON treasury_accounts(tenant_id);

-- ============================================================================
-- COMPLIANCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance_items (
    item_id SERIAL PRIMARY KEY,
    id UUID DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    item_type VARCHAR(50) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    assigned_to UUID,
    completed_at TIMESTAMP,
    completed_by UUID,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_compliance_items_tenant ON compliance_items(tenant_id);

-- ============================================================================
-- HR Dashboard Support
-- ============================================================================

-- Add columns HR dashboard may need
ALTER TABLE hr.employees ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE hr.employees ADD COLUMN IF NOT EXISTS department_name VARCHAR(255);
ALTER TABLE hr.employees ADD COLUMN IF NOT EXISTS position_name VARCHAR(255);

-- ============================================================================
-- FINANCIAL Dashboard Support
-- ============================================================================

-- Make sure we have proper fiscal period data structure
ALTER TABLE fiscal_periods ADD COLUMN IF NOT EXISTS period_number INTEGER;
ALTER TABLE fiscal_periods ADD COLUMN IF NOT EXISTS is_adjustment BOOLEAN DEFAULT false;
ALTER TABLE fiscal_years ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'open';

-- ============================================================================
-- MANUFACTURING
-- ============================================================================

CREATE TABLE IF NOT EXISTS boms (
    bom_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    bom_code VARCHAR(50) NOT NULL,
    product_id INTEGER,
    product_name VARCHAR(255) NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    effective_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, bom_code)
);
CREATE INDEX IF NOT EXISTS idx_boms_tenant ON boms(tenant_id);

CREATE TABLE IF NOT EXISTS work_orders (
    work_order_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    wo_number VARCHAR(50) NOT NULL,
    bom_id INTEGER REFERENCES boms(bom_id),
    product_name VARCHAR(255),
    quantity_ordered DECIMAL(15,3) NOT NULL DEFAULT 1,
    quantity_completed DECIMAL(15,3) DEFAULT 0,
    start_date DATE,
    due_date DATE,
    status VARCHAR(50) DEFAULT 'planned',
    priority VARCHAR(20) DEFAULT 'medium',
    assigned_to UUID,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, wo_number)
);
CREATE INDEX IF NOT EXISTS idx_work_orders_tenant ON work_orders(tenant_id);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_notifications (
    notification_id SERIAL PRIMARY KEY,
    id UUID DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    user_id UUID NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_tenant ON user_notifications(tenant_id);

-- ============================================================================
-- MESSAGING (Direct Messages)
-- ============================================================================

CREATE TABLE IF NOT EXISTS direct_messages (
    message_id SERIAL PRIMARY KEY,
    id UUID DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    sender_id UUID NOT NULL,
    recipient_id UUID NOT NULL,
    subject VARCHAR(255),
    body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    parent_id INTEGER REFERENCES direct_messages(message_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_direct_messages_tenant ON direct_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient ON direct_messages(recipient_id);

-- ============================================================================
-- SET DEFAULT TENANT
-- ============================================================================

-- Update tenant_id in tables that need it
UPDATE fixed_assets SET tenant_id = 'b36ec5a6-b637-4716-84eb-3c53eb1c7093' WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
UPDATE asset_categories SET tenant_id = 'b36ec5a6-b637-4716-84eb-3c53eb1c7093' WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
UPDATE asset_locations SET tenant_id = 'b36ec5a6-b637-4716-84eb-3c53eb1c7093' WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
UPDATE purchase.suppliers SET tenant_id = 'b36ec5a6-b637-4716-84eb-3c53eb1c7093' WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
UPDATE purchase.purchase_orders SET tenant_id = 'b36ec5a6-b637-4716-84eb-3c53eb1c7093' WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
UPDATE purchase.requisitions SET tenant_id = 'b36ec5a6-b637-4716-84eb-3c53eb1c7093' WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
UPDATE proposals SET tenant_id = 'b36ec5a6-b637-4716-84eb-3c53eb1c7093' WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
UPDATE projects SET tenant_id = 'b36ec5a6-b637-4716-84eb-3c53eb1c7093' WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
UPDATE tasks SET tenant_id = 'b36ec5a6-b637-4716-84eb-3c53eb1c7093' WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
UPDATE vehicles SET tenant_id = 'b36ec5a6-b637-4716-84eb-3c53eb1c7093' WHERE tenant_id = '00000000-0000-0000-0000-000000000001';

-- ============================================================================
-- DONE
-- ============================================================================
SELECT 'Migration complete!' as status;
SELECT table_schema, COUNT(*) as tables FROM information_schema.tables 
WHERE table_schema NOT IN ('pg_catalog', 'information_schema') 
GROUP BY table_schema ORDER BY tables DESC;
