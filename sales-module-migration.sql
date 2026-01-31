-- Sales Module Migration for AWS Production
-- Creates quotations, sales_orders, purchase_orders tables

-- Quotations table
CREATE TABLE IF NOT EXISTS quotations (
  id SERIAL PRIMARY KEY,
  tenant_id UUID,
  quote_number VARCHAR(50),
  quotation_number VARCHAR(50),
  customer_id INTEGER,
  quotation_date DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  total_amount DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  net_amount DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'draft',
  notes TEXT,
  terms TEXT,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quotation lines
CREATE TABLE IF NOT EXISTS quotation_lines (
  id SERIAL PRIMARY KEY,
  quotation_id INTEGER REFERENCES quotations(id) ON DELETE CASCADE,
  product_id INTEGER,
  description TEXT,
  quantity DECIMAL(15,4) DEFAULT 1,
  unit_price DECIMAL(15,2) DEFAULT 0,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 15,
  line_total DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales Orders table
CREATE TABLE IF NOT EXISTS sales_orders (
  id SERIAL PRIMARY KEY,
  tenant_id UUID,
  order_number VARCHAR(50),
  customer_id INTEGER,
  quotation_id INTEGER REFERENCES quotations(id),
  order_date DATE DEFAULT CURRENT_DATE,
  delivery_date DATE,
  warehouse_id INTEGER,
  total_amount DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  net_amount DECIMAL(15,2) DEFAULT 0,
  order_status VARCHAR(50) DEFAULT 'pending',
  status VARCHAR(50) DEFAULT 'pending',
  shipping_address TEXT,
  notes TEXT,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales Order lines
CREATE TABLE IF NOT EXISTS sales_order_lines (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES sales_orders(id) ON DELETE CASCADE,
  product_id INTEGER,
  description TEXT,
  quantity DECIMAL(15,4) DEFAULT 1,
  unit_price DECIMAL(15,2) DEFAULT 0,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 15,
  line_total DECIMAL(15,2) DEFAULT 0,
  delivered_quantity DECIMAL(15,4) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase Orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id SERIAL PRIMARY KEY,
  tenant_id UUID,
  po_number VARCHAR(50),
  supplier_id INTEGER,
  order_date DATE DEFAULT CURRENT_DATE,
  delivery_date DATE,
  warehouse_id INTEGER,
  total_amount DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  net_amount DECIMAL(15,2) DEFAULT 0,
  order_status VARCHAR(50) DEFAULT 'pending',
  status VARCHAR(50) DEFAULT 'pending',
  shipping_address TEXT,
  notes TEXT,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase Order lines
CREATE TABLE IF NOT EXISTS purchase_order_lines (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id INTEGER,
  description TEXT,
  quantity DECIMAL(15,4) DEFAULT 1,
  unit_price DECIMAL(15,2) DEFAULT 0,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 15,
  line_total DECIMAL(15,2) DEFAULT 0,
  received_quantity DECIMAL(15,4) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  tenant_id UUID,
  supplier_code VARCHAR(50),
  supplier_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  vat_number VARCHAR(50),
  payment_terms INTEGER DEFAULT 30,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_quotations_tenant ON quotations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quotations_customer ON quotations(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_tenant ON sales_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer ON sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant ON purchase_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);

SELECT 'Sales module tables created successfully!' as result;
