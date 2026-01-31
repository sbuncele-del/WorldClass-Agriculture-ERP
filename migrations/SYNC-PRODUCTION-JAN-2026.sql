-- ============================================================================
-- PRODUCTION DATABASE SYNC MIGRATION
-- WorldClass ERP
-- Created: January 6, 2026
-- Purpose: Sync production database schema with current codebase
-- ============================================================================

-- This migration adds ALL missing columns and tables that the current
-- backend code expects. Run this to fix 500 errors from schema mismatches.

BEGIN;

-- ============================================================================
-- STEP 1: CREATE MIGRATION TRACKING TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(64)
);

-- Record this migration
INSERT INTO schema_migrations (migration_name, checksum) 
VALUES ('SYNC-PRODUCTION-JAN-2026', 'manual-sync')
ON CONFLICT (migration_name) DO NOTHING;

-- ============================================================================
-- STEP 2: TENANTS TABLE - Add missing columns
-- ============================================================================
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'free';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'active';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}';

-- ============================================================================
-- STEP 3: USERS TABLE - Add missing columns  
-- ============================================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]';
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS job_title VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(45);
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS session_token VARCHAR(255);

-- ============================================================================
-- STEP 4: CREATE INVENTORY SCHEMA AND TABLES
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS inventory;

-- Item Categories
CREATE TABLE IF NOT EXISTS inventory.item_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES inventory.item_categories(id),
    code VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_item_categories_tenant ON inventory.item_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_item_categories_parent ON inventory.item_categories(parent_id);

-- Inventory Items
CREATE TABLE IF NOT EXISTS inventory.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES inventory.item_categories(id),
    unit_of_measure VARCHAR(50) DEFAULT 'each',
    cost_price DECIMAL(15,4) DEFAULT 0,
    selling_price DECIMAL(15,4) DEFAULT 0,
    min_stock_level INTEGER DEFAULT 0,
    max_stock_level INTEGER DEFAULT 0,
    reorder_point INTEGER DEFAULT 0,
    reorder_quantity INTEGER DEFAULT 0,
    lead_time_days INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_serialized BOOLEAN DEFAULT FALSE,
    is_batch_tracked BOOLEAN DEFAULT FALSE,
    barcode VARCHAR(100),
    weight DECIMAL(10,4),
    dimensions JSONB,
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    UNIQUE(tenant_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_tenant ON inventory.inventory_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_sku ON inventory.inventory_items(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory.inventory_items(category_id);

-- Warehouses
CREATE TABLE IF NOT EXISTS inventory.warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    phone VARCHAR(50),
    email VARCHAR(255),
    manager_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    UNIQUE(tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_warehouses_tenant ON inventory.warehouses(tenant_id);

-- Stock Levels
CREATE TABLE IF NOT EXISTS inventory.stock_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory.inventory_items(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES inventory.warehouses(id) ON DELETE CASCADE,
    location_code VARCHAR(50),
    quantity_on_hand INTEGER DEFAULT 0,
    quantity_reserved INTEGER DEFAULT 0,
    quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
    last_count_date TIMESTAMP,
    last_movement_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, item_id, warehouse_id, location_code)
);

CREATE INDEX IF NOT EXISTS idx_stock_levels_tenant ON inventory.stock_levels(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stock_levels_item ON inventory.stock_levels(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_levels_warehouse ON inventory.stock_levels(warehouse_id);

-- Stock Movements
CREATE TABLE IF NOT EXISTS inventory.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory.inventory_items(id),
    warehouse_id UUID NOT NULL REFERENCES inventory.warehouses(id),
    movement_type VARCHAR(50) NOT NULL, -- receipt, issue, transfer, adjustment
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(15,4),
    reference_type VARCHAR(50), -- purchase_order, sales_order, adjustment
    reference_id UUID,
    reference_number VARCHAR(100),
    from_location VARCHAR(50),
    to_location VARCHAR(50),
    batch_number VARCHAR(100),
    serial_number VARCHAR(100),
    reason TEXT,
    notes TEXT,
    movement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_tenant ON inventory.stock_movements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON inventory.stock_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_warehouse ON inventory.stock_movements(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON inventory.stock_movements(movement_date);

-- ============================================================================
-- STEP 5: CREATE TENANT SETTINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
    company_name VARCHAR(255),
    company_logo TEXT,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    tax_number VARCHAR(100),
    registration_number VARCHAR(100),
    currency VARCHAR(10) DEFAULT 'ZAR',
    timezone VARCHAR(50) DEFAULT 'Africa/Johannesburg',
    date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    financial_year_start INTEGER DEFAULT 3,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenant_settings_tenant ON tenant_settings(tenant_id);

-- Insert default settings for existing tenant if not exists
INSERT INTO tenant_settings (tenant_id, company_name)
SELECT id, name FROM tenants
WHERE id NOT IN (SELECT tenant_id FROM tenant_settings)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 6: CREATE COMMUNICATIONS TABLES
-- ============================================================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    recipient_id UUID NOT NULL REFERENCES users(id),
    subject VARCHAR(255),
    body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    parent_id UUID REFERENCES messages(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_tenant ON messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- ============================================================================
-- STEP 7: REFRESH TOKENS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP,
    device_info JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);

-- ============================================================================
-- STEP 8: AUDIT LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255),
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_log_tenant ON audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);

COMMIT;

-- ============================================================================
-- POST-MIGRATION VERIFICATION
-- ============================================================================
-- Run these queries to verify the migration was successful:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'tenants';
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'users';
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'inventory';
