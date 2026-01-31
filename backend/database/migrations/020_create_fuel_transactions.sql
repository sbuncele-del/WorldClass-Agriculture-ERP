-- Create logistics_fuel_transactions table
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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_date ON logistics_fuel_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_vehicle ON logistics_fuel_transactions(vehicle);
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_supplier ON logistics_fuel_transactions(supplier);
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_journal ON logistics_fuel_transactions(journal_entry_id);

-- Add comment
COMMENT ON TABLE logistics_fuel_transactions IS 'Stores fuel purchase transactions linked to financial journal entries';
