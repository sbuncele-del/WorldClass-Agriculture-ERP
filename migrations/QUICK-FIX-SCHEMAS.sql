-- Quick fixes for remaining column/schema issues
-- WorldClass ERP - January 2026

-- Make sure assets schema has the tables
-- DROP existing if they conflict, then recreate

-- Assets Categories
DROP TABLE IF EXISTS assets.asset_categories CASCADE;
CREATE TABLE assets.asset_categories (
    category_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT 'b36ec5a6-b637-4716-84eb-3c53eb1c7093',
    category_code VARCHAR(50) NOT NULL,
    category_name VARCHAR(200) NOT NULL,
    parent_category_id INTEGER,
    asset_gl_account VARCHAR(50),
    depreciation_gl_account VARCHAR(50),
    depreciation_expense_account VARCHAR(50),
    default_depreciation_method VARCHAR(50) DEFAULT 'STRAIGHT_LINE',
    default_useful_life_years INTEGER DEFAULT 5,
    default_residual_value_percentage DECIMAL(5,2) DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Assets Locations
DROP TABLE IF EXISTS assets.asset_locations CASCADE;
CREATE TABLE assets.asset_locations (
    location_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT 'b36ec5a6-b637-4716-84eb-3c53eb1c7093',
    location_code VARCHAR(50) NOT NULL,
    location_name VARCHAR(200) NOT NULL,
    parent_location_id INTEGER,
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    country VARCHAR(100) DEFAULT 'South Africa',
    contact_person VARCHAR(200),
    contact_phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Fixed Assets (the main table)
DROP TABLE IF EXISTS assets.fixed_assets CASCADE;
CREATE TABLE assets.fixed_assets (
    asset_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT 'b36ec5a6-b637-4716-84eb-3c53eb1c7093',
    asset_number VARCHAR(50) NOT NULL,
    asset_name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES assets.asset_categories(category_id),
    sub_category VARCHAR(100),
    serial_number VARCHAR(100),
    barcode VARCHAR(100),
    manufacturer VARCHAR(200),
    model VARCHAR(200),
    location_id INTEGER REFERENCES assets.asset_locations(location_id),
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
    depreciation_method VARCHAR(50) NOT NULL DEFAULT 'STRAIGHT_LINE',
    useful_life_years INTEGER NOT NULL DEFAULT 5,
    residual_value DECIMAL(15,2) DEFAULT 0,
    depreciation_start_date DATE,
    accumulated_depreciation DECIMAL(15,2) DEFAULT 0,
    net_book_value DECIMAL(15,2),
    last_depreciation_date DATE,
    warranty_expiry_date DATE,
    insurance_policy_number VARCHAR(100),
    insurance_expiry_date DATE,
    asset_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    condition_rating VARCHAR(20),
    disposal_date DATE,
    disposal_method VARCHAR(50),
    disposal_value DECIMAL(15,2),
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_assets_fixed_assets_tenant ON assets.fixed_assets(tenant_id);

-- Fix vehicle columns
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vehicle_registration VARCHAR(50);
ALTER TABLE logistics.vehicles ADD COLUMN IF NOT EXISTS vehicle_registration VARCHAR(50);
UPDATE vehicles SET vehicle_registration = registration_number WHERE vehicle_registration IS NULL;
UPDATE logistics.vehicles SET vehicle_registration = registration_number WHERE vehicle_registration IS NULL;

-- Fix supplier columns
ALTER TABLE purchase.suppliers ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
UPDATE purchase.suppliers SET company_name = supplier_name WHERE company_name IS NULL;

SELECT 'Schema fixes complete!' as status;
