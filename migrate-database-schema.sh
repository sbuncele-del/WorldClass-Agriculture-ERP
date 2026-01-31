#!/bin/bash

# Migrate Database Schema to RDS
# This script creates all necessary tables and schemas in your RDS database

set -e

echo "════════════════════════════════════════"
echo "  Migrate Database Schema to RDS"
echo "════════════════════════════════════════"
echo ""

RDS_ENDPOINT="aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com"
RDS_PORT="5432"
RDS_USER="postgres"
RDS_DATABASE="aetheros_erp"
BACKEND_IP="51.21.219.35"
SSH_KEY="$HOME/.ssh/worldclass-erp-key.pem"

echo "🗄️  Database: $RDS_DATABASE"
echo "📍 Endpoint: $RDS_ENDPOINT"
echo ""

read -p "Enter your RDS database password: " -s RDS_PASSWORD
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1: Check Existing Schema"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

PGPASSWORD=$RDS_PASSWORD psql -h $RDS_ENDPOINT -U $RDS_USER -d $RDS_DATABASE << 'SQL'
-- Check existing schemas
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
ORDER BY schema_name;
SQL

echo ""
read -p "Do you want to create/update the ERP schemas? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Schema migration cancelled"
    exit 0
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2: Create Schemas"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

PGPASSWORD=$RDS_PASSWORD psql -h $RDS_ENDPOINT -U $RDS_USER -d $RDS_DATABASE << 'SQL'
-- Create ERP schemas
CREATE SCHEMA IF NOT EXISTS sales;
CREATE SCHEMA IF NOT EXISTS logistics;
CREATE SCHEMA IF NOT EXISTS financial;
CREATE SCHEMA IF NOT EXISTS hr;
CREATE SCHEMA IF NOT EXISTS inventory;
CREATE SCHEMA IF NOT EXISTS manufacturing;
CREATE SCHEMA IF NOT EXISTS purchasing;
CREATE SCHEMA IF NOT EXISTS warehouse;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant permissions
GRANT ALL ON SCHEMA sales TO postgres;
GRANT ALL ON SCHEMA logistics TO postgres;
GRANT ALL ON SCHEMA financial TO postgres;
GRANT ALL ON SCHEMA hr TO postgres;
GRANT ALL ON SCHEMA inventory TO postgres;
GRANT ALL ON SCHEMA manufacturing TO postgres;
GRANT ALL ON SCHEMA purchasing TO postgres;
GRANT ALL ON SCHEMA warehouse TO postgres;

