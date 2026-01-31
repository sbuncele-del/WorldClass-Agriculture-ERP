-- Create missing asset tables

-- Asset Depreciation Schedule table
CREATE TABLE IF NOT EXISTS asset_depreciation_schedule (
    schedule_id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES fixed_assets(asset_id),
    depreciation_date DATE NOT NULL,
    depreciation_amount DECIMAL(15,2),
    accumulated_depreciation DECIMAL(15,2),
    net_book_value DECIMAL(15,2),
    depreciation_method VARCHAR(50),
    period_number INTEGER,
    fiscal_year INTEGER,
    fiscal_period INTEGER,
    posted_to_gl BOOLEAN DEFAULT FALSE,
    journal_entry_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- Asset Disposals table
CREATE TABLE IF NOT EXISTS asset_disposals (
    disposal_id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES fixed_assets(asset_id),
    disposal_date DATE NOT NULL,
    disposal_method VARCHAR(50),
    disposal_reason TEXT,
    proceeds DECIMAL(15,2) DEFAULT 0,
    book_value_at_disposal DECIMAL(15,2),
    gain_loss DECIMAL(15,2),
    buyer_name VARCHAR(255),
    buyer_contact TEXT,
    disposal_number VARCHAR(50),
    approved_by UUID,
    approved_at TIMESTAMP,
    posted_to_gl BOOLEAN DEFAULT FALSE,
    journal_entry_id INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_asset_depreciation_asset ON asset_depreciation_schedule(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_depreciation_date ON asset_depreciation_schedule(depreciation_date);
CREATE INDEX IF NOT EXISTS idx_asset_disposals_asset ON asset_disposals(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_disposals_date ON asset_disposals(disposal_date);

SELECT 'Asset tables created' as status;
