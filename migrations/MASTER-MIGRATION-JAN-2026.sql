-- ============================================================================
-- MASTER DATABASE MIGRATION - January 2026
-- WorldClass ERP - Complete Schema Sync
-- ============================================================================
-- 
-- This migration addresses ALL failing API endpoints discovered by test suite.
-- 
-- Test Results: 15 PASS, 29 FAIL, 33 SKIP
-- 
-- FAILURES CATEGORIZED:
-- 1. Missing tables (12 issues)
-- 2. Missing columns (8 issues)
-- 3. Missing schemas (3 issues)
-- 4. Data/FK issues (6 issues)
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- SECTION 1: CORE TABLES (Admin, Settings, Audit)
-- ============================================================================

-- Admin Settings Table (for /api/v2/admin/settings)
CREATE TABLE IF NOT EXISTS admin_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB DEFAULT '{}',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, setting_key)
);

-- Audit Trail Table (for /api/v2/admin/audit-log)
CREATE TABLE IF NOT EXISTS audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    action VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audit_trail_tenant ON audit_trail(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_entity ON audit_trail(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_created ON audit_trail(created_at DESC);

-- ============================================================================
-- SECTION 2: INVENTORY MODULE
-- ============================================================================

-- Add missing column to item_categories
ALTER TABLE inventory.item_categories ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE inventory.item_categories ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE inventory.item_categories ADD COLUMN IF NOT EXISTS code VARCHAR(50);
UPDATE inventory.item_categories SET name = category_name, code = category_code WHERE name IS NULL;

-- ============================================================================
-- SECTION 3: SALES MODULE
-- ============================================================================

-- Sales Invoices Table
CREATE TABLE IF NOT EXISTS sales.invoices (
    invoice_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    order_id INTEGER REFERENCES sales.orders(order_id),
    customer_id INTEGER REFERENCES sales.customers(customer_id),
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(15,2) DEFAULT 0.00,
    vat_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    amount_paid DECIMAL(15,2) DEFAULT 0.00,
    balance_due DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'draft',
    notes TEXT,
    terms TEXT,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_tenant ON sales.invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer ON sales.invoices(customer_id);

-- ============================================================================
-- SECTION 4: PURCHASE MODULE
-- ============================================================================

-- Create purchasing schema tables
CREATE SCHEMA IF NOT EXISTS purchasing;

-- Suppliers Table
CREATE TABLE IF NOT EXISTS purchasing.suppliers (
    supplier_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    supplier_code VARCHAR(50) UNIQUE NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'South Africa',
    vat_number VARCHAR(50),
    payment_terms VARCHAR(100),
    credit_limit DECIMAL(15,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant ON purchasing.suppliers(tenant_id);

-- Purchase Orders Table
CREATE TABLE IF NOT EXISTS purchasing.purchase_orders (
    po_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    po_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id INTEGER REFERENCES purchasing.suppliers(supplier_id),
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_date DATE,
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    vat_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'draft',
    notes TEXT,
    created_by UUID,
    approved_by UUID,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant ON purchasing.purchase_orders(tenant_id);

-- Purchase Requisitions Table
CREATE TABLE IF NOT EXISTS purchasing.requisitions (
    requisition_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    requisition_number VARCHAR(50) UNIQUE NOT NULL,
    requested_by UUID,
    department VARCHAR(100),
    required_date DATE,
    total_estimated DECIMAL(15,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'pending',
    justification TEXT,
    approved_by UUID,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_requisitions_tenant ON purchasing.requisitions(tenant_id);

-- ============================================================================
-- SECTION 5: FINANCIAL MODULE
-- ============================================================================

-- GL Explorer filter options need fiscal_periods
ALTER TABLE fiscal_periods ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE fiscal_periods ADD COLUMN IF NOT EXISTS is_closed BOOLEAN DEFAULT false;
ALTER TABLE fiscal_years ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

-- ============================================================================
-- SECTION 6: ASSET MANAGEMENT
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS assets;

-- Asset Categories
CREATE TABLE IF NOT EXISTS assets.categories (
    category_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    category_code VARCHAR(50) NOT NULL,
    category_name VARCHAR(255) NOT NULL,
    depreciation_method VARCHAR(50) DEFAULT 'straight-line',
    useful_life_years INTEGER DEFAULT 5,
    salvage_value_percent DECIMAL(5,2) DEFAULT 0.00,
    gl_asset_account VARCHAR(20),
    gl_depreciation_account VARCHAR(20),
    gl_expense_account VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, category_code)
);
CREATE INDEX IF NOT EXISTS idx_asset_categories_tenant ON assets.categories(tenant_id);

-- Asset Locations
CREATE TABLE IF NOT EXISTS assets.locations (
    location_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    location_code VARCHAR(50) NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    address TEXT,
    building VARCHAR(100),
    floor VARCHAR(50),
    room VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, location_code)
);
CREATE INDEX IF NOT EXISTS idx_asset_locations_tenant ON assets.locations(tenant_id);

-- Assets Table
CREATE TABLE IF NOT EXISTS assets.assets (
    asset_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    asset_code VARCHAR(50) NOT NULL,
    asset_name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES assets.categories(category_id),
    location_id INTEGER REFERENCES assets.locations(location_id),
    serial_number VARCHAR(100),
    acquisition_date DATE NOT NULL,
    acquisition_cost DECIMAL(15,2) NOT NULL,
    accumulated_depreciation DECIMAL(15,2) DEFAULT 0.00,
    net_book_value DECIMAL(15,2) NOT NULL,
    useful_life_years INTEGER DEFAULT 5,
    salvage_value DECIMAL(15,2) DEFAULT 0.00,
    depreciation_method VARCHAR(50) DEFAULT 'straight-line',
    status VARCHAR(50) DEFAULT 'active',
    disposal_date DATE,
    disposal_amount DECIMAL(15,2),
    assigned_to UUID,
    warranty_expiry DATE,
    last_maintenance DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, asset_code)
);
CREATE INDEX IF NOT EXISTS idx_assets_tenant ON assets.assets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets.assets(category_id);
CREATE INDEX IF NOT EXISTS idx_assets_location ON assets.assets(location_id);

-- ============================================================================
-- SECTION 7: LOGISTICS MODULE
-- ============================================================================

-- Vehicles Table
CREATE TABLE IF NOT EXISTS logistics.vehicles (
    vehicle_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
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
    UNIQUE(tenant_id, vehicle_code)
);
CREATE INDEX IF NOT EXISTS idx_vehicles_tenant ON logistics.vehicles(tenant_id);

-- Drivers Table
CREATE TABLE IF NOT EXISTS logistics.drivers (
    driver_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    driver_code VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    id_number VARCHAR(20),
    license_number VARCHAR(50),
    license_type VARCHAR(20),
    license_expiry DATE,
    phone VARCHAR(20),
    email VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, driver_code)
);
CREATE INDEX IF NOT EXISTS idx_drivers_tenant ON logistics.drivers(tenant_id);

-- Trips Table
CREATE TABLE IF NOT EXISTS logistics.trips (
    trip_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    trip_number VARCHAR(50) NOT NULL,
    vehicle_id INTEGER REFERENCES logistics.vehicles(vehicle_id),
    driver_id INTEGER REFERENCES logistics.drivers(driver_id),
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
CREATE INDEX IF NOT EXISTS idx_trips_tenant ON logistics.trips(tenant_id);

-- Fuel Transactions Table
CREATE TABLE IF NOT EXISTS logistics.fuel_transactions (
    transaction_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    vehicle_id INTEGER REFERENCES logistics.vehicles(vehicle_id),
    driver_id INTEGER REFERENCES logistics.drivers(driver_id),
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
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_tenant ON logistics.fuel_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_vehicle ON logistics.fuel_transactions(vehicle_id);

-- ============================================================================
-- SECTION 8: COMPLIANCE MODULE
-- ============================================================================

-- Compliance Items Table
CREATE TABLE IF NOT EXISTS compliance_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
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
-- SECTION 9: COMMUNICATIONS MODULE
-- ============================================================================

-- Direct Messages Table
CREATE TABLE IF NOT EXISTS direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    recipient_id UUID NOT NULL,
    subject VARCHAR(255),
    body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    parent_id UUID REFERENCES direct_messages(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_messages_tenant ON direct_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON direct_messages(recipient_id);

-- User Notifications Table
CREATE TABLE IF NOT EXISTS user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON user_notifications(tenant_id);

-- ============================================================================
-- SECTION 10: PROPOSALS & PROJECTS
-- ============================================================================

-- Proposals Table
CREATE TABLE IF NOT EXISTS proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    proposal_number VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    client_name VARCHAR(255),
    client_email VARCHAR(255),
    description TEXT,
    value DECIMAL(15,2),
    status VARCHAR(50) DEFAULT 'draft',
    valid_until DATE,
    created_by UUID,
    sent_at TIMESTAMP,
    accepted_at TIMESTAMP,
    rejected_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, proposal_number)
);
CREATE INDEX IF NOT EXISTS idx_proposals_tenant ON proposals(tenant_id);

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    project_code VARCHAR(50) NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    client_id UUID,
    description TEXT,
    start_date DATE,
    end_date DATE,
    budget DECIMAL(15,2),
    status VARCHAR(50) DEFAULT 'planning',
    manager_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, project_code)
);
CREATE INDEX IF NOT EXISTS idx_projects_tenant ON projects(tenant_id);

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    task_name VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID,
    due_date DATE,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'pending',
    estimated_hours DECIMAL(10,2),
    actual_hours DECIMAL(10,2),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tasks_tenant ON tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);

-- Time Entries Table
CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
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
CREATE INDEX IF NOT EXISTS idx_time_entries_user ON time_entries(user_id);

-- ============================================================================
-- SECTION 11: AI ASSISTANT
-- ============================================================================

-- AI Conversations Table
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    title VARCHAR(255),
    context JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_tenant ON ai_conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id);

-- AI Messages Table
CREATE TABLE IF NOT EXISTS ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON ai_messages(conversation_id);

-- AI Suggestions Table
CREATE TABLE IF NOT EXISTS ai_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
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
-- SECTION 12: TREASURY
-- ============================================================================

-- Treasury Dashboard needs bank_accounts (link to cash management)
CREATE TABLE IF NOT EXISTS treasury_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    account_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(50),
    bank_name VARCHAR(255),
    account_type VARCHAR(50) DEFAULT 'checking',
    currency VARCHAR(10) DEFAULT 'ZAR',
    current_balance DECIMAL(15,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    gl_account_code VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_treasury_accounts_tenant ON treasury_accounts(tenant_id);

-- ============================================================================
-- SECTION 13: HR MODULE ADDITIONS
-- ============================================================================

-- HR Dashboard needs aggregation tables
ALTER TABLE hr.employees ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE hr.employees ADD COLUMN IF NOT EXISTS employment_status VARCHAR(50) DEFAULT 'active';
ALTER TABLE hr.departments ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE hr.positions ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

-- ============================================================================
-- SECTION 14: MANUFACTURING MODULE
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS manufacturing;

-- Bill of Materials
CREATE TABLE IF NOT EXISTS manufacturing.boms (
    bom_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_boms_tenant ON manufacturing.boms(tenant_id);

-- Work Orders
CREATE TABLE IF NOT EXISTS manufacturing.work_orders (
    work_order_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    wo_number VARCHAR(50) NOT NULL,
    bom_id INTEGER REFERENCES manufacturing.boms(bom_id),
    product_name VARCHAR(255),
    quantity_ordered DECIMAL(15,3) NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_work_orders_tenant ON manufacturing.work_orders(tenant_id);

-- ============================================================================
-- SECTION 15: INSERT DEFAULT DATA
-- ============================================================================

-- Insert default admin settings for existing tenants
INSERT INTO admin_settings (tenant_id, setting_key, setting_value, description)
SELECT id, 'general', '{"company_name": "' || name || '"}', 'General settings'
FROM tenants
WHERE NOT EXISTS (
    SELECT 1 FROM admin_settings WHERE admin_settings.tenant_id = tenants.id AND setting_key = 'general'
);

-- ============================================================================
-- MIGRATION TRACKING
-- ============================================================================

INSERT INTO schema_migrations (version, description, executed_at)
VALUES ('20260106_master_migration', 'Master migration fixing all 29 failing endpoints', NOW())
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these to verify migration success:
-- SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog', 'information_schema');
-- SELECT table_schema, COUNT(*) FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog', 'information_schema') GROUP BY table_schema;
