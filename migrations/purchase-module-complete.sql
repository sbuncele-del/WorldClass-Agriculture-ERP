-- ============================================================================
-- PURCHASE MODULE - COMPLETE DATABASE SCHEMA
-- Created: November 20, 2025
-- ============================================================================

-- Create purchase schema
CREATE SCHEMA IF NOT EXISTS purchase;

-- ============================================================================
-- SUPPLIERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS purchase.suppliers (
    supplier_id SERIAL PRIMARY KEY,
    supplier_code VARCHAR(50) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    vat_number VARCHAR(50),
    supplier_type VARCHAR(50) DEFAULT 'STANDARD',
    payment_terms VARCHAR(100) DEFAULT 'Net 30',
    credit_limit NUMERIC(15,2) DEFAULT 0.00,
    currency_code VARCHAR(3) DEFAULT 'ZAR',
    billing_address TEXT,
    shipping_address TEXT,
    bank_name VARCHAR(255),
    bank_account_number VARCHAR(50),
    bank_branch VARCHAR(100),
    tax_id VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PURCHASE REQUISITIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS purchase.purchase_requisitions (
    requisition_id SERIAL PRIMARY KEY,
    requisition_number VARCHAR(50) UNIQUE NOT NULL,
    requisition_date DATE NOT NULL DEFAULT CURRENT_DATE,
    requested_by INTEGER,
    department_id INTEGER,
    required_by_date DATE,
    priority VARCHAR(20) DEFAULT 'normal',
    status VARCHAR(50) DEFAULT 'draft',
    total_amount NUMERIC(15,2) DEFAULT 0.00,
    approved_by INTEGER,
    approved_date TIMESTAMP,
    rejection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase.requisition_line_items (
    line_id SERIAL PRIMARY KEY,
    requisition_id INTEGER REFERENCES purchase.purchase_requisitions(requisition_id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    item_code VARCHAR(100),
    description TEXT NOT NULL,
    quantity NUMERIC(15,3) NOT NULL,
    unit_of_measure VARCHAR(20),
    estimated_unit_price NUMERIC(15,2),
    estimated_total NUMERIC(15,2),
    required_by_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PURCHASE ORDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS purchase.purchase_orders (
    po_id SERIAL PRIMARY KEY,
    po_number VARCHAR(50) UNIQUE NOT NULL,
    po_date DATE NOT NULL DEFAULT CURRENT_DATE,
    supplier_id INTEGER REFERENCES purchase.suppliers(supplier_id),
    requisition_id INTEGER REFERENCES purchase.purchase_requisitions(requisition_id),
    delivery_date DATE,
    delivery_address TEXT,
    payment_terms VARCHAR(100),
    status VARCHAR(50) DEFAULT 'draft',
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(15,2) DEFAULT 0.00,
    vat_rate NUMERIC(5,2) DEFAULT 15.00,
    vat_amount NUMERIC(15,2) DEFAULT 0.00,
    total NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    currency_code VARCHAR(3) DEFAULT 'ZAR',
    sent_to_supplier BOOLEAN DEFAULT FALSE,
    sent_date TIMESTAMP,
    acknowledged_by_supplier BOOLEAN DEFAULT FALSE,
    acknowledged_date TIMESTAMP,
    created_by INTEGER,
    approved_by INTEGER,
    approved_date TIMESTAMP,
    cancelled_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase.po_line_items (
    line_id SERIAL PRIMARY KEY,
    po_id INTEGER REFERENCES purchase.purchase_orders(po_id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    item_code VARCHAR(100),
    description TEXT NOT NULL,
    quantity NUMERIC(15,3) NOT NULL,
    unit_of_measure VARCHAR(20),
    unit_price NUMERIC(15,2) NOT NULL,
    discount_percentage NUMERIC(5,2) DEFAULT 0.00,
    discount_amount NUMERIC(15,2) DEFAULT 0.00,
    vat_rate NUMERIC(5,2) DEFAULT 15.00,
    vat_amount NUMERIC(15,2) DEFAULT 0.00,
    line_total NUMERIC(15,2) NOT NULL,
    quantity_received NUMERIC(15,3) DEFAULT 0.00,
    quantity_invoiced NUMERIC(15,3) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- GOODS RECEIPTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS purchase.goods_receipts (
    gr_id SERIAL PRIMARY KEY,
    gr_number VARCHAR(50) UNIQUE NOT NULL,
    gr_date DATE NOT NULL DEFAULT CURRENT_DATE,
    po_id INTEGER REFERENCES purchase.purchase_orders(po_id),
    supplier_id INTEGER REFERENCES purchase.suppliers(supplier_id),
    delivery_note_number VARCHAR(100),
    received_by INTEGER,
    status VARCHAR(50) DEFAULT 'draft',
    total_quantity NUMERIC(15,3) DEFAULT 0.00,
    warehouse_id INTEGER,
    confirmed BOOLEAN DEFAULT FALSE,
    confirmed_by INTEGER,
    confirmed_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase.gr_line_items (
    line_id SERIAL PRIMARY KEY,
    gr_id INTEGER REFERENCES purchase.goods_receipts(gr_id) ON DELETE CASCADE,
    po_line_id INTEGER REFERENCES purchase.po_line_items(line_id),
    line_number INTEGER NOT NULL,
    item_code VARCHAR(100),
    description TEXT,
    quantity_ordered NUMERIC(15,3),
    quantity_received NUMERIC(15,3) NOT NULL,
    unit_of_measure VARCHAR(20),
    condition VARCHAR(50) DEFAULT 'good',
    batch_number VARCHAR(100),
    serial_numbers TEXT,
    expiry_date DATE,
    bin_location VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- VENDOR INVOICES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS purchase.vendor_invoices (
    invoice_id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    supplier_id INTEGER REFERENCES purchase.suppliers(supplier_id),
    po_id INTEGER REFERENCES purchase.purchase_orders(po_id),
    gr_id INTEGER REFERENCES purchase.goods_receipts(gr_id),
    due_date DATE,
    payment_terms VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(15,2) DEFAULT 0.00,
    vat_rate NUMERIC(5,2) DEFAULT 15.00,
    vat_amount NUMERIC(15,2) DEFAULT 0.00,
    total_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    amount_paid NUMERIC(15,2) DEFAULT 0.00,
    amount_outstanding NUMERIC(15,2),
    currency_code VARCHAR(3) DEFAULT 'ZAR',
    approved BOOLEAN DEFAULT FALSE,
    approved_by INTEGER,
    approved_date TIMESTAMP,
    rejected BOOLEAN DEFAULT FALSE,
    rejection_reason TEXT,
    paid BOOLEAN DEFAULT FALSE,
    payment_date TIMESTAMP,
    payment_reference VARCHAR(100),
    journal_entry_id INTEGER,
    posted_to_gl BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase.invoice_line_items (
    line_id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES purchase.vendor_invoices(invoice_id) ON DELETE CASCADE,
    po_line_id INTEGER REFERENCES purchase.po_line_items(line_id),
    gr_line_id INTEGER REFERENCES purchase.gr_line_items(line_id),
    line_number INTEGER NOT NULL,
    item_code VARCHAR(100),
    description TEXT,
    quantity NUMERIC(15,3) NOT NULL,
    unit_of_measure VARCHAR(20),
    unit_price NUMERIC(15,2) NOT NULL,
    discount_percentage NUMERIC(5,2) DEFAULT 0.00,
    discount_amount NUMERIC(15,2) DEFAULT 0.00,
    vat_rate NUMERIC(5,2) DEFAULT 15.00,
    vat_amount NUMERIC(15,2) DEFAULT 0.00,
    line_total NUMERIC(15,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- VENDOR PAYMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS purchase.vendor_payments (
    payment_id SERIAL PRIMARY KEY,
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    supplier_id INTEGER REFERENCES purchase.suppliers(supplier_id),
    invoice_id INTEGER REFERENCES purchase.vendor_invoices(invoice_id),
    payment_method VARCHAR(50) DEFAULT 'bank_transfer',
    amount NUMERIC(15,2) NOT NULL,
    reference VARCHAR(100),
    bank_account VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    journal_entry_id INTEGER,
    posted_to_gl BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PURCHASE RETURNS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS purchase.purchase_returns (
    return_id SERIAL PRIMARY KEY,
    return_number VARCHAR(50) UNIQUE NOT NULL,
    return_date DATE NOT NULL DEFAULT CURRENT_DATE,
    gr_id INTEGER REFERENCES purchase.goods_receipts(gr_id),
    supplier_id INTEGER REFERENCES purchase.suppliers(supplier_id),
    reason VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    total_amount NUMERIC(15,2) DEFAULT 0.00,
    credit_note_received BOOLEAN DEFAULT FALSE,
    credit_note_number VARCHAR(100),
    credit_note_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase.return_line_items (
    line_id SERIAL PRIMARY KEY,
    return_id INTEGER REFERENCES purchase.purchase_returns(return_id) ON DELETE CASCADE,
    gr_line_id INTEGER REFERENCES purchase.gr_line_items(line_id),
    line_number INTEGER NOT NULL,
    item_code VARCHAR(100),
    description TEXT,
    quantity_returned NUMERIC(15,3) NOT NULL,
    unit_of_measure VARCHAR(20),
    unit_price NUMERIC(15,2),
    line_total NUMERIC(15,2),
    reason VARCHAR(255),
    condition VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SAMPLE DATA - SUPPLIERS
-- ============================================================================
INSERT INTO purchase.suppliers (supplier_code, company_name, contact_person, email, phone, vat_number, payment_terms, credit_limit, billing_address, status)
VALUES
    ('SUP-001', 'ABC Office Supplies Ltd', 'John Smith', 'john@abcoffice.co.za', '+27 11 123 4567', '4123456789', 'Net 30', 100000.00, '123 Main Road, Johannesburg, 2000', 'active'),
    ('SUP-002', 'Tech Components SA', 'Sarah Johnson', 'sarah@techcomponents.co.za', '+27 21 555 8888', '4987654321', 'Net 45', 250000.00, '45 Tech Park, Cape Town, 8001', 'active'),
    ('SUP-003', 'Industrial Parts Co', 'Mike Brown', 'mike@indparts.co.za', '+27 31 777 9999', '4567891234', 'Net 30', 150000.00, '78 Factory Street, Durban, 4001', 'active'),
    ('SUP-004', 'Green Energy Solutions', 'Lisa Davis', 'lisa@greenenergy.co.za', '+27 11 888 7777', '4111222333', 'Net 60', 500000.00, '90 Solar Drive, Pretoria, 0001', 'active'),
    ('SUP-005', 'Quality Raw Materials', 'Tom Wilson', 'tom@qualityraw.co.za', '+27 41 666 5555', '4222333444', 'Net 30', 200000.00, '12 Industry Lane, Port Elizabeth, 6001', 'active')
ON CONFLICT (supplier_code) DO NOTHING;

-- ============================================================================
-- SAMPLE DATA - PURCHASE REQUISITIONS
-- ============================================================================
INSERT INTO purchase.purchase_requisitions (requisition_number, requisition_date, requested_by, required_by_date, priority, status, total_amount, notes)
VALUES
    ('PR-2024-001', '2024-11-01', 1, '2024-11-15', 'high', 'approved', 25000.00, 'Urgent office supplies needed'),
    ('PR-2024-002', '2024-11-05', 1, '2024-11-20', 'normal', 'pending', 45000.00, 'Computer equipment for new staff'),
    ('PR-2024-003', '2024-11-10', 1, '2024-11-30', 'low', 'draft', 15000.00, 'Maintenance supplies')
ON CONFLICT (requisition_number) DO NOTHING;

-- ============================================================================
-- SAMPLE DATA - PURCHASE ORDERS
-- ============================================================================
INSERT INTO purchase.purchase_orders (po_number, po_date, supplier_id, delivery_date, status, subtotal, vat_rate, vat_amount, total, sent_to_supplier, acknowledged_by_supplier)
VALUES
    ('PO-2024-001', '2024-11-02', 1, '2024-11-12', 'confirmed', 21739.13, 15.00, 3260.87, 25000.00, TRUE, TRUE),
    ('PO-2024-002', '2024-11-06', 2, '2024-11-18', 'sent', 39130.43, 15.00, 5869.57, 45000.00, TRUE, FALSE),
    ('PO-2024-003', '2024-11-08', 3, '2024-11-22', 'draft', 86956.52, 15.00, 13043.48, 100000.00, FALSE, FALSE),
    ('PO-2024-004', '2024-11-12', 4, '2024-12-01', 'confirmed', 173913.04, 15.00, 26086.96, 200000.00, TRUE, TRUE),
    ('PO-2024-005', '2024-11-15', 5, '2024-12-05', 'sent', 65217.39, 15.00, 9782.61, 75000.00, TRUE, FALSE)
ON CONFLICT (po_number) DO NOTHING;

-- ============================================================================
-- SAMPLE DATA - PO LINE ITEMS
-- ============================================================================
INSERT INTO purchase.po_line_items (po_id, line_number, item_code, description, quantity, unit_of_measure, unit_price, vat_rate, vat_amount, line_total)
VALUES
    (1, 1, 'OFF-001', 'Office Desk - Executive', 10, 'EA', 1500.00, 15.00, 2250.00, 17250.00),
    (1, 2, 'OFF-002', 'Office Chair - Ergonomic', 15, 'EA', 850.00, 15.00, 1912.50, 14662.50),
    (2, 1, 'COMP-001', 'Laptop - Dell XPS 15', 5, 'EA', 18000.00, 15.00, 13500.00, 103500.00),
    (2, 2, 'COMP-002', 'Monitor - 27 inch 4K', 10, 'EA', 6500.00, 15.00, 9750.00, 74750.00),
    (3, 1, 'IND-001', 'Industrial Valve - 2 inch', 20, 'EA', 2500.00, 15.00, 7500.00, 57500.00),
    (3, 2, 'IND-002', 'Heavy Duty Motor - 5HP', 5, 'EA', 12000.00, 15.00, 9000.00, 69000.00)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SAMPLE DATA - GOODS RECEIPTS
-- ============================================================================
INSERT INTO purchase.goods_receipts (gr_number, gr_date, po_id, supplier_id, delivery_note_number, received_by, status, total_quantity, confirmed)
VALUES
    ('GR-2024-001', '2024-11-12', 1, 1, 'DN-ABC-12345', 1, 'confirmed', 25.00, TRUE),
    ('GR-2024-002', '2024-11-18', 2, 2, 'DN-TECH-67890', 1, 'confirmed', 15.00, TRUE),
    ('GR-2024-003', '2024-11-20', 4, 4, 'DN-GREEN-11111', 1, 'pending', 50.00, FALSE)
ON CONFLICT (gr_number) DO NOTHING;

-- ============================================================================
-- SAMPLE DATA - GR LINE ITEMS
-- ============================================================================
INSERT INTO purchase.gr_line_items (gr_id, po_line_id, line_number, item_code, description, quantity_ordered, quantity_received, unit_of_measure, condition)
VALUES
    (1, 1, 1, 'OFF-001', 'Office Desk - Executive', 10, 10, 'EA', 'good'),
    (1, 2, 2, 'OFF-002', 'Office Chair - Ergonomic', 15, 15, 'EA', 'good'),
    (2, 3, 1, 'COMP-001', 'Laptop - Dell XPS 15', 5, 5, 'EA', 'good'),
    (2, 4, 2, 'COMP-002', 'Monitor - 27 inch 4K', 10, 10, 'EA', 'good')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SAMPLE DATA - VENDOR INVOICES
-- ============================================================================
INSERT INTO purchase.vendor_invoices (invoice_number, invoice_date, supplier_id, po_id, gr_id, due_date, status, subtotal, vat_rate, vat_amount, total_amount, amount_outstanding, approved)
VALUES
    ('VINV-2024-001', '2024-11-13', 1, 1, 1, '2024-12-13', 'approved', 21739.13, 15.00, 3260.87, 25000.00, 25000.00, TRUE),
    ('VINV-2024-002', '2024-11-19', 2, 2, 2, '2024-12-19', 'pending', 39130.43, 15.00, 5869.57, 45000.00, 45000.00, FALSE),
    ('VINV-2024-003', '2024-11-20', 4, 4, 3, '2025-01-19', 'pending', 43478.26, 15.00, 6521.74, 50000.00, 50000.00, FALSE)
ON CONFLICT (invoice_number) DO NOTHING;

-- ============================================================================
-- SAMPLE DATA - INVOICE LINE ITEMS
-- ============================================================================
INSERT INTO purchase.invoice_line_items (invoice_id, po_line_id, gr_line_id, line_number, item_code, description, quantity, unit_of_measure, unit_price, vat_rate, vat_amount, line_total)
VALUES
    (1, 1, 1, 1, 'OFF-001', 'Office Desk - Executive', 10, 'EA', 1500.00, 15.00, 2250.00, 17250.00),
    (1, 2, 2, 2, 'OFF-002', 'Office Chair - Ergonomic', 15, 'EA', 850.00, 15.00, 1912.50, 14662.50),
    (2, 3, 3, 1, 'COMP-001', 'Laptop - Dell XPS 15', 5, 'EA', 18000.00, 15.00, 13500.00, 103500.00),
    (2, 4, 4, 2, 'COMP-002', 'Monitor - 27 inch 4K', 10, 'EA', 6500.00, 15.00, 9750.00, 74750.00)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SAMPLE DATA - VENDOR PAYMENTS
-- ============================================================================
INSERT INTO purchase.vendor_payments (payment_number, payment_date, supplier_id, invoice_id, payment_method, amount, reference, status)
VALUES
    ('VPAY-2024-001', '2024-11-25', 1, 1, 'bank_transfer', 25000.00, 'TRF-20241125-001', 'completed'),
    ('VPAY-2024-002', '2024-11-28', 2, 2, 'eft', 45000.00, 'EFT-20241128-002', 'pending')
ON CONFLICT (payment_number) DO NOTHING;

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_suppliers_code ON purchase.suppliers(supplier_code);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON purchase.suppliers(status);
CREATE INDEX IF NOT EXISTS idx_po_number ON purchase.purchase_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_po_supplier ON purchase.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_po_status ON purchase.purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_gr_number ON purchase.goods_receipts(gr_number);
CREATE INDEX IF NOT EXISTS idx_gr_po ON purchase.goods_receipts(po_id);
CREATE INDEX IF NOT EXISTS idx_invoice_number ON purchase.vendor_invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoice_supplier ON purchase.vendor_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_invoice_status ON purchase.vendor_invoices(status);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT 'Purchase module database schema created successfully!' AS status;
SELECT COUNT(*) AS supplier_count FROM purchase.suppliers;
SELECT COUNT(*) AS po_count FROM purchase.purchase_orders;
SELECT COUNT(*) AS gr_count FROM purchase.goods_receipts;
SELECT COUNT(*) AS invoice_count FROM purchase.vendor_invoices;
