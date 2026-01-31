/**
 * INVENTORY MANAGEMENT MODULE - DATABASE MIGRATION
 * 
 * Complete inventory management system with:
 * - Item master data (products, SKUs, categories)
 * - Stock levels by location/warehouse
 * - Stock movements (receipts, issues, transfers, adjustments)
 * - Reorder points & low stock alerts
 * - Inventory valuation (FIFO/LIFO/Weighted Average)
 * - Integration with Purchase GRNs and Sales Orders
 * - GL posting for inventory transactions
 */

import { Pool } from 'pg';

export async function runInventoryMigration(pool: Pool): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // ============================================================================
    // TABLE 1: ITEM CATEGORIES
    // ============================================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS item_categories (
        category_id SERIAL PRIMARY KEY,
        category_code VARCHAR(20) UNIQUE NOT NULL,
        category_name VARCHAR(100) NOT NULL,
        parent_category_id INTEGER REFERENCES item_categories(category_id),
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        updated_by INTEGER
      )
    `);

    // ============================================================================
    // TABLE 2: UNITS OF MEASURE
    // ============================================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS units_of_measure (
        uom_id SERIAL PRIMARY KEY,
        uom_code VARCHAR(10) UNIQUE NOT NULL,
        uom_name VARCHAR(50) NOT NULL,
        uom_type VARCHAR(20) CHECK (uom_type IN ('Quantity', 'Weight', 'Volume', 'Length', 'Area', 'Time')),
        base_uom_id INTEGER REFERENCES units_of_measure(uom_id),
        conversion_factor DECIMAL(15,6) DEFAULT 1.0,
        is_base_unit BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ============================================================================
    // TABLE 3: WAREHOUSES/LOCATIONS
    // ============================================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS warehouses (
        warehouse_id SERIAL PRIMARY KEY,
        warehouse_code VARCHAR(20) UNIQUE NOT NULL,
        warehouse_name VARCHAR(100) NOT NULL,
        warehouse_type VARCHAR(30) CHECK (warehouse_type IN ('Main', 'Distribution', 'Transit', 'Retail', 'Manufacturing', 'Quarantine')),
        address_line1 VARCHAR(200),
        address_line2 VARCHAR(200),
        city VARCHAR(100),
        state_province VARCHAR(100),
        postal_code VARCHAR(20),
        country VARCHAR(100),
        phone VARCHAR(20),
        email VARCHAR(100),
        manager_name VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        updated_by INTEGER
      )
    `);

    // ============================================================================
    // TABLE 4: ITEMS (Master Data)
    // ============================================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS items (
        item_id SERIAL PRIMARY KEY,
        item_code VARCHAR(50) UNIQUE NOT NULL,
        item_name VARCHAR(200) NOT NULL,
        description TEXT,
        category_id INTEGER REFERENCES item_categories(category_id),
        item_type VARCHAR(30) CHECK (item_type IN ('Finished Goods', 'Raw Material', 'Semi-Finished', 'Service', 'Consumable', 'Asset')),
        base_uom_id INTEGER REFERENCES units_of_measure(uom_id),
        
        -- Valuation
        valuation_method VARCHAR(20) CHECK (valuation_method IN ('FIFO', 'LIFO', 'Weighted Average', 'Standard Cost')) DEFAULT 'Weighted Average',
        standard_cost DECIMAL(15,2) DEFAULT 0,
        average_cost DECIMAL(15,2) DEFAULT 0,
        last_purchase_price DECIMAL(15,2) DEFAULT 0,
        
        -- Inventory Control
        reorder_level DECIMAL(15,2) DEFAULT 0,
        reorder_quantity DECIMAL(15,2) DEFAULT 0,
        minimum_stock_level DECIMAL(15,2) DEFAULT 0,
        maximum_stock_level DECIMAL(15,2) DEFAULT 0,
        lead_time_days INTEGER DEFAULT 0,
        
        -- GL Accounts
        inventory_account_id INTEGER,  -- Asset account (1400 - Inventory)
        cogs_account_id INTEGER,       -- COGS account (5100 - Cost of Goods Sold)
        sales_account_id INTEGER,      -- Revenue account (4100 - Sales Revenue)
        purchase_account_id INTEGER,   -- Purchase account for non-inventory items
        
        -- Product Details
        barcode VARCHAR(50),
        sku VARCHAR(50),
        manufacturer_part_no VARCHAR(50),
        brand VARCHAR(100),
        model_number VARCHAR(100),
        
        -- Physical Attributes
        weight DECIMAL(15,3),
        weight_uom_id INTEGER REFERENCES units_of_measure(uom_id),
        length DECIMAL(15,3),
        width DECIMAL(15,3),
        height DECIMAL(15,3),
        dimension_uom_id INTEGER REFERENCES units_of_measure(uom_id),
        
        -- Quality Control
        requires_inspection BOOLEAN DEFAULT false,
        shelf_life_days INTEGER,
        batch_tracked BOOLEAN DEFAULT false,
        serial_tracked BOOLEAN DEFAULT false,
        
        -- Status
        is_active BOOLEAN DEFAULT true,
        is_purchasable BOOLEAN DEFAULT true,
        is_saleable BOOLEAN DEFAULT true,
        is_manufactured BOOLEAN DEFAULT false,
        
        -- Metadata
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        updated_by INTEGER
      )
    `);

    // ============================================================================
    // TABLE 5: STOCK LEVELS (Current inventory by warehouse)
    // ============================================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_levels (
        stock_level_id SERIAL PRIMARY KEY,
        item_id INTEGER REFERENCES items(item_id) NOT NULL,
        warehouse_id INTEGER REFERENCES warehouses(warehouse_id) NOT NULL,
        
        -- Quantities
        on_hand_quantity DECIMAL(15,2) DEFAULT 0,
        allocated_quantity DECIMAL(15,2) DEFAULT 0,  -- Reserved for sales orders
        available_quantity DECIMAL(15,2) DEFAULT 0,  -- on_hand - allocated
        on_order_quantity DECIMAL(15,2) DEFAULT 0,   -- Incoming from POs
        
        -- Valuation
        total_value DECIMAL(15,2) DEFAULT 0,
        average_cost DECIMAL(15,2) DEFAULT 0,
        
        -- Last Activity
        last_receipt_date TIMESTAMP,
        last_issue_date TIMESTAMP,
        last_count_date TIMESTAMP,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(item_id, warehouse_id)
      )
    `);

    // ============================================================================
    // TABLE 6: STOCK MOVEMENTS (All inventory transactions)
    // ============================================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        movement_id SERIAL PRIMARY KEY,
        movement_number VARCHAR(30) UNIQUE NOT NULL,
        movement_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        movement_type VARCHAR(30) CHECK (movement_type IN (
          'Receipt', 'Issue', 'Transfer', 'Adjustment', 
          'Return to Vendor', 'Return from Customer',
          'Production Receipt', 'Production Consumption',
          'Scrap', 'Revaluation', 'Opening Balance'
        )) NOT NULL,
        
        item_id INTEGER REFERENCES items(item_id) NOT NULL,
        warehouse_id INTEGER REFERENCES warehouses(warehouse_id) NOT NULL,
        
        -- Quantity & Value
        quantity DECIMAL(15,2) NOT NULL,  -- Positive for receipts, negative for issues
        uom_id INTEGER REFERENCES units_of_measure(uom_id),
        unit_cost DECIMAL(15,2) DEFAULT 0,
        total_value DECIMAL(15,2) DEFAULT 0,
        
        -- Transfer specific
        from_warehouse_id INTEGER REFERENCES warehouses(warehouse_id),
        to_warehouse_id INTEGER REFERENCES warehouses(warehouse_id),
        
        -- Reference Documents
        reference_type VARCHAR(30),  -- 'PO', 'GRN', 'Sales Order', 'Production Order', etc.
        reference_id INTEGER,
        reference_number VARCHAR(50),
        
        -- Batch/Serial
        batch_number VARCHAR(50),
        serial_number VARCHAR(50),
        expiry_date DATE,
        
        -- GL Posting
        journal_entry_id INTEGER,
        posting_date DATE,
        
        -- Details
        reason TEXT,
        notes TEXT,
        
        -- Approval
        status VARCHAR(20) CHECK (status IN ('Draft', 'Pending', 'Approved', 'Posted', 'Cancelled')) DEFAULT 'Draft',
        approved_by INTEGER,
        approved_at TIMESTAMP,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        updated_by INTEGER
      )
    `);

    // ============================================================================
    // TABLE 7: STOCK TRANSFER ORDERS
    // ============================================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_transfers (
        transfer_id SERIAL PRIMARY KEY,
        transfer_number VARCHAR(30) UNIQUE NOT NULL,
        transfer_date DATE NOT NULL,
        from_warehouse_id INTEGER REFERENCES warehouses(warehouse_id) NOT NULL,
        to_warehouse_id INTEGER REFERENCES warehouses(warehouse_id) NOT NULL,
        
        transfer_type VARCHAR(30) CHECK (transfer_type IN ('Standard', 'Inter-Branch', 'In-Transit', 'Return')) DEFAULT 'Standard',
        
        status VARCHAR(20) CHECK (status IN ('Draft', 'Pending', 'In Transit', 'Received', 'Cancelled')) DEFAULT 'Draft',
        
        expected_delivery_date DATE,
        actual_delivery_date DATE,
        
        shipping_method VARCHAR(50),
        tracking_number VARCHAR(100),
        carrier VARCHAR(100),
        
        notes TEXT,
        
        requested_by INTEGER,
        approved_by INTEGER,
        approved_at TIMESTAMP,
        shipped_by INTEGER,
        shipped_at TIMESTAMP,
        received_by INTEGER,
        received_at TIMESTAMP,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        updated_by INTEGER
      )
    `);

    // ============================================================================
    // TABLE 8: STOCK TRANSFER LINES
    // ============================================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_transfer_lines (
        transfer_line_id SERIAL PRIMARY KEY,
        transfer_id INTEGER REFERENCES stock_transfers(transfer_id) ON DELETE CASCADE,
        line_number INTEGER NOT NULL,
        
        item_id INTEGER REFERENCES items(item_id) NOT NULL,
        
        requested_quantity DECIMAL(15,2) NOT NULL,
        shipped_quantity DECIMAL(15,2) DEFAULT 0,
        received_quantity DECIMAL(15,2) DEFAULT 0,
        
        uom_id INTEGER REFERENCES units_of_measure(uom_id),
        
        batch_number VARCHAR(50),
        serial_number VARCHAR(50),
        
        unit_cost DECIMAL(15,2) DEFAULT 0,
        total_value DECIMAL(15,2) DEFAULT 0,
        
        notes TEXT,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(transfer_id, line_number)
      )
    `);

    // ============================================================================
    // TABLE 9: STOCK ADJUSTMENTS
    // ============================================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_adjustments (
        adjustment_id SERIAL PRIMARY KEY,
        adjustment_number VARCHAR(30) UNIQUE NOT NULL,
        adjustment_date DATE NOT NULL,
        adjustment_type VARCHAR(30) CHECK (adjustment_type IN (
          'Physical Count', 'Damage', 'Loss', 'Found', 'Obsolete', 
          'Expiry', 'Quality Rejection', 'Revaluation', 'Other'
        )) NOT NULL,
        
        warehouse_id INTEGER REFERENCES warehouses(warehouse_id) NOT NULL,
        
        reason TEXT NOT NULL,
        status VARCHAR(20) CHECK (status IN ('Draft', 'Pending', 'Approved', 'Posted', 'Cancelled')) DEFAULT 'Draft',
        
        total_adjustment_value DECIMAL(15,2) DEFAULT 0,
        
        count_date DATE,
        counted_by INTEGER,
        
        approved_by INTEGER,
        approved_at TIMESTAMP,
        
        journal_entry_id INTEGER,
        posting_date DATE,
        
        notes TEXT,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        updated_by INTEGER
      )
    `);

    // ============================================================================
    // TABLE 10: STOCK ADJUSTMENT LINES
    // ============================================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_adjustment_lines (
        adjustment_line_id SERIAL PRIMARY KEY,
        adjustment_id INTEGER REFERENCES stock_adjustments(adjustment_id) ON DELETE CASCADE,
        line_number INTEGER NOT NULL,
        
        item_id INTEGER REFERENCES items(item_id) NOT NULL,
        
        system_quantity DECIMAL(15,2) DEFAULT 0,
        counted_quantity DECIMAL(15,2) NOT NULL,
        adjustment_quantity DECIMAL(15,2) NOT NULL,  -- counted - system
        
        uom_id INTEGER REFERENCES units_of_measure(uom_id),
        
        unit_cost DECIMAL(15,2) DEFAULT 0,
        adjustment_value DECIMAL(15,2) DEFAULT 0,
        
        batch_number VARCHAR(50),
        serial_number VARCHAR(50),
        
        reason TEXT,
        notes TEXT,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(adjustment_id, line_number)
      )
    `);

    // ============================================================================
    // TABLE 11: INVENTORY VALUATION HISTORY (FIFO/LIFO tracking)
    // ============================================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory_valuation_layers (
        layer_id SERIAL PRIMARY KEY,
        item_id INTEGER REFERENCES items(item_id) NOT NULL,
        warehouse_id INTEGER REFERENCES warehouses(warehouse_id) NOT NULL,
        
        receipt_date TIMESTAMP NOT NULL,
        receipt_reference VARCHAR(50),
        
        quantity_received DECIMAL(15,2) NOT NULL,
        quantity_remaining DECIMAL(15,2) NOT NULL,
        unit_cost DECIMAL(15,2) NOT NULL,
        
        movement_id INTEGER REFERENCES stock_movements(movement_id),
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ============================================================================
    // TABLE 12: REORDER SUGGESTIONS
    // ============================================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS reorder_suggestions (
        suggestion_id SERIAL PRIMARY KEY,
        item_id INTEGER REFERENCES items(item_id) NOT NULL,
        warehouse_id INTEGER REFERENCES warehouses(warehouse_id) NOT NULL,
        
        current_stock DECIMAL(15,2) NOT NULL,
        reorder_level DECIMAL(15,2) NOT NULL,
        suggested_quantity DECIMAL(15,2) NOT NULL,
        
        priority VARCHAR(20) CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')) DEFAULT 'Medium',
        
        status VARCHAR(20) CHECK (status IN ('Pending', 'Ordered', 'Ignored', 'Cancelled')) DEFAULT 'Pending',
        
        purchase_order_id INTEGER,  -- Link to created PO
        
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        actioned_at TIMESTAMP,
        actioned_by INTEGER,
        
        notes TEXT
      )
    `);

    // ============================================================================
    // INDEXES FOR PERFORMANCE
    // ============================================================================
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_items_category ON items(category_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_items_type ON items(item_type);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_items_active ON items(is_active);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_items_code ON items(item_code);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_items_barcode ON items(barcode);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_stock_levels_item ON stock_levels(item_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_stock_levels_warehouse ON stock_levels(warehouse_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON stock_movements(item_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_stock_movements_warehouse ON stock_movements(warehouse_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(movement_date);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_stock_movements_reference ON stock_movements(reference_type, reference_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_stock_transfers_from_warehouse ON stock_transfers(from_warehouse_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_stock_transfers_to_warehouse ON stock_transfers(to_warehouse_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_stock_transfers_status ON stock_transfers(status);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_valuation_layers_item_warehouse ON inventory_valuation_layers(item_id, warehouse_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_reorder_suggestions_status ON reorder_suggestions(status);
    `);

    // ============================================================================
    // VIEWS FOR REPORTING
    // ============================================================================

    // View 1: Current Stock Summary
    await client.query(`
      CREATE OR REPLACE VIEW v_stock_summary AS
      SELECT 
        sl.stock_level_id,
        i.item_id,
        i.item_code,
        i.item_name,
        ic.category_name,
        w.warehouse_id,
        w.warehouse_code,
        w.warehouse_name,
        sl.on_hand_quantity,
        sl.allocated_quantity,
        sl.available_quantity,
        sl.on_order_quantity,
        u.uom_code,
        sl.average_cost,
        sl.total_value,
        i.reorder_level,
        i.reorder_quantity,
        i.minimum_stock_level,
        i.maximum_stock_level,
        CASE 
          WHEN sl.available_quantity <= i.reorder_level THEN 'Reorder Required'
          WHEN sl.available_quantity <= i.minimum_stock_level THEN 'Below Minimum'
          WHEN sl.available_quantity >= i.maximum_stock_level THEN 'Overstock'
          ELSE 'Normal'
        END as stock_status,
        sl.last_receipt_date,
        sl.last_issue_date,
        sl.last_count_date
      FROM stock_levels sl
      JOIN items i ON sl.item_id = i.item_id
      LEFT JOIN item_categories ic ON i.category_id = ic.category_id
      JOIN warehouses w ON sl.warehouse_id = w.warehouse_id
      LEFT JOIN units_of_measure u ON i.base_uom_id = u.uom_id
      WHERE i.is_active = true
    `);

    // View 2: Stock Movement History
    await client.query(`
      CREATE OR REPLACE VIEW v_stock_movement_history AS
      SELECT 
        sm.movement_id,
        sm.movement_number,
        sm.movement_date,
        sm.movement_type,
        i.item_code,
        i.item_name,
        w.warehouse_code,
        w.warehouse_name,
        sm.quantity,
        u.uom_code,
        sm.unit_cost,
        sm.total_value,
        sm.reference_type,
        sm.reference_number,
        sm.batch_number,
        sm.serial_number,
        sm.status,
        sm.notes,
        sm.created_at
      FROM stock_movements sm
      JOIN items i ON sm.item_id = i.item_id
      JOIN warehouses w ON sm.warehouse_id = w.warehouse_id
      LEFT JOIN units_of_measure u ON sm.uom_id = u.uom_id
      ORDER BY sm.movement_date DESC, sm.movement_id DESC
    `);

    // View 3: Items Requiring Reorder
    await client.query(`
      CREATE OR REPLACE VIEW v_reorder_required AS
      SELECT 
        i.item_id,
        i.item_code,
        i.item_name,
        ic.category_name,
        w.warehouse_id,
        w.warehouse_code,
        sl.available_quantity,
        i.reorder_level,
        i.reorder_quantity,
        i.minimum_stock_level,
        (i.reorder_level - sl.available_quantity) as shortage_quantity,
        i.lead_time_days,
        sl.on_order_quantity,
        i.last_purchase_price,
        CASE 
          WHEN sl.available_quantity <= 0 THEN 'Critical'
          WHEN sl.available_quantity <= i.minimum_stock_level THEN 'High'
          WHEN sl.available_quantity <= i.reorder_level THEN 'Medium'
          ELSE 'Low'
        END as priority
      FROM stock_levels sl
      JOIN items i ON sl.item_id = i.item_id
      LEFT JOIN item_categories ic ON i.category_id = ic.category_id
      JOIN warehouses w ON sl.warehouse_id = w.warehouse_id
      WHERE i.is_active = true 
        AND i.is_purchasable = true
        AND sl.available_quantity <= i.reorder_level
      ORDER BY priority DESC, shortage_quantity DESC
    `);

    // View 4: Inventory Valuation Summary
    await client.query(`
      CREATE OR REPLACE VIEW v_inventory_valuation AS
      SELECT 
        w.warehouse_id,
        w.warehouse_code,
        w.warehouse_name,
        ic.category_id,
        ic.category_name,
        COUNT(DISTINCT sl.item_id) as item_count,
        SUM(sl.on_hand_quantity) as total_quantity,
        SUM(sl.total_value) as total_value,
        SUM(CASE WHEN sl.available_quantity <= 0 THEN 1 ELSE 0 END) as out_of_stock_items,
        SUM(CASE WHEN i.reorder_level > 0 AND sl.available_quantity <= i.reorder_level THEN 1 ELSE 0 END) as reorder_required_items
      FROM stock_levels sl
      JOIN items i ON sl.item_id = i.item_id
      LEFT JOIN item_categories ic ON i.category_id = ic.category_id
      JOIN warehouses w ON sl.warehouse_id = w.warehouse_id
      WHERE i.is_active = true
      GROUP BY w.warehouse_id, w.warehouse_code, w.warehouse_name, ic.category_id, ic.category_name
    `);

    // ============================================================================
    // SEED DATA
    // ============================================================================

    // Seed Units of Measure
    await client.query(`
      INSERT INTO units_of_measure (uom_code, uom_name, uom_type, is_base_unit, conversion_factor)
      VALUES 
        ('EA', 'Each', 'Quantity', true, 1.0),
        ('PC', 'Piece', 'Quantity', false, 1.0),
        ('BOX', 'Box', 'Quantity', false, 12.0),
        ('DOZEN', 'Dozen', 'Quantity', false, 12.0),
        ('CARTON', 'Carton', 'Quantity', false, 24.0),
        ('PALLET', 'Pallet', 'Quantity', false, 1000.0),
        ('KG', 'Kilogram', 'Weight', true, 1.0),
        ('G', 'Gram', 'Weight', false, 0.001),
        ('LB', 'Pound', 'Weight', false, 0.453592),
        ('L', 'Liter', 'Volume', true, 1.0),
        ('ML', 'Milliliter', 'Volume', false, 0.001),
        ('M', 'Meter', 'Length', true, 1.0),
        ('CM', 'Centimeter', 'Length', false, 0.01),
        ('M2', 'Square Meter', 'Area', true, 1.0),
        ('HR', 'Hour', 'Time', true, 1.0)
      ON CONFLICT (uom_code) DO NOTHING
    `);

    // Seed Item Categories
    await client.query(`
      INSERT INTO item_categories (category_code, category_name, description)
      VALUES 
        ('FG', 'Finished Goods', 'Completed products ready for sale'),
        ('RM', 'Raw Materials', 'Materials used in production'),
        ('SF', 'Semi-Finished', 'Work in progress items'),
        ('CONS', 'Consumables', 'Office and operational supplies'),
        ('SPARE', 'Spare Parts', 'Replacement parts and components'),
        ('ASSET', 'Fixed Assets', 'Long-term assets')
      ON CONFLICT (category_code) DO NOTHING
    `);

    // Seed Default Warehouse
    await client.query(`
      INSERT INTO warehouses (warehouse_code, warehouse_name, warehouse_type, city, country, is_active)
      VALUES 
        ('WH-MAIN', 'Main Warehouse', 'Main', 'Johannesburg', 'South Africa', true),
        ('WH-DIST', 'Distribution Center', 'Distribution', 'Cape Town', 'South Africa', true),
        ('WH-RET', 'Retail Store', 'Retail', 'Durban', 'South Africa', true)
      ON CONFLICT (warehouse_code) DO NOTHING
    `);

    await client.query('COMMIT');
    console.log('✅ Inventory Management migration completed successfully');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Inventory Management migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}
