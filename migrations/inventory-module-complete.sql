-- ============================================================================
-- INVENTORY MODULE - COMPLETE DATABASE SCHEMA
-- Created: November 20, 2025
-- ============================================================================

-- Create inventory schema
CREATE SCHEMA IF NOT EXISTS inventory;

-- ============================================================================
-- ITEM CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory.item_categories (
    category_id SERIAL PRIMARY KEY,
    category_code VARCHAR(50) UNIQUE NOT NULL,
    category_name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_category_id INTEGER REFERENCES inventory.item_categories(category_id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- WAREHOUSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory.warehouses (
    warehouse_id SERIAL PRIMARY KEY,
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

-- ============================================================================
-- ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory.items (
    item_id SERIAL PRIMARY KEY,
    item_code VARCHAR(100) UNIQUE NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
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

-- ============================================================================
-- STOCK LEVELS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory.stock_levels (
    stock_level_id SERIAL PRIMARY KEY,
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

-- ============================================================================
-- STOCK MOVEMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory.stock_movements (
    movement_id SERIAL PRIMARY KEY,
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

-- ============================================================================
-- STOCK ADJUSTMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory.stock_adjustments (
    adjustment_id SERIAL PRIMARY KEY,
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

-- ============================================================================
-- STOCK ADJUSTMENT LINES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory.stock_adjustment_lines (
    line_id SERIAL PRIMARY KEY,
    adjustment_id INTEGER REFERENCES inventory.stock_adjustments(adjustment_id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    item_id INTEGER REFERENCES inventory.items(item_id),
    quantity_system NUMERIC(15,3) NOT NULL,
    quantity_counted NUMERIC(15,3) NOT NULL,
    quantity_difference NUMERIC(15,3),
    unit_cost NUMERIC(15,2),
    adjustment_value NUMERIC(15,2),
    batch_number VARCHAR(100),
    serial_number VARCHAR(100),
    bin_location VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- STOCK BATCHES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory.stock_batches (
    batch_id SERIAL PRIMARY KEY,
    batch_number VARCHAR(100) UNIQUE NOT NULL,
    item_id INTEGER REFERENCES inventory.items(item_id),
    warehouse_id INTEGER REFERENCES inventory.warehouses(warehouse_id),
    quantity NUMERIC(15,3) NOT NULL,
    manufacture_date DATE,
    expiry_date DATE,
    received_date DATE DEFAULT CURRENT_DATE,
    supplier_id INTEGER,
    purchase_order_id INTEGER,
    cost NUMERIC(15,2),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- STOCK SERIAL NUMBERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory.stock_serial_numbers (
    serial_id SERIAL PRIMARY KEY,
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    item_id INTEGER REFERENCES inventory.items(item_id),
    warehouse_id INTEGER REFERENCES inventory.warehouses(warehouse_id),
    batch_id INTEGER REFERENCES inventory.stock_batches(batch_id),
    status VARCHAR(20) DEFAULT 'in_stock',
    purchase_date DATE,
    warranty_expiry DATE,
    assigned_to INTEGER,
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CREATE VIEWS FOR REPORTING
-- ============================================================================

-- View: Stock Movement History
CREATE OR REPLACE VIEW inventory.v_stock_movement_history AS
SELECT 
    sm.movement_id,
    sm.movement_number,
    sm.movement_date,
    sm.movement_type,
    i.item_code,
    i.item_name,
    fw.warehouse_name as from_warehouse,
    tw.warehouse_name as to_warehouse,
    sm.quantity,
    sm.unit_cost,
    sm.total_cost,
    sm.reference_number,
    sm.status,
    sm.posted,
    sm.created_at
FROM inventory.stock_movements sm
LEFT JOIN inventory.items i ON sm.item_id = i.item_id
LEFT JOIN inventory.warehouses fw ON sm.from_warehouse_id = fw.warehouse_id
LEFT JOIN inventory.warehouses tw ON sm.to_warehouse_id = tw.warehouse_id;

-- View: Reorder Required
CREATE OR REPLACE VIEW inventory.v_reorder_required AS
SELECT 
    i.item_id,
    i.item_code,
    i.item_name,
    ic.category_name,
    w.warehouse_id,
    w.warehouse_name,
    sl.quantity_on_hand,
    sl.quantity_reserved,
    sl.quantity_available,
    sl.quantity_on_order,
    i.reorder_level,
    i.reorder_quantity,
    i.minimum_stock,
    (i.reorder_quantity - sl.quantity_available) as suggested_order_quantity
FROM inventory.stock_levels sl
INNER JOIN inventory.items i ON sl.item_id = i.item_id
INNER JOIN inventory.warehouses w ON sl.warehouse_id = w.warehouse_id
LEFT JOIN inventory.item_categories ic ON i.category_id = ic.category_id
WHERE sl.quantity_available <= i.reorder_level
AND i.is_active = TRUE
AND w.is_active = TRUE;

-- ============================================================================
-- SAMPLE DATA - ITEM CATEGORIES
-- ============================================================================
INSERT INTO inventory.item_categories (category_code, category_name, description, is_active)
VALUES
    ('CAT-001', 'Raw Materials', 'Raw materials for production', TRUE),
    ('CAT-002', 'Finished Goods', 'Completed products ready for sale', TRUE),
    ('CAT-003', 'Office Supplies', 'Office consumables and supplies', TRUE),
    ('CAT-004', 'Electronics', 'Electronic components and devices', TRUE),
    ('CAT-005', 'Machinery Parts', 'Spare parts for machinery', TRUE)
ON CONFLICT (category_code) DO NOTHING;

-- ============================================================================
-- SAMPLE DATA - WAREHOUSES
-- ============================================================================
INSERT INTO inventory.warehouses (warehouse_code, warehouse_name, location, address, manager_name, phone, is_active)
VALUES
    ('WH-001', 'Main Warehouse', 'Johannesburg', '123 Industrial Road, Johannesburg, 2000', 'John Manager', '+27 11 555 1234', TRUE),
    ('WH-002', 'Cape Town Warehouse', 'Cape Town', '45 Harbour Street, Cape Town, 8001', 'Sarah Supervisor', '+27 21 555 5678', TRUE),
    ('WH-003', 'Durban Distribution Center', 'Durban', '78 Port Avenue, Durban, 4001', 'Mike Logistics', '+27 31 555 9012', TRUE)
ON CONFLICT (warehouse_code) DO NOTHING;

-- ============================================================================
-- SAMPLE DATA - ITEMS
-- ============================================================================
INSERT INTO inventory.items (item_code, item_name, description, category_id, unit_of_measure, reorder_level, reorder_quantity, minimum_stock, standard_cost, selling_price, is_active)
VALUES
    ('ITEM-001', 'Steel Sheets 2mm', 'Cold rolled steel sheets 2mm thickness', 1, 'SHEET', 50, 100, 30, 250.00, 350.00, TRUE),
    ('ITEM-002', 'Aluminum Rods 10mm', 'Aluminum rods 10mm diameter', 1, 'METER', 200, 500, 100, 45.00, 65.00, TRUE),
    ('ITEM-003', 'Widget Type A', 'Standard widget type A', 2, 'EA', 100, 200, 50, 125.00, 199.00, TRUE),
    ('ITEM-004', 'Widget Type B', 'Premium widget type B', 2, 'EA', 50, 100, 25, 250.00, 399.00, TRUE),
    ('ITEM-005', 'Office Paper A4', 'A4 copy paper 80gsm', 3, 'REAM', 20, 50, 10, 35.00, 55.00, TRUE),
    ('ITEM-006', 'Ballpoint Pens', 'Blue ballpoint pens', 3, 'BOX', 30, 100, 15, 15.00, 25.00, TRUE),
    ('ITEM-007', 'Laptop Dell XPS 15', 'Dell XPS 15 laptop', 4, 'EA', 5, 10, 3, 15000.00, 22000.00, TRUE),
    ('ITEM-008', 'Monitor 27 inch', '27 inch 4K monitor', 4, 'EA', 10, 20, 5, 4500.00, 6500.00, TRUE),
    ('ITEM-009', 'Motor Bearing 25mm', '25mm ball bearing for motors', 5, 'EA', 40, 100, 20, 85.00, 135.00, TRUE),
    ('ITEM-010', 'Hydraulic Seal Kit', 'Complete hydraulic seal kit', 5, 'KIT', 15, 30, 10, 450.00, 650.00, TRUE)
ON CONFLICT (item_code) DO NOTHING;

-- ============================================================================
-- SAMPLE DATA - STOCK LEVELS
-- ============================================================================
INSERT INTO inventory.stock_levels (item_id, warehouse_id, quantity_on_hand, quantity_reserved, quantity_available, quantity_on_order, average_cost, total_value)
VALUES
    -- Main Warehouse (WH-001)
    (1, 1, 150.000, 20.000, 130.000, 100.000, 250.00, 37500.00),
    (2, 1, 500.000, 50.000, 450.000, 500.000, 45.00, 22500.00),
    (3, 1, 200.000, 30.000, 170.000, 200.000, 125.00, 25000.00),
    (4, 1, 75.000, 10.000, 65.000, 100.000, 250.00, 18750.00),
    (5, 1, 50.000, 5.000, 45.000, 50.000, 35.00, 1750.00),
    
    -- Cape Town Warehouse (WH-002)
    (3, 2, 150.000, 20.000, 130.000, 0.000, 125.00, 18750.00),
    (4, 2, 60.000, 5.000, 55.000, 0.000, 250.00, 15000.00),
    (7, 2, 8.000, 2.000, 6.000, 10.000, 15000.00, 120000.00),
    (8, 2, 15.000, 3.000, 12.000, 20.000, 4500.00, 67500.00),
    
    -- Durban Distribution Center (WH-003)
    (5, 3, 30.000, 5.000, 25.000, 50.000, 35.00, 1050.00),
    (6, 3, 80.000, 10.000, 70.000, 100.000, 15.00, 1200.00),
    (9, 3, 60.000, 10.000, 50.000, 100.000, 85.00, 5100.00),
    (10, 3, 25.000, 5.000, 20.000, 30.000, 450.00, 11250.00)
ON CONFLICT (item_id, warehouse_id) DO NOTHING;

-- ============================================================================
-- SAMPLE DATA - STOCK MOVEMENTS
-- ============================================================================
INSERT INTO inventory.stock_movements (movement_number, movement_date, movement_type, item_id, from_warehouse_id, to_warehouse_id, quantity, unit_cost, total_cost, reference_number, status, posted)
VALUES
    ('MOV-2024-001', '2024-11-15', 'TRANSFER', 3, 1, 2, 50.000, 125.00, 6250.00, 'TRF-001', 'Posted', TRUE),
    ('MOV-2024-002', '2024-11-16', 'TRANSFER', 4, 1, 2, 25.000, 250.00, 6250.00, 'TRF-002', 'Posted', TRUE),
    ('MOV-2024-003', '2024-11-17', 'RECEIPT', 7, NULL, 2, 5.000, 15000.00, 75000.00, 'GR-2024-001', 'Posted', TRUE),
    ('MOV-2024-004', '2024-11-18', 'ISSUE', 5, 1, NULL, 10.000, 35.00, 350.00, 'SO-2024-015', 'Posted', TRUE),
    ('MOV-2024-005', '2024-11-19', 'TRANSFER', 9, 1, 3, 30.000, 85.00, 2550.00, 'TRF-003', 'Draft', FALSE)
ON CONFLICT (movement_number) DO NOTHING;

-- ============================================================================
-- SAMPLE DATA - STOCK ADJUSTMENTS
-- ============================================================================
INSERT INTO inventory.stock_adjustments (adjustment_number, adjustment_date, warehouse_id, adjustment_type, reason, status, posted, total_adjustment_value)
VALUES
    ('ADJ-2024-001', '2024-11-10', 1, 'COUNT', 'Monthly stock count - Main Warehouse', 'Posted', TRUE, -1250.00),
    ('ADJ-2024-002', '2024-11-12', 2, 'DAMAGE', 'Damaged goods write-off', 'Posted', TRUE, -3750.00),
    ('ADJ-2024-003', '2024-11-20', 3, 'COUNT', 'Quarterly stock count - Durban', 'Draft', FALSE, 0.00)
ON CONFLICT (adjustment_number) DO NOTHING;

-- ============================================================================
-- SAMPLE DATA - STOCK ADJUSTMENT LINES
-- ============================================================================
INSERT INTO inventory.stock_adjustment_lines (adjustment_id, line_number, item_id, quantity_system, quantity_counted, quantity_difference, unit_cost, adjustment_value)
VALUES
    (1, 1, 1, 155.000, 150.000, -5.000, 250.00, -1250.00),
    (1, 2, 2, 500.000, 500.000, 0.000, 45.00, 0.00),
    (2, 1, 4, 80.000, 75.000, -5.000, 250.00, -1250.00),
    (2, 2, 3, 210.000, 200.000, -10.000, 125.00, -1250.00),
    (2, 3, 8, 18.000, 15.000, -3.000, 4500.00, -13500.00)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_items_code ON inventory.items(item_code);
CREATE INDEX IF NOT EXISTS idx_items_category ON inventory.items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_active ON inventory.items(is_active);
CREATE INDEX IF NOT EXISTS idx_stock_levels_item ON inventory.stock_levels(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_levels_warehouse ON inventory.stock_levels(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON inventory.stock_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON inventory.stock_movements(movement_date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_status ON inventory.stock_movements(status);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_warehouse ON inventory.stock_adjustments(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_status ON inventory.stock_adjustments(status);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT 'Inventory module database schema created successfully!' AS status;
SELECT COUNT(*) AS category_count FROM inventory.item_categories;
SELECT COUNT(*) AS warehouse_count FROM inventory.warehouses;
SELECT COUNT(*) AS item_count FROM inventory.items;
SELECT COUNT(*) AS stock_level_count FROM inventory.stock_levels;
SELECT COUNT(*) AS movement_count FROM inventory.stock_movements;
SELECT COUNT(*) AS adjustment_count FROM inventory.stock_adjustments;
