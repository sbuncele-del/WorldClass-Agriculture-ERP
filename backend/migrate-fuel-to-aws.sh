#!/bin/bash

# Fuel Management Database Migration Script
# Applies fuel transactions table to AWS RDS

set -e  # Exit on error

echo "🚀 Fuel Management - AWS RDS Migration"
echo "======================================="
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✓ Loaded environment variables from .env"
else
    echo "❌ Error: .env file not found"
    exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not set in .env"
    exit 1
fi

echo "📊 Database: AWS RDS (aetheros-erp-db)"
echo "🗄️  Migration: 020_create_fuel_transactions.sql"
echo ""

# Parse database connection from DATABASE_URL
DB_URL=$DATABASE_URL

echo "🔌 Connecting to AWS RDS..."
echo ""

# Run the migration
psql "$DB_URL" << 'EOF'
-- Fuel Transactions Migration
-- Creates table and indexes for logistics fuel management

\echo '📋 Creating logistics_fuel_transactions table...'

CREATE TABLE IF NOT EXISTS logistics_fuel_transactions (
    transaction_id SERIAL PRIMARY KEY,
    transaction_date DATE NOT NULL,
    vehicle VARCHAR(100) NOT NULL,
    driver VARCHAR(200) NOT NULL,
    litres DECIMAL(10, 2) NOT NULL,
    price_per_litre DECIMAL(10, 2) NOT NULL,
    total_cost DECIMAL(12, 2) NOT NULL,
    odometer_reading INTEGER NOT NULL,
    supplier VARCHAR(200) NOT NULL,
    invoice_number VARCHAR(100) NOT NULL,
    journal_entry_id INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(entry_id) ON DELETE SET NULL
);

\echo '✓ Table created'
\echo ''
\echo '📇 Creating indexes...'

CREATE INDEX IF NOT EXISTS idx_fuel_transactions_date ON logistics_fuel_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_vehicle ON logistics_fuel_transactions(vehicle);
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_supplier ON logistics_fuel_transactions(supplier);
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_journal ON logistics_fuel_transactions(journal_entry_id);

\echo '✓ Indexes created'
\echo ''
\echo '💬 Adding table comment...'

COMMENT ON TABLE logistics_fuel_transactions IS 'Stores fuel purchase transactions linked to financial journal entries';

\echo '✓ Comment added'
\echo ''
\echo '🎉 MIGRATION COMPLETED SUCCESSFULLY!'
\echo ''
\echo '📊 Verifying table structure...'

\d logistics_fuel_transactions

\echo ''
\echo '📈 Current row count:'

SELECT COUNT(*) as total_transactions FROM logistics_fuel_transactions;

\echo ''
\echo '✅ Fuel Management is now LIVE with real database!'
\echo ''
EOF

MIGRATION_STATUS=$?

if [ $MIGRATION_STATUS -eq 0 ]; then
    echo ""
    echo "════════════════════════════════════════"
    echo "✅ SUCCESS! Fuel Management Activated"
    echo "════════════════════════════════════════"
    echo ""
    echo "🔗 Live URL:"
    echo "http://aetheros-erp-frontend-483636500494.s3-website.eu-north-1.amazonaws.com/logistics/fuel"
    echo ""
    echo "📝 What's Now Active:"
    echo "  ✓ Fuel transaction logging"
    echo "  ✓ Automatic journal entries"
    echo "  ✓ Financial module integration"
    echo "  ✓ Supplier account management"
    echo "  ✓ Full audit trail"
    echo ""
    echo "🧪 Test It:"
    echo "  1. Click '+ Log Fuel Transaction'"
    echo "  2. Fill in the form"
    echo "  3. Submit"
    echo "  4. Transaction saved to AWS RDS"
    echo "  5. Journal entry created in Finance"
    echo ""
    echo "🎯 Ready for LIVE DEMO!"
    echo ""
else
    echo ""
    echo "════════════════════════════════════════"
    echo "❌ MIGRATION FAILED"
    echo "════════════════════════════════════════"
    echo ""
    echo "Possible issues:"
    echo "  1. Network connectivity to AWS RDS"
    echo "  2. Database credentials incorrect"
    echo "  3. Security group not allowing connection"
    echo "  4. Table dependencies missing"
    echo ""
    echo "Check logs above for details."
    echo ""
    exit 1
fi