SELECT '✅ Schemas created successfully' as status;
SQL

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 3: Create Core Tables"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create minimal tables needed for document processing
PGPASSWORD=$RDS_PASSWORD psql -h $RDS_ENDPOINT -U $RDS_USER -d $RDS_DATABASE << 'SQL'
-- Sales: Customers table
CREATE TABLE IF NOT EXISTS sales.customers (
    customer_id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    vat_number VARCHAR(50),
    customer_type VARCHAR(50),
    source VARCHAR(100),
    created_from_document VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Logistics: Processed Documents table
CREATE TABLE IF NOT EXISTS logistics.processed_documents (
    document_id SERIAL PRIMARY KEY,
    document_type VARCHAR(50) NOT NULL,
    document_number VARCHAR(100),
    s3_key VARCHAR(500),
    extracted_data JSONB,
    confidence_score DECIMAL(5,2),
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_by VARCHAR(100)
);

-- Logistics: Loads table
CREATE TABLE IF NOT EXISTS logistics.loads (
    load_id SERIAL PRIMARY KEY,
    load_number VARCHAR(100) NOT NULL UNIQUE,
    customer_id INTEGER REFERENCES sales.customers(customer_id),
    load_date DATE,
    offload_date DATE,
    driver_name VARCHAR(255),
    vehicle_registration VARCHAR(50),
    commodity VARCHAR(255),
    rate DECIMAL(10,2),
    rate_type VARCHAR(20),
    quantity DECIMAL(10,4),
    load_value DECIMAL(12,2),
    collection_address TEXT,
    delivery_address TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Financial: Invoices table
CREATE TABLE IF NOT EXISTS financial.invoices (
    invoice_id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(100) NOT NULL UNIQUE,
    customer_id INTEGER REFERENCES sales.customers(customer_id),
    load_id INTEGER REFERENCES logistics.loads(load_id),
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    reference VARCHAR(255),
    subtotal DECIMAL(12,2) NOT NULL,
    vat_rate DECIMAL(5,2) DEFAULT 15.00,
    vat_amount DECIMAL(12,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    payment_terms VARCHAR(100),
    status VARCHAR(20) DEFAULT 'draft',
    pdf_s3_key VARCHAR(500),
    sent_at TIMESTAMP,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Financial: Invoice Line Items table
CREATE TABLE IF NOT EXISTS financial.invoice_line_items (
    line_item_id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES financial.invoices(invoice_id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10,4) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    vat_rate DECIMAL(5,2) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    line_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_company_name ON sales.customers(company_name);
CREATE INDEX IF NOT EXISTS idx_loads_load_number ON logistics.loads(load_number);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON financial.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON financial.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON financial.invoices(invoice_date);

SELECT '✅ Core tables created successfully' as status;
SQL

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 4: Insert Sample Data (Optional)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Do you want to insert sample customer data? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    PGPASSWORD=$RDS_PASSWORD psql -h $RDS_ENDPOINT -U $RDS_USER -d $RDS_DATABASE << 'SQL'
    -- Insert sample customer (4PL.COM from your document)
    INSERT INTO sales.customers (
        company_name, 
        contact_person, 
        email, 
        phone, 
        vat_number,
        customer_type,
        source,
        status
    ) VALUES (
        '4PL.COM - Logistical Solutions Provider',
        'TAUFEEQ PETERSEN',
        'taufeeq@4pl.com',
        '021-xxx-xxxx',
        '4PL-VAT-12345',
        'logistics_broker',
        'manual',
        'active'
    ) ON CONFLICT DO NOTHING;

    SELECT '✅ Sample data inserted' as status;
SQL
    echo "✅ Sample customer created"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 5: Verify Migration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

PGPASSWORD=$RDS_PASSWORD psql -h $RDS_ENDPOINT -U $RDS_USER -d $RDS_DATABASE << 'SQL'
-- Count tables per schema
SELECT 
    schemaname as schema, 
    COUNT(*) as table_count 
FROM pg_tables 
WHERE schemaname IN ('sales', 'logistics', 'financial', 'hr', 'inventory', 'manufacturing', 'purchasing', 'warehouse')
GROUP BY schemaname
ORDER BY schemaname;

-- List all ERP tables
SELECT 
    schemaname || '.' || tablename as full_table_name
FROM pg_tables 
WHERE schemaname IN ('sales', 'logistics', 'financial')
ORDER BY schemaname, tablename;

-- Check customer count
SELECT 
    'Total customers: ' || COUNT(*) as info
FROM sales.customers;
SQL

echo ""
echo "════════════════════════════════════════"
echo "   ✅ DATABASE MIGRATION COMPLETE!"
echo "════════════════════════════════════════"
echo ""
echo "📊 Database Ready:"
echo "   • Schemas: sales, logistics, financial, hr, inventory, etc."
echo "   • Core tables: customers, loads, invoices, processed_documents"
echo "   • Indexes: Optimized for performance"
echo "   • Sample data: Ready for testing"
echo ""
echo "🎯 Next Steps:"
echo "   1. Test document upload: Upload a load confirmation"
echo "   2. Check extraction: Verify data in processed_documents table"
echo "   3. Create customer: Should insert into sales.customers"
echo "   4. Generate invoice: Should insert into financial.invoices"
echo ""
echo "🔍 Test Connection:"
echo "   psql -h $RDS_ENDPOINT -U $RDS_USER -d $RDS_DATABASE"
echo ""
