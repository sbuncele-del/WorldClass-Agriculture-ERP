-- ============================================================================
-- ASSET MANAGEMENT MODULE - DATABASE SCHEMA
-- Worldclass ERP Software
-- Created: November 13, 2025
-- ============================================================================

-- ============================================================================
-- 1. ASSET CATEGORIES & CLASSIFICATION
-- ============================================================================

-- Asset Categories
CREATE TABLE IF NOT EXISTS asset_categories (
    category_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    category_code VARCHAR(50) NOT NULL UNIQUE,
    category_name VARCHAR(200) NOT NULL,
    parent_category_id INTEGER REFERENCES asset_categories(category_id),
    
    -- Accounting
    asset_gl_account VARCHAR(50), -- Balance Sheet Asset Account
    depreciation_gl_account VARCHAR(50), -- Accumulated Depreciation Account
    depreciation_expense_account VARCHAR(50), -- Depreciation Expense Account
    
    -- Default Depreciation Settings
    default_depreciation_method VARCHAR(50) DEFAULT 'STRAIGHT_LINE',
    default_useful_life_years INTEGER DEFAULT 5,
    default_residual_value_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Category Details
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    
    created_by UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_depreciation_method CHECK (default_depreciation_method IN ('STRAIGHT_LINE', 'DECLINING_BALANCE', 'UNITS_OF_PRODUCTION', 'SUM_OF_YEARS_DIGITS'))
);

