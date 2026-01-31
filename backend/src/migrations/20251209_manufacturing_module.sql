-- Manufacturing Module Migration
-- Adds BOM, Production Orders, Work Centers, MRP, and Quality Control

CREATE SCHEMA IF NOT EXISTS manufacturing;

-- =====================================================
-- 1. WORK CENTERS & ROUTINGS
-- =====================================================
CREATE TABLE IF NOT EXISTS manufacturing.work_centers (
  work_center_id SERIAL PRIMARY KEY,
  work_center_code VARCHAR(50) UNIQUE NOT NULL,
  work_center_name VARCHAR(100) NOT NULL,
  description TEXT,
  warehouse_id INTEGER REFERENCES warehouses(warehouse_id), -- Location
  capacity_per_day_hours DECIMAL(5,2) DEFAULT 8.00,
  efficiency_factor DECIMAL(5,2) DEFAULT 1.00, -- 1.00 = 100%
  hourly_cost_rate DECIMAL(10,2) DEFAULT 0.00,
  status VARCHAR(20) DEFAULT 'active', -- active, maintenance, inactive
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS manufacturing.routings (
  routing_id SERIAL PRIMARY KEY,
  routing_name VARCHAR(100) NOT NULL,
  item_id INTEGER REFERENCES items(item_id), -- Default routing for this item
  is_default BOOLEAN DEFAULT false,
  version VARCHAR(20) DEFAULT '1.0',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS manufacturing.routing_operations (
  operation_id SERIAL PRIMARY KEY,
  routing_id INTEGER NOT NULL REFERENCES manufacturing.routings(routing_id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL,
  operation_name VARCHAR(100) NOT NULL,
  work_center_id INTEGER REFERENCES manufacturing.work_centers(work_center_id),
  setup_time_minutes DECIMAL(10,2) DEFAULT 0,
  run_time_per_unit_minutes DECIMAL(10,2) DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. BILL OF MATERIALS (BOM)
-- =====================================================
CREATE TABLE IF NOT EXISTS manufacturing.bill_of_materials (
  bom_id SERIAL PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES items(item_id), -- The finished good
  bom_code VARCHAR(50),
  version VARCHAR(20) DEFAULT '1.0',
  is_default BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active', -- active, draft, obsolete
  description TEXT,
  yield_percentage DECIMAL(5,2) DEFAULT 100.00,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS manufacturing.bom_components (
  component_id SERIAL PRIMARY KEY,
  bom_id INTEGER NOT NULL REFERENCES manufacturing.bill_of_materials(bom_id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES items(item_id), -- The raw material/sub-assembly
  quantity DECIMAL(15,6) NOT NULL, -- Quantity needed per 1 unit of parent
  uom_id INTEGER REFERENCES units_of_measure(uom_id),
  scrap_percentage DECIMAL(5,2) DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 3. PRODUCTION ORDERS (WORK ORDERS)
-- =====================================================
CREATE TABLE IF NOT EXISTS manufacturing.production_orders (
  production_order_id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  item_id INTEGER NOT NULL REFERENCES items(item_id),
  bom_id INTEGER REFERENCES manufacturing.bill_of_materials(bom_id),
  routing_id INTEGER REFERENCES manufacturing.routings(routing_id),
  warehouse_id INTEGER REFERENCES warehouses(warehouse_id), -- Destination warehouse
  quantity_planned DECIMAL(15,2) NOT NULL,
  quantity_produced DECIMAL(15,2) DEFAULT 0,
  quantity_rejected DECIMAL(15,2) DEFAULT 0,
  start_date DATE,
  due_date DATE,
  actual_start_date TIMESTAMP,
  actual_end_date TIMESTAMP,
  status VARCHAR(30) DEFAULT 'planned', -- planned, released, in_progress, completed, cancelled, on_hold
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
  sales_order_id INTEGER, -- Link to sales order if make-to-order
  notes TEXT,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tracks material consumption for a production order
CREATE TABLE IF NOT EXISTS manufacturing.production_material_issues (
  issue_id SERIAL PRIMARY KEY,
  production_order_id INTEGER NOT NULL REFERENCES manufacturing.production_orders(production_order_id),
  item_id INTEGER NOT NULL REFERENCES items(item_id),
  quantity_required DECIMAL(15,2) NOT NULL,
  quantity_issued DECIMAL(15,2) DEFAULT 0,
  warehouse_id INTEGER REFERENCES warehouses(warehouse_id), -- Source warehouse
  status VARCHAR(20) DEFAULT 'pending', -- pending, partial, completed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tracks operations/tasks progress
CREATE TABLE IF NOT EXISTS manufacturing.production_operations (
  prod_op_id SERIAL PRIMARY KEY,
  production_order_id INTEGER NOT NULL REFERENCES manufacturing.production_orders(production_order_id) ON DELETE CASCADE,
  operation_name VARCHAR(100) NOT NULL,
  work_center_id INTEGER REFERENCES manufacturing.work_centers(work_center_id),
  sequence_number INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, completed
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  actual_setup_minutes DECIMAL(10,2),
  actual_run_minutes DECIMAL(10,2),
  assigned_to INTEGER, -- Employee/User
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. QUALITY CONTROL
-- =====================================================
CREATE TABLE IF NOT EXISTS manufacturing.quality_inspections (
  inspection_id SERIAL PRIMARY KEY,
  production_order_id INTEGER REFERENCES manufacturing.production_orders(production_order_id),
  item_id INTEGER REFERENCES items(item_id),
  inspection_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  inspector_id INTEGER,
  quantity_inspected DECIMAL(15,2),
  quantity_passed DECIMAL(15,2),
  quantity_failed DECIMAL(15,2),
  result VARCHAR(20), -- pass, fail, conditional
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS manufacturing.quality_defects (
  defect_id SERIAL PRIMARY KEY,
  inspection_id INTEGER REFERENCES manufacturing.quality_inspections(inspection_id),
  defect_code VARCHAR(50),
  defect_description TEXT,
  severity VARCHAR(20), -- minor, major, critical
  quantity DECIMAL(15,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 5. MRP (MATERIAL REQUIREMENTS PLANNING)
-- =====================================================
CREATE TABLE IF NOT EXISTS manufacturing.mrp_runs (
  run_id SERIAL PRIMARY KEY,
  run_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  run_by INTEGER,
  parameters JSONB, -- Settings used for the run
  status VARCHAR(20) DEFAULT 'completed'
);

CREATE TABLE IF NOT EXISTS manufacturing.mrp_results (
  result_id SERIAL PRIMARY KEY,
  run_id INTEGER REFERENCES manufacturing.mrp_runs(run_id) ON DELETE CASCADE,
  item_id INTEGER REFERENCES items(item_id),
  required_date DATE,
  gross_requirement DECIMAL(15,2),
  scheduled_receipts DECIMAL(15,2),
  projected_on_hand DECIMAL(15,2),
  net_requirement DECIMAL(15,2),
  planned_order_receipt DECIMAL(15,2),
  planned_order_release DECIMAL(15,2),
  action_message VARCHAR(100), -- 'Create Production Order', 'Create Purchase Order', 'Reschedule'
  source_type VARCHAR(50), -- 'Sales Order', 'Forecast', 'Safety Stock'
  source_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_bom_item ON manufacturing.bill_of_materials(item_id);
CREATE INDEX idx_prod_order_status ON manufacturing.production_orders(status);
CREATE INDEX idx_mrp_results_item ON manufacturing.mrp_results(item_id);
CREATE INDEX idx_work_center_code ON manufacturing.work_centers(work_center_code);

