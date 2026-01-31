-- Fix quotations table
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS quote_number VARCHAR(50);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS valid_until TIMESTAMP;

-- Fix sales_orders table  
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS warehouse_id INTEGER;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(50);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS order_status VARCHAR(50) DEFAULT 'pending';

-- Fix purchase_orders table
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS po_number VARCHAR(50);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS warehouse_id INTEGER;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS order_status VARCHAR(50) DEFAULT 'pending';

-- Update existing rows with generated numbers
UPDATE quotations SET quote_number = 'QT-' || LPAD(id::text, 6, '0') WHERE quote_number IS NULL;
UPDATE sales_orders SET order_number = 'SO-' || LPAD(id::text, 6, '0') WHERE order_number IS NULL;
UPDATE purchase_orders SET po_number = 'PO-' || LPAD(id::text, 6, '0') WHERE po_number IS NULL;

SELECT 'Database schema fixed!';
