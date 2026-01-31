-- =====================================================
-- FIX: Create sales schema and customers table
-- Required for Logistics module integration
-- =====================================================

-- Create sales schema if not exists
CREATE SCHEMA IF NOT EXISTS sales;

-- Customers Table
CREATE TABLE IF NOT EXISTS sales.customers (
    customer_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    customer_code VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    vat_number VARCHAR(50),
    customer_type VARCHAR(50) DEFAULT 'retail',
    source VARCHAR(100),
    billing_address TEXT,
    shipping_address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'South Africa',
    payment_terms VARCHAR(100),
    credit_limit DECIMAL(12,2) DEFAULT 0.00,
    tax_id VARCHAR(50),
    industry VARCHAR(100),
    website VARCHAR(255),
    notes TEXT,
    assigned_to VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sales_customers_tenant ON sales.customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_customers_status ON sales.customers(status);
CREATE INDEX IF NOT EXISTS idx_sales_customers_name ON sales.customers(name);

-- Add sample customers for the SiyaBusa tenant
INSERT INTO sales.customers (tenant_id, customer_code, name, company_name, contact_person, email, phone, city, status)
VALUES 
    ('d0a49212-96f5-46c7-9d69-fec0f235a90c', 'CUST001', 'Pick n Pay Stores', 'Pick n Pay Holdings', 'John Smith', 'procurement@pnp.co.za', '+27 11 555 0001', 'Johannesburg', 'active'),
    ('d0a49212-96f5-46c7-9d69-fec0f235a90c', 'CUST002', 'Shoprite Checkers', 'Shoprite Holdings Ltd', 'Sarah Williams', 'orders@shoprite.co.za', '+27 21 555 0002', 'Cape Town', 'active'),
    ('d0a49212-96f5-46c7-9d69-fec0f235a90c', 'CUST003', 'Woolworths SA', 'Woolworths Holdings', 'Mike Johnson', 'supply@woolworths.co.za', '+27 11 555 0003', 'Johannesburg', 'active'),
    ('d0a49212-96f5-46c7-9d69-fec0f235a90c', 'CUST004', 'Builders Warehouse', 'Massmart Holdings', 'Lisa Davis', 'orders@builderswarehouse.co.za', '+27 11 555 0004', 'Johannesburg', 'active'),
    ('d0a49212-96f5-46c7-9d69-fec0f235a90c', 'CUST005', 'Dis-Chem Pharmacies', 'Dis-Chem Pharmacies Ltd', 'Peter Brown', 'procurement@dischem.co.za', '+27 11 555 0005', 'Midrand', 'active'),
    ('d0a49212-96f5-46c7-9d69-fec0f235a90c', 'CUST006', 'Spar Group', 'Spar Group Ltd', 'Emma Wilson', 'orders@spar.co.za', '+27 31 555 0006', 'Durban', 'active'),
    ('d0a49212-96f5-46c7-9d69-fec0f235a90c', 'CUST007', 'Game Stores', 'Massmart Holdings', 'David Taylor', 'supply@game.co.za', '+27 11 555 0007', 'Johannesburg', 'active'),
    ('d0a49212-96f5-46c7-9d69-fec0f235a90c', 'CUST008', 'Makro SA', 'Massmart Holdings', 'Rachel Green', 'orders@makro.co.za', '+27 11 555 0008', 'Johannesburg', 'active'),
    ('d0a49212-96f5-46c7-9d69-fec0f235a90c', 'CUST009', 'Clicks Group', 'Clicks Group Ltd', 'Tom Anderson', 'procurement@clicks.co.za', '+27 21 555 0009', 'Cape Town', 'active'),
    ('d0a49212-96f5-46c7-9d69-fec0f235a90c', 'CUST010', 'Mr Price Group', 'Mr Price Group Ltd', 'Susan White', 'supply@mrprice.co.za', '+27 31 555 0010', 'Durban', 'active')
ON CONFLICT DO NOTHING;

SELECT 'Sales customers table created and seeded!' as result;
