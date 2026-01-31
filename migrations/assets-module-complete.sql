-- ============================================================================
-- ASSET MANAGEMENT MODULE - COMPLETE DATABASE SCHEMA
-- Created: November 20, 2025
-- ============================================================================

-- Create assets schema
CREATE SCHEMA IF NOT EXISTS assets;

-- ============================================================================
-- ASSET CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS assets.asset_categories (
    category_id SERIAL PRIMARY KEY,
    category_code VARCHAR(50) UNIQUE NOT NULL,
    category_name VARCHAR(255) NOT NULL,
    description TEXT,
    depreciation_method VARCHAR(50) DEFAULT 'STRAIGHT_LINE',
    useful_life_years INTEGER DEFAULT 5,
    residual_value_percentage NUMERIC(5,2) DEFAULT 10.00,
    gl_asset_account VARCHAR(50),
    gl_depreciation_account VARCHAR(50),
    gl_expense_account VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- FIXED ASSETS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS assets.fixed_assets (
    asset_id SERIAL PRIMARY KEY,
    asset_number VARCHAR(50) UNIQUE NOT NULL,
    asset_name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES assets.asset_categories(category_id),
    serial_number VARCHAR(100),
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    purchase_date DATE NOT NULL,
    purchase_cost NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    useful_life_years INTEGER DEFAULT 5,
    residual_value NUMERIC(15,2) DEFAULT 0.00,
    depreciation_method VARCHAR(50) DEFAULT 'STRAIGHT_LINE',
    asset_status VARCHAR(50) DEFAULT 'ACTIVE',
    location_id INTEGER,
    location_name VARCHAR(255),
    department_id INTEGER,
    cost_center_id INTEGER,
    assigned_to INTEGER,
    warranty_expiry_date DATE,
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    supplier_id INTEGER,
    purchase_order_number VARCHAR(50),
    barcode VARCHAR(100),
    qr_code VARCHAR(100),
    image_url TEXT,
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ASSET DEPRECIATION SCHEDULE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS assets.asset_depreciation_schedule (
    schedule_id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES assets.fixed_assets(asset_id) ON DELETE CASCADE,
    period_year INTEGER NOT NULL,
    period_month INTEGER NOT NULL,
    opening_book_value NUMERIC(15,2) NOT NULL,
    depreciation_amount NUMERIC(15,2) NOT NULL,
    accumulated_depreciation NUMERIC(15,2) NOT NULL,
    closing_book_value NUMERIC(15,2) NOT NULL,
    is_posted BOOLEAN DEFAULT FALSE,
    posted_date TIMESTAMP,
    journal_entry_id INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(asset_id, period_year, period_month)
);

-- ============================================================================
-- ASSET MAINTENANCE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS assets.asset_maintenance (
    maintenance_id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES assets.fixed_assets(asset_id),
    maintenance_type VARCHAR(50) DEFAULT 'ROUTINE',
    maintenance_date DATE NOT NULL,
    next_maintenance_date DATE,
    cost NUMERIC(15,2) DEFAULT 0.00,
    performed_by VARCHAR(255),
    vendor_id INTEGER,
    description TEXT,
    status VARCHAR(20) DEFAULT 'Completed',
    downtime_hours NUMERIC(7,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ASSET TRANSFERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS assets.asset_transfers (
    transfer_id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES assets.fixed_assets(asset_id),
    transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
    from_location_id INTEGER,
    from_location_name VARCHAR(255),
    to_location_id INTEGER,
    to_location_name VARCHAR(255),
    from_department_id INTEGER,
    to_department_id INTEGER,
    from_employee_id INTEGER,
    to_employee_id INTEGER,
    reason TEXT,
    approved_by INTEGER,
    approved_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Pending',
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ASSET DISPOSALS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS assets.asset_disposals (
    disposal_id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES assets.fixed_assets(asset_id),
    disposal_date DATE NOT NULL,
    disposal_method VARCHAR(50),
    disposal_reason TEXT,
    original_cost NUMERIC(15,2) NOT NULL,
    accumulated_depreciation NUMERIC(15,2) NOT NULL,
    book_value NUMERIC(15,2) NOT NULL,
    sale_proceeds NUMERIC(15,2) DEFAULT 0.00,
    gain_loss NUMERIC(15,2) DEFAULT 0.00,
    buyer_name VARCHAR(255),
    buyer_contact TEXT,
    approved_by INTEGER,
    approved_date TIMESTAMP,
    journal_entry_id INTEGER,
    posted_to_gl BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ASSET VALUATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS assets.asset_valuations (
    valuation_id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES assets.fixed_assets(asset_id),
    valuation_date DATE NOT NULL,
    valuation_method VARCHAR(50),
    fair_market_value NUMERIC(15,2) NOT NULL,
    book_value NUMERIC(15,2),
    variance NUMERIC(15,2),
    valuer_name VARCHAR(255),
    valuation_reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SAMPLE DATA - ASSET CATEGORIES
-- ============================================================================
INSERT INTO assets.asset_categories (category_code, category_name, description, depreciation_method, useful_life_years, residual_value_percentage)
VALUES
    ('AC-001', 'Computer Equipment', 'Computers, laptops, servers', 'STRAIGHT_LINE', 3, 10.00),
    ('AC-002', 'Office Furniture', 'Desks, chairs, cabinets', 'STRAIGHT_LINE', 7, 15.00),
    ('AC-003', 'Vehicles', 'Company cars, trucks, vans', 'REDUCING_BALANCE', 5, 20.00),
    ('AC-004', 'Machinery & Equipment', 'Production machinery and tools', 'STRAIGHT_LINE', 10, 10.00),
    ('AC-005', 'Buildings', 'Office buildings and warehouses', 'STRAIGHT_LINE', 40, 5.00)
ON CONFLICT (category_code) DO NOTHING;

-- ============================================================================
-- SAMPLE DATA - FIXED ASSETS
-- ============================================================================
INSERT INTO assets.fixed_assets (asset_number, asset_name, description, category_id, serial_number, manufacturer, purchase_date, purchase_cost, useful_life_years, residual_value, depreciation_method, asset_status, location_name)
VALUES
    ('AST-001', 'Dell PowerEdge Server', 'Main production server', 1, 'SRVR-2023-001', 'Dell', '2023-01-15', 85000.00, 5, 8500.00, 'STRAIGHT_LINE', 'ACTIVE', 'Main Data Center'),
    ('AST-002', 'MacBook Pro 16"', 'Executive laptop', 1, 'MBP-2023-045', 'Apple', '2023-03-20', 45000.00, 3, 4500.00, 'STRAIGHT_LINE', 'ACTIVE', 'Executive Office'),
    ('AST-003', 'Dell Latitude Laptops (x10)', 'Staff laptops bulk purchase', 1, 'LAT-2023-BULK', 'Dell', '2023-06-01', 180000.00, 3, 18000.00, 'STRAIGHT_LINE', 'ACTIVE', 'Various Offices'),
    ('AST-004', 'Toyota Hilux 2.8 GD-6', 'Company delivery truck', 3, 'VIN-ABC123456', 'Toyota', '2022-08-15', 650000.00, 5, 130000.00, 'REDUCING_BALANCE', 'ACTIVE', 'Main Warehouse'),
    ('AST-005', 'Executive Office Desks (x5)', 'Mahogany executive desks', 2, 'DESK-2023-EXC', 'Office Pro', '2023-02-10', 75000.00, 10, 11250.00, 'STRAIGHT_LINE', 'ACTIVE', 'Head Office'),
    ('AST-006', 'CNC Milling Machine', 'Precision milling machine', 4, 'CNC-2021-789', 'Haas Automation', '2021-11-20', 1200000.00, 15, 120000.00, 'STRAIGHT_LINE', 'ACTIVE', 'Production Floor'),
    ('AST-007', 'Forklift - 3 Ton', 'Warehouse forklift', 4, 'FLT-2022-456', 'Linde', '2022-05-10', 280000.00, 8, 28000.00, 'STRAIGHT_LINE', 'ACTIVE', 'Main Warehouse'),
    ('AST-008', 'Conference Room Furniture', 'Complete conference room setup', 2, 'CONF-2023-001', 'Office Solutions', '2023-04-15', 120000.00, 7, 18000.00, 'STRAIGHT_LINE', 'ACTIVE', 'Conference Room A'),
    ('AST-009', 'HP LaserJet Printers (x8)', 'Network printers for offices', 1, 'HP-PRN-2023', 'HP', '2023-07-01', 64000.00, 4, 6400.00, 'STRAIGHT_LINE', 'ACTIVE', 'Various Locations'),
    ('AST-010', 'Security Camera System', 'Complete CCTV security system', 1, 'CCTV-2023-SYS', 'Hikvision', '2023-09-01', 95000.00, 7, 9500.00, 'STRAIGHT_LINE', 'ACTIVE', 'Entire Premises')
ON CONFLICT (asset_number) DO NOTHING;

-- ============================================================================
-- SAMPLE DATA - DEPRECIATION SCHEDULE
-- ============================================================================
INSERT INTO assets.asset_depreciation_schedule (asset_id, period_year, period_month, opening_book_value, depreciation_amount, accumulated_depreciation, closing_book_value, is_posted)
VALUES
    (1, 2023, 1, 85000.00, 1275.00, 1275.00, 83725.00, TRUE),
    (1, 2023, 2, 83725.00, 1275.00, 2550.00, 82450.00, TRUE),
    (1, 2023, 3, 82450.00, 1275.00, 3825.00, 81175.00, TRUE),
    (2, 2023, 3, 45000.00, 1125.00, 1125.00, 43875.00, TRUE),
    (2, 2023, 4, 43875.00, 1125.00, 2250.00, 42750.00, TRUE),
    (3, 2023, 6, 180000.00, 4500.00, 4500.00, 175500.00, TRUE),
    (4, 2022, 8, 650000.00, 10833.33, 10833.33, 639166.67, TRUE),
    (5, 2023, 2, 75000.00, 531.25, 531.25, 74468.75, TRUE)
ON CONFLICT (asset_id, period_year, period_month) DO NOTHING;

-- ============================================================================
-- SAMPLE DATA - ASSET MAINTENANCE
-- ============================================================================
INSERT INTO assets.asset_maintenance (asset_id, maintenance_type, maintenance_date, next_maintenance_date, cost, performed_by, description, status)
VALUES
    (1, 'ROUTINE', '2024-01-15', '2024-07-15', 2500.00, 'TechSupport Co', 'Server health check and updates', 'Completed'),
    (4, 'SERVICE', '2024-02-10', '2024-08-10', 4500.00, 'Toyota Service Center', '30,000 km service', 'Completed'),
    (6, 'ROUTINE', '2024-03-05', '2024-09-05', 8500.00, 'CNC Specialists', 'Calibration and maintenance', 'Completed'),
    (7, 'REPAIR', '2024-04-20', NULL, 12000.00, 'Linde Service', 'Hydraulic system repair', 'Completed'),
    (1, 'ROUTINE', '2024-07-15', '2025-01-15', 2500.00, 'TechSupport Co', 'Scheduled server maintenance', 'Scheduled')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SAMPLE DATA - ASSET TRANSFERS
-- ============================================================================
INSERT INTO assets.asset_transfers (asset_id, transfer_date, from_location_name, to_location_name, reason, status)
VALUES
    (2, '2024-05-10', 'IT Department', 'Executive Office', 'Assigned to new CFO', 'Completed'),
    (9, '2024-06-15', 'Main Office', 'Cape Town Branch', 'Branch expansion', 'Completed'),
    (3, '2024-08-01', 'IT Department', 'Sales Department', 'Staff laptop reassignment', 'Pending')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SAMPLE DATA - ASSET DISPOSALS
-- ============================================================================
INSERT INTO assets.asset_disposals (asset_id, disposal_date, disposal_method, disposal_reason, original_cost, accumulated_depreciation, book_value, sale_proceeds, gain_loss)
VALUES
    (1, '2024-10-01', 'SALE', 'Upgrading to newer model', 85000.00, 25500.00, 59500.00, 45000.00, -14500.00)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_assets_number ON assets.fixed_assets(asset_number);
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets.fixed_assets(category_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets.fixed_assets(asset_status);
CREATE INDEX IF NOT EXISTS idx_depreciation_asset ON assets.asset_depreciation_schedule(asset_id);
CREATE INDEX IF NOT EXISTS idx_depreciation_period ON assets.asset_depreciation_schedule(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_maintenance_asset ON assets.asset_maintenance(asset_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_date ON assets.asset_maintenance(maintenance_date);
CREATE INDEX IF NOT EXISTS idx_transfers_asset ON assets.asset_transfers(asset_id);
CREATE INDEX IF NOT EXISTS idx_disposals_asset ON assets.asset_disposals(asset_id);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT 'Asset Management module database schema created successfully!' AS status;
SELECT COUNT(*) AS category_count FROM assets.asset_categories;
SELECT COUNT(*) AS asset_count FROM assets.fixed_assets;
SELECT COUNT(*) AS depreciation_schedule_count FROM assets.asset_depreciation_schedule;
SELECT COUNT(*) AS maintenance_count FROM assets.asset_maintenance;