CREATE INDEX IF NOT EXISTS idx_asset_categories_active ON asset_categories(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_asset_categories_parent ON asset_categories(parent_category_id);

-- Pre-populate common asset categories
INSERT INTO asset_categories (category_code, category_name, default_depreciation_method, default_useful_life_years) VALUES
('BUILDINGS', 'Buildings & Structures', 'STRAIGHT_LINE', 25),
('LAND', 'Land', 'STRAIGHT_LINE', 0),
('VEHICLES', 'Vehicles', 'STRAIGHT_LINE', 5),
('COMPUTERS', 'Computer Equipment', 'STRAIGHT_LINE', 3),
('FURNITURE', 'Furniture & Fixtures', 'STRAIGHT_LINE', 7),
('MACHINERY', 'Machinery & Equipment', 'STRAIGHT_LINE', 10),
('IT_EQUIPMENT', 'IT Infrastructure', 'STRAIGHT_LINE', 5),
('OFFICE_EQUIP', 'Office Equipment', 'STRAIGHT_LINE', 5),
('LEASEHOLD', 'Leasehold Improvements', 'STRAIGHT_LINE', 10)
ON CONFLICT (category_code) DO NOTHING;


-- Asset Locations
CREATE TABLE IF NOT EXISTS asset_locations (
    location_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    location_code VARCHAR(50) NOT NULL UNIQUE,
    location_name VARCHAR(200) NOT NULL,
    parent_location_id INTEGER REFERENCES asset_locations(location_id),
    
    -- Address
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    country VARCHAR(100) DEFAULT 'South Africa',
    
    -- Contact
    contact_person VARCHAR(200),
    contact_phone VARCHAR(50),
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_asset_locations_active ON asset_locations(is_active) WHERE is_active = true;


-- ============================================================================
-- 2. FIXED ASSETS REGISTER
-- ============================================================================

-- Fixed Assets
CREATE TABLE IF NOT EXISTS fixed_assets (
    asset_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    -- Asset Identification
    asset_number VARCHAR(50) NOT NULL UNIQUE,
    asset_name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Classification
    category_id INTEGER NOT NULL REFERENCES asset_categories(category_id),
    sub_category VARCHAR(100),
    
    -- Physical Details
    serial_number VARCHAR(100),
    barcode VARCHAR(100),
    manufacturer VARCHAR(200),
    model VARCHAR(200),
    
    -- Location & Assignment
    location_id INTEGER REFERENCES asset_locations(location_id),
    department_id INTEGER,
    cost_center_id INTEGER,
    assigned_to_employee_id INTEGER,
    
    -- Financial Details
    acquisition_date DATE NOT NULL,
    purchase_order_number VARCHAR(50),
    supplier_id INTEGER,
    purchase_price DECIMAL(15,2) NOT NULL,
    installation_cost DECIMAL(15,2) DEFAULT 0,
    initial_cost DECIMAL(15,2) NOT NULL, -- purchase_price + installation_cost + other costs
    currency VARCHAR(3) DEFAULT 'ZAR',
    
    -- Funding
    funding_source VARCHAR(100), -- CASH, LOAN, LEASE, GRANT
    loan_account_number VARCHAR(50),
    
    -- Depreciation Parameters
    depreciation_method VARCHAR(50) NOT NULL DEFAULT 'STRAIGHT_LINE',
    useful_life_years INTEGER NOT NULL,
    useful_life_months INTEGER, -- For precise calculation
    residual_value DECIMAL(15,2) DEFAULT 0,
    depreciation_start_date DATE NOT NULL,
    
    -- Current Values
    accumulated_depreciation DECIMAL(15,2) DEFAULT 0,
    net_book_value DECIMAL(15,2),
    last_depreciation_date DATE,
    
    -- Revaluation
    revaluation_date DATE,
    revaluation_amount DECIMAL(15,2),
    revalued_by UUID,
    
    -- Warranty & Insurance
    warranty_expiry_date DATE,
    insurance_policy_number VARCHAR(100),
    insurance_expiry_date DATE,
    insurance_value DECIMAL(15,2),
    
    -- Status
    asset_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, UNDER_MAINTENANCE, DISPOSED, SOLD, STOLEN, LOST, WRITTEN_OFF
    condition_rating VARCHAR(20), -- EXCELLENT, GOOD, FAIR, POOR
    
    -- Disposal (if disposed)
    disposal_date DATE,
    disposal_method VARCHAR(50), -- SOLD, SCRAPPED, DONATED, TRADE_IN
    disposal_value DECIMAL(15,2),
    disposal_buyer VARCHAR(200),
    
    -- Images & Documents
    primary_image_url VARCHAR(500),
    document_folder_path VARCHAR(500),
    
    -- Notes
    notes TEXT,
    
    -- Audit
    created_by UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_asset_status CHECK (asset_status IN ('ACTIVE', 'UNDER_MAINTENANCE', 'DISPOSED', 'SOLD', 'STOLEN', 'LOST', 'WRITTEN_OFF', 'RETIRED')),
    CONSTRAINT chk_depreciation_method_asset CHECK (depreciation_method IN ('STRAIGHT_LINE', 'DECLINING_BALANCE', 'UNITS_OF_PRODUCTION', 'SUM_OF_YEARS_DIGITS', 'NONE'))
);

CREATE INDEX IF NOT EXISTS idx_fixed_assets_number ON fixed_assets(asset_number);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_category ON fixed_assets(category_id);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_location ON fixed_assets(location_id);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_status ON fixed_assets(asset_status);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_department ON fixed_assets(department_id);


-- ============================================================================
-- 3. DEPRECIATION TRACKING
-- ============================================================================

-- Depreciation Schedule
CREATE TABLE IF NOT EXISTS asset_depreciation_schedule (
    schedule_id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL REFERENCES fixed_assets(asset_id) ON DELETE CASCADE,
    
    -- Period
    depreciation_date DATE NOT NULL,
    fiscal_period_id INTEGER,
    
    -- Amounts
    opening_book_value DECIMAL(15,2) NOT NULL,
    depreciation_amount DECIMAL(15,2) NOT NULL,
    accumulated_depreciation DECIMAL(15,2) NOT NULL,
    closing_book_value DECIMAL(15,2) NOT NULL,
    
    -- Calculation Details
    calculation_method VARCHAR(50) NOT NULL,
    calculation_basis TEXT, -- Details of calculation
    
    -- GL Posting
    journal_entry_id INTEGER,
    posted_to_gl BOOLEAN DEFAULT false,
    posted_at TIMESTAMP,
    
    -- Status
    status VARCHAR(20) DEFAULT 'CALCULATED', -- CALCULATED, POSTED, REVERSED
    
    created_by UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_depreciation_status CHECK (status IN ('CALCULATED', 'POSTED', 'REVERSED'))
);

CREATE INDEX IF NOT EXISTS idx_depreciation_asset ON asset_depreciation_schedule(asset_id);
CREATE INDEX IF NOT EXISTS idx_depreciation_date ON asset_depreciation_schedule(depreciation_date DESC);
CREATE INDEX IF NOT EXISTS idx_depreciation_posted ON asset_depreciation_schedule(posted_to_gl);


-- ============================================================================
-- 4. ASSET TRANSFERS
-- ============================================================================

-- Asset Transfers (Location/Department/Employee changes)
CREATE TABLE IF NOT EXISTS asset_transfers (
    transfer_id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL REFERENCES fixed_assets(asset_id),
    
    transfer_date DATE NOT NULL,
    transfer_number VARCHAR(50) NOT NULL UNIQUE,
    
    -- From
    from_location_id INTEGER REFERENCES asset_locations(location_id),
    from_department_id INTEGER,
    from_cost_center_id INTEGER,
    from_employee_id INTEGER,
    
    -- To
    to_location_id INTEGER REFERENCES asset_locations(location_id),
    to_department_id INTEGER,
    to_cost_center_id INTEGER,
    to_employee_id INTEGER,
    
    -- Transfer Details
    reason TEXT NOT NULL,
    transfer_type VARCHAR(50) DEFAULT 'LOCATION', -- LOCATION, DEPARTMENT, EMPLOYEE, FULL
    
    -- Condition Check
    condition_before VARCHAR(20),
    condition_after VARCHAR(20),
    damage_notes TEXT,
    
    -- Approval
    approved_by UUID,
    approved_at TIMESTAMP,
    
    created_by UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_transfer_type CHECK (transfer_type IN ('LOCATION', 'DEPARTMENT', 'EMPLOYEE', 'FULL'))
);

CREATE INDEX IF NOT EXISTS idx_asset_transfers_asset ON asset_transfers(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_transfers_date ON asset_transfers(transfer_date DESC);


-- ============================================================================
-- 5. ASSET MAINTENANCE
-- ============================================================================

-- Maintenance Types
CREATE TABLE IF NOT EXISTS maintenance_types (
    maintenance_type_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    type_code VARCHAR(50) NOT NULL UNIQUE,
    type_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    is_preventive BOOLEAN DEFAULT true,
    default_frequency_days INTEGER,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO maintenance_types (type_code, type_name, is_preventive, default_frequency_days) VALUES
('PM_INSPECTION', 'Preventive Maintenance Inspection', true, 90),
('PM_SERVICE', 'Preventive Service', true, 180),
('REPAIR', 'Repair', false, NULL),
('CALIBRATION', 'Calibration', true, 365),
('CLEANING', 'Deep Cleaning', true, 30)
ON CONFLICT (type_code) DO NOTHING;


-- Asset Maintenance Records
CREATE TABLE IF NOT EXISTS asset_maintenance (
    maintenance_id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL REFERENCES fixed_assets(asset_id),
    
    maintenance_number VARCHAR(50) NOT NULL UNIQUE,
    maintenance_type_id INTEGER REFERENCES maintenance_types(maintenance_type_id),
    
    -- Schedule
    scheduled_date DATE,
    completed_date DATE,
    
    -- Details
    description TEXT NOT NULL,
    work_performed TEXT,
    parts_replaced TEXT,
    
    -- Costs
    labor_cost DECIMAL(12,2) DEFAULT 0,
    parts_cost DECIMAL(12,2) DEFAULT 0,
    other_costs DECIMAL(12,2) DEFAULT 0,
    total_cost DECIMAL(12,2) NOT NULL,
    
    -- Service Provider
    performed_by VARCHAR(200), -- Internal or External
    vendor_id INTEGER,
    vendor_invoice_number VARCHAR(100),
    
    -- Downtime
    downtime_hours DECIMAL(6,2),
    
    -- Status
    status VARCHAR(20) DEFAULT 'SCHEDULED', -- SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
    
    -- Next Maintenance
    next_maintenance_date DATE,
    
    created_by UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_maintenance_status CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'))
);

CREATE INDEX IF NOT EXISTS idx_asset_maintenance_asset ON asset_maintenance(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_maintenance_date ON asset_maintenance(scheduled_date DESC);
CREATE INDEX IF NOT EXISTS idx_asset_maintenance_status ON asset_maintenance(status);


-- ============================================================================
-- 6. ASSET DISPOSALS
-- ============================================================================

-- Asset Disposals
CREATE TABLE IF NOT EXISTS asset_disposals (
    disposal_id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL REFERENCES fixed_assets(asset_id),
    
    disposal_number VARCHAR(50) NOT NULL UNIQUE,
    disposal_date DATE NOT NULL,
    disposal_method VARCHAR(50) NOT NULL, -- SOLD, SCRAPPED, DONATED, TRADE_IN, STOLEN, LOST
    
    -- Financial Details
    net_book_value DECIMAL(15,2) NOT NULL,
    disposal_proceeds DECIMAL(15,2) DEFAULT 0,
    disposal_costs DECIMAL(15,2) DEFAULT 0,
    gain_loss DECIMAL(15,2) NOT NULL, -- Calculated: proceeds - costs - net_book_value
    
    -- Buyer/Recipient Details (if sold/donated)
    buyer_recipient_name VARCHAR(200),
    buyer_contact VARCHAR(200),
    sale_invoice_number VARCHAR(100),
    
    -- Reason & Documentation
    disposal_reason TEXT NOT NULL,
    authorization_document VARCHAR(500),
    
    -- Approval
    approved_by UUID,
    approved_at TIMESTAMP,
    
    -- GL Posting
    journal_entry_id INTEGER,
    posted_to_gl BOOLEAN DEFAULT false,
    
    created_by UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_disposal_method CHECK (disposal_method IN ('SOLD', 'SCRAPPED', 'DONATED', 'TRADE_IN', 'STOLEN', 'LOST', 'WRITTEN_OFF'))
);

CREATE INDEX IF NOT EXISTS idx_asset_disposals_asset ON asset_disposals(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_disposals_date ON asset_disposals(disposal_date DESC);


-- ============================================================================
-- 7. ASSET VALUATION
-- ============================================================================

-- Asset Revaluations
CREATE TABLE IF NOT EXISTS asset_revaluations (
    revaluation_id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL REFERENCES fixed_assets(asset_id),
    
    revaluation_date DATE NOT NULL,
    revaluation_number VARCHAR(50) NOT NULL UNIQUE,
    
    -- Values
    previous_book_value DECIMAL(15,2) NOT NULL,
    new_valuation DECIMAL(15,2) NOT NULL,
    revaluation_surplus_deficit DECIMAL(15,2) NOT NULL,
    
    -- Basis
    valuation_method VARCHAR(100) NOT NULL, -- MARKET_VALUE, REPLACEMENT_COST, APPRAISAL, etc.
    valuer_name VARCHAR(200),
    valuation_report_path VARCHAR(500),
    
    -- Reason
    revaluation_reason TEXT NOT NULL,
    
    -- Approval
    approved_by UUID,
    approved_at TIMESTAMP,
    
    -- GL Impact
    journal_entry_id INTEGER,
    posted_to_gl BOOLEAN DEFAULT false,
    
    created_by UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_asset_revaluations_asset ON asset_revaluations(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_revaluations_date ON asset_revaluations(revaluation_date DESC);


-- ============================================================================
-- 8. ASSET INSPECTIONS
-- ============================================================================

-- Asset Inspections
CREATE TABLE IF NOT EXISTS asset_inspections (
    inspection_id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL REFERENCES fixed_assets(asset_id),
    
    inspection_date DATE NOT NULL,
    inspection_type VARCHAR(50) NOT NULL, -- PHYSICAL_VERIFICATION, CONDITION_CHECK, SAFETY_INSPECTION
    
    -- Inspector
    inspector_employee_id INTEGER,
    inspector_name VARCHAR(200),
    
    -- Findings
    condition_rating VARCHAR(20), -- EXCELLENT, GOOD, FAIR, POOR, DAMAGED
    is_functional BOOLEAN DEFAULT true,
    issues_found TEXT,
    recommendations TEXT,
    
    -- Photos
    inspection_photos JSONB, -- Array of photo URLs
    
    -- Follow-up
    requires_maintenance BOOLEAN DEFAULT false,
    requires_repair BOOLEAN DEFAULT false,
    
    created_by UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_inspection_type CHECK (inspection_type IN ('PHYSICAL_VERIFICATION', 'CONDITION_CHECK', 'SAFETY_INSPECTION', 'AUDIT'))
);

CREATE INDEX IF NOT EXISTS idx_asset_inspections_asset ON asset_inspections(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_inspections_date ON asset_inspections(inspection_date DESC);


-- ============================================================================
-- COMMENTS & DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE fixed_assets IS 'Fixed assets register with depreciation tracking';
COMMENT ON TABLE asset_categories IS 'Asset categories with default depreciation settings';
COMMENT ON TABLE asset_depreciation_schedule IS 'Depreciation calculations by period';
COMMENT ON TABLE asset_transfers IS 'Asset location/department/employee transfers';
COMMENT ON TABLE asset_maintenance IS 'Preventive and corrective maintenance records';
COMMENT ON TABLE asset_disposals IS 'Asset disposal records with gain/loss calculation';
COMMENT ON TABLE asset_revaluations IS 'Asset revaluation records';
COMMENT ON TABLE asset_inspections IS 'Physical verification and condition inspections';

-- ============================================================================
-- END OF ASSET MANAGEMENT MODULE SCHEMA
-- ============================================================================
