#!/bin/bash

# Run Database Migration via EC2 Instance
# This script connects to EC2 and runs migrations from there

set -e

echo "════════════════════════════════════════"
echo "  Run Database Migration via EC2"
echo "════════════════════════════════════════"
echo ""

BACKEND_IP="51.21.219.35"
RDS_PASSWORD="caxMex-0putca-dyjnah"

echo "🗄️  Connecting to backend server to run migrations..."
echo "📍 Backend IP: $BACKEND_IP"
echo ""

# Create the migration SQL script
cat > /tmp/migration.sql << 'SQLEOF'
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

SELECT 'Migration completed successfully!' as status;
SQLEOF

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1: Upload Migration Script to EC2"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Try using AWS EC2 Instance Connect to upload the file
aws ec2-instance-connect send-ssh-public-key \
    --instance-id i-0b20fd06fae7e84b1 \
    --region eu-north-1 \
    --instance-os-user ubuntu \
    --ssh-public-key file://$HOME/.ssh/id_rsa.pub 2>/dev/null || echo "EC2 Instance Connect not available"

# Alternative: Use user data or EC2 Systems Manager
echo "📤 Creating migration command..."

# Save migration as a command that can be run via AWS CLI
cat > /tmp/run-migration.sh << 'BASHEOF'
#!/bin/bash
export PGPASSWORD='caxMex-0putca-dyjnah'

# Install psql if not present
if ! command -v psql &> /dev/null; then
    echo "📦 Installing PostgreSQL client..."
    sudo apt-get update -qq
    sudo apt-get install -y postgresql-client
fi

# Run migration
echo "🔄 Running database migration..."
psql -h aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com \
     -U postgres \
     -d aetheros_erp \
     -f /tmp/migration.sql

echo ""
echo "✅ Migration complete!"
echo ""
echo "📊 Checking tables..."
psql -h aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com \
     -U postgres \
     -d aetheros_erp \
     -c "SELECT schemaname, COUNT(*) as table_count FROM pg_tables WHERE schemaname IN ('sales', 'logistics', 'financial') GROUP BY schemaname;"
BASHEOF

echo "✅ Migration script prepared"
echo ""

echo "════════════════════════════════════════"
echo "   Manual Steps Required"
echo "════════════════════════════════════════"
echo ""
echo "Since we cannot SSH directly, please run these commands manually:"
echo ""
echo "1️⃣  Connect to your EC2 instance via AWS Console:"
echo "    • Go to EC2 → Instances"
echo "    • Select 'aetheros-erp-server'"
echo "    • Click 'Connect' → 'Session Manager'"
echo ""
echo "2️⃣  Once connected, run these commands:"
echo ""
cat << 'COMMANDS'
# Set database password
export PGPASSWORD='caxMex-0putca-dyjnah'

# Install PostgreSQL client (if not installed)
sudo apt-get update && sudo apt-get install -y postgresql-client

# Test connection
psql -h aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com -U postgres -d aetheros_erp -c "SELECT version();"

# Run migration directly
psql -h aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com -U postgres -d aetheros_erp << 'SQL'
CREATE SCHEMA IF NOT EXISTS sales;
CREATE SCHEMA IF NOT EXISTS logistics;
CREATE SCHEMA IF NOT EXISTS financial;

CREATE TABLE IF NOT EXISTS sales.customers (
    customer_id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    vat_number VARCHAR(50),
    customer_type VARCHAR(50),
    source VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS logistics.processed_documents (
    document_id SERIAL PRIMARY KEY,
    document_type VARCHAR(50) NOT NULL,
    extracted_data JSONB,
    confidence_score DECIMAL(5,2),
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS logistics.loads (
    load_id SERIAL PRIMARY KEY,
    load_number VARCHAR(100) NOT NULL UNIQUE,
    customer_id INTEGER REFERENCES sales.customers(customer_id),
    load_date DATE,
    rate DECIMAL(10,2),
    collection_address TEXT,
    delivery_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS financial.invoices (
    invoice_id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(100) NOT NULL UNIQUE,
    customer_id INTEGER REFERENCES sales.customers(customer_id),
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    vat_amount DECIMAL(12,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO sales.customers (company_name, contact_person, status)
VALUES ('4PL.COM - Logistical Solutions Provider', 'TAUFEEQ PETERSEN', 'active')
ON CONFLICT DO NOTHING;

SELECT 'Migration complete!' as status;
SQL

# Verify
psql -h aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com -U postgres -d aetheros_erp -c "\dt sales.*"
psql -h aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com -U postgres -d aetheros_erp -c "\dt logistics.*"
psql -h aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com -U postgres -d aetheros_erp -c "\dt financial.*"

COMMANDS

echo ""
echo "3️⃣  Alternative: I can create a simpler SQL file you can run"
echo ""
echo "Would you like me to:"
echo "  A) Create a single SQL file you can copy-paste"
echo "  B) Guide you through AWS Console Session Manager"
echo "  C) Try another automated method"
echo ""

# Save the migration file locally for easy access
cp /tmp/migration.sql "./database-migration-$(date +%Y%m%d).sql"
echo "📁 Migration SQL saved to: ./database-migration-$(date +%Y%m%d).sql"
echo ""
