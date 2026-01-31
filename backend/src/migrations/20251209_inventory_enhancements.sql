-- ============================================================================
-- INVENTORY ENHANCEMENTS - DEC 09 2025
-- Adds batch/serial tracking, stock takes, reorder suggestions, valuation layers,
-- and ensures stock_movements columns exist for richer tracking.
-- ============================================================================

BEGIN;

-- Ensure stock_movements has necessary columns
ALTER TABLE IF EXISTS stock_movements
  ADD COLUMN IF NOT EXISTS from_warehouse_id INTEGER REFERENCES warehouses(warehouse_id),
  ADD COLUMN IF NOT EXISTS to_warehouse_id INTEGER REFERENCES warehouses(warehouse_id),
  ADD COLUMN IF NOT EXISTS reference_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS reference_id INTEGER,
  ADD COLUMN IF NOT EXISTS reference_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS batch_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS serial_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS expiry_date DATE,
  ADD COLUMN IF NOT EXISTS posting_date DATE,
  ADD COLUMN IF NOT EXISTS approved_by INTEGER,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

-- Cost layers for FIFO/LIFO/Weighted Average reconciliation
CREATE TABLE IF NOT EXISTS inventory_valuation_layers (
  layer_id SERIAL PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES items(item_id),
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(warehouse_id),
  receipt_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  receipt_reference VARCHAR(100),
  quantity_received DECIMAL(15,2) NOT NULL,
  quantity_remaining DECIMAL(15,2) NOT NULL,
  unit_cost DECIMAL(15,2) NOT NULL,
  movement_id INTEGER REFERENCES stock_movements(movement_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_layers_item_wh ON inventory_valuation_layers(item_id, warehouse_id);
CREATE INDEX IF NOT EXISTS idx_layers_receipt ON inventory_valuation_layers(receipt_date DESC);

-- Batch tracking
CREATE TABLE IF NOT EXISTS stock_batches (
  batch_id SERIAL PRIMARY KEY,
  batch_number VARCHAR(100) NOT NULL,
  item_id INTEGER NOT NULL REFERENCES items(item_id),
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(warehouse_id),
  quantity_on_hand DECIMAL(15,2) DEFAULT 0,
  quantity_reserved DECIMAL(15,2) DEFAULT 0,
  quantity_available DECIMAL(15,2) DEFAULT 0,
  unit_cost DECIMAL(15,2) DEFAULT 0,
  manufacture_date DATE,
  expiry_date DATE,
  received_date DATE DEFAULT CURRENT_DATE,
  supplier_id INTEGER,
  reference_type VARCHAR(50),
  reference_number VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(item_id, warehouse_id, batch_number)
);

CREATE INDEX IF NOT EXISTS idx_stock_batches_expiry ON stock_batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_stock_batches_item_wh ON stock_batches(item_id, warehouse_id);

-- Serial tracking
CREATE TABLE IF NOT EXISTS stock_serial_numbers (
  serial_id SERIAL PRIMARY KEY,
  serial_number VARCHAR(100) UNIQUE NOT NULL,
  item_id INTEGER NOT NULL REFERENCES items(item_id),
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(warehouse_id),
  batch_id INTEGER REFERENCES stock_batches(batch_id),
  status VARCHAR(20) DEFAULT 'in_stock',
  manufacture_date DATE,
  expiry_date DATE,
  assigned_to INTEGER,
  location VARCHAR(255),
  reference_type VARCHAR(50),
  reference_number VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_serial_item_wh ON stock_serial_numbers(item_id, warehouse_id);

-- Reorder suggestions with linkage to purchase requisitions
CREATE TABLE IF NOT EXISTS reorder_suggestions (
  suggestion_id SERIAL PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES items(item_id),
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(warehouse_id),
  current_available DECIMAL(15,2) NOT NULL DEFAULT 0,
  reorder_level DECIMAL(15,2) NOT NULL DEFAULT 0,
  suggested_quantity DECIMAL(15,2) NOT NULL,
  priority VARCHAR(20) DEFAULT 'Medium',
  status VARCHAR(20) DEFAULT 'Pending',
  purchase_requisition_id INTEGER REFERENCES purchase_requisitions(id),
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reorder_item_wh ON reorder_suggestions(item_id, warehouse_id);
CREATE INDEX IF NOT EXISTS idx_reorder_status ON reorder_suggestions(status);

-- Stock take workflow
CREATE TABLE IF NOT EXISTS stock_takes (
  stock_take_id SERIAL PRIMARY KEY,
  take_number VARCHAR(30) UNIQUE NOT NULL,
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(warehouse_id),
  status VARCHAR(20) DEFAULT 'Draft',
  scheduled_date DATE,
  completed_at TIMESTAMP,
  posted_at TIMESTAMP,
  notes TEXT,
  created_by INTEGER,
  updated_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_take_lines (
  stock_take_line_id SERIAL PRIMARY KEY,
  stock_take_id INTEGER NOT NULL REFERENCES stock_takes(stock_take_id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  item_id INTEGER NOT NULL REFERENCES items(item_id),
  batch_number VARCHAR(100),
  serial_number VARCHAR(100),
  system_quantity DECIMAL(15,2) DEFAULT 0,
  counted_quantity DECIMAL(15,2) NOT NULL,
  variance_quantity DECIMAL(15,2) DEFAULT 0,
  unit_cost DECIMAL(15,2) DEFAULT 0,
  variance_value DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'Draft',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(stock_take_id, line_number)
);

CREATE INDEX IF NOT EXISTS idx_stock_take_lines_item ON stock_take_lines(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_take_lines_batch ON stock_take_lines(batch_number);

COMMIT;
