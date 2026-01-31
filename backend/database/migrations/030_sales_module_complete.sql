-- =====================================================
-- SALES MODULE - COMPLETE SCHEMA
-- Created: November 12, 2025
-- Purpose: Full CRM and Sales pipeline management
-- =====================================================

-- Leads Table
CREATE TABLE IF NOT EXISTS sales.leads (
    lead_id SERIAL PRIMARY KEY,
    lead_number VARCHAR(50) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    source VARCHAR(100), -- 'Website', 'Referral', 'Cold Call', 'Event', 'LinkedIn'
    industry VARCHAR(100),
    lead_value DECIMAL(12,2),
    probability INTEGER DEFAULT 50, -- 0-100%
    status VARCHAR(50) DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'unqualified', 'converted'
    assigned_to VARCHAR(255),
    notes TEXT,
    next_follow_up DATE,
    converted_to_opportunity_id INTEGER,
    converted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Opportunities Table
CREATE TABLE IF NOT EXISTS sales.opportunities (
    opportunity_id SERIAL PRIMARY KEY,
    opportunity_number VARCHAR(50) UNIQUE NOT NULL,
    lead_id INTEGER REFERENCES sales.leads(lead_id),
    customer_id INTEGER REFERENCES sales.customers(customer_id),
    opportunity_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    value DECIMAL(12,2) NOT NULL,
    probability INTEGER DEFAULT 50, -- 0-100%
    expected_close_date DATE,
    stage VARCHAR(50) DEFAULT 'qualification', -- 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'
    source VARCHAR(100),
    assigned_to VARCHAR(255),
    notes TEXT,
    lost_reason TEXT,
    converted_to_quotation_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP
);

-- Quotations Table
CREATE TABLE IF NOT EXISTS sales.quotations (
    quotation_id SERIAL PRIMARY KEY,
    quotation_number VARCHAR(50) UNIQUE NOT NULL,
    opportunity_id INTEGER REFERENCES sales.opportunities(opportunity_id),
    customer_id INTEGER REFERENCES sales.customers(customer_id),
    quotation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    subtotal DECIMAL(12,2) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    vat_rate DECIMAL(5,2) DEFAULT 15.00,
    vat_amount DECIMAL(12,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    terms TEXT,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'sent', 'accepted', 'declined', 'expired'
    prepared_by VARCHAR(255),
    sent_at TIMESTAMP,
    accepted_at TIMESTAMP,
    declined_at TIMESTAMP,
    decline_reason TEXT,
    converted_to_order_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quotation Line Items
CREATE TABLE IF NOT EXISTS sales.quotation_line_items (
    line_item_id SERIAL PRIMARY KEY,
    quotation_id INTEGER REFERENCES sales.quotations(quotation_id) ON DELETE CASCADE,
    item_code VARCHAR(100),
    description TEXT NOT NULL,
    quantity DECIMAL(10,4) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    vat_rate DECIMAL(5,2) DEFAULT 15.00,
    line_total DECIMAL(12,2) NOT NULL,
    line_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales Orders Table
CREATE TABLE IF NOT EXISTS sales.orders (
    order_id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    quotation_id INTEGER REFERENCES sales.quotations(quotation_id),
    customer_id INTEGER REFERENCES sales.customers(customer_id) NOT NULL,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    delivery_date DATE,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    delivery_address TEXT,
    special_instructions TEXT,
    subtotal DECIMAL(12,2) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    vat_rate DECIMAL(5,2) DEFAULT 15.00,
    vat_amount DECIMAL(12,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    payment_terms VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'
    assigned_to VARCHAR(255),
    confirmed_at TIMESTAMP,
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales Order Line Items
CREATE TABLE IF NOT EXISTS sales.order_line_items (
    line_item_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES sales.orders(order_id) ON DELETE CASCADE,
    item_code VARCHAR(100),
    description TEXT NOT NULL,
    quantity DECIMAL(10,4) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    vat_rate DECIMAL(5,2) DEFAULT 15.00,
    line_total DECIMAL(12,2) NOT NULL,
    quantity_shipped DECIMAL(10,4) DEFAULT 0.00,
    quantity_invoiced DECIMAL(10,4) DEFAULT 0.00,
    line_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update Customers table with additional fields
ALTER TABLE sales.customers 
    ADD COLUMN IF NOT EXISTS billing_address TEXT,
    ADD COLUMN IF NOT EXISTS shipping_address TEXT,
    ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(100),
    ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(12,2),
    ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50),
    ADD COLUMN IF NOT EXISTS industry VARCHAR(100),
    ADD COLUMN IF NOT EXISTS website VARCHAR(255),
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(255);

-- Link invoices to orders
ALTER TABLE financial.invoices 
    ADD COLUMN IF NOT EXISTS order_id INTEGER REFERENCES sales.orders(order_id);

-- Activity Log (for all sales activities)
CREATE TABLE IF NOT EXISTS sales.activity_log (
    activity_id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL, -- 'lead', 'opportunity', 'quotation', 'order', 'customer'
    entity_id INTEGER NOT NULL,
    activity_type VARCHAR(50) NOT NULL, -- 'call', 'email', 'meeting', 'note', 'status_change'
    subject VARCHAR(255),
    description TEXT,
    activity_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON sales.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON sales.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_next_follow_up ON sales.leads(next_follow_up);

CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON sales.opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_opportunities_customer_id ON sales.opportunities(customer_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_assigned_to ON sales.opportunities(assigned_to);
CREATE INDEX IF NOT EXISTS idx_opportunities_expected_close_date ON sales.opportunities(expected_close_date);

CREATE INDEX IF NOT EXISTS idx_quotations_status ON sales.quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_customer_id ON sales.quotations(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotations_valid_until ON sales.quotations(valid_until);

CREATE INDEX IF NOT EXISTS idx_orders_status ON sales.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON sales.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON sales.orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON sales.orders(delivery_date);

CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON sales.activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_date ON sales.activity_log(activity_date);

-- Add comments for documentation
COMMENT ON TABLE sales.leads IS 'Potential customers in the early stages of the sales pipeline';
COMMENT ON TABLE sales.opportunities IS 'Qualified leads with specific sales opportunities';
COMMENT ON TABLE sales.quotations IS 'Formal price quotes sent to customers';
COMMENT ON TABLE sales.orders IS 'Confirmed customer orders ready for fulfillment';
COMMENT ON TABLE sales.activity_log IS 'Audit trail of all sales activities and interactions';
