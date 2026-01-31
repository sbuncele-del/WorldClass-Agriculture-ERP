-- ============================================================================
-- FIX ASSET SCHEMA FOR GL POSTING
-- ============================================================================
-- Add missing columns needed for IAS 16 GL posting automation
-- ============================================================================

-- Add missing columns to fixed_assets table
ALTER TABLE fixed_assets 
ADD COLUMN IF NOT EXISTS acquisition_method VARCHAR(50) DEFAULT 'CASH',
ADD COLUMN IF NOT EXISTS journal_entry_id INTEGER,
ADD COLUMN IF NOT EXISTS posted_to_gl BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS posted_at TIMESTAMP;

-- Add constraint for acquisition_method
ALTER TABLE fixed_assets 
DROP CONSTRAINT IF EXISTS chk_acquisition_method;

ALTER TABLE fixed_assets 
ADD CONSTRAINT chk_acquisition_method 
CHECK (acquisition_method IN ('PURCHASE', 'CASH', 'DONATION', 'TRANSFER', 'LEASE', 'CONSTRUCTION'));

-- Add missing columns to asset_depreciation_schedule
ALTER TABLE asset_depreciation_schedule
ADD COLUMN IF NOT EXISTS period_number INTEGER;

-- Add missing columns to asset_maintenance
ALTER TABLE asset_maintenance
ADD COLUMN IF NOT EXISTS journal_entry_id INTEGER;

-- Add missing columns to asset_revaluations  
ALTER TABLE asset_revaluations
ADD COLUMN IF NOT EXISTS posted_at TIMESTAMP;

-- Add missing columns to asset_disposals
ALTER TABLE asset_disposals
ADD COLUMN IF NOT EXISTS posted_at TIMESTAMP;

-- Add missing columns to asset_impairments
ALTER TABLE asset_impairments
ADD COLUMN IF NOT EXISTS posted_at TIMESTAMP;

-- Create indexes for journal_entry_id lookups
CREATE INDEX IF NOT EXISTS idx_fixed_assets_journal ON fixed_assets(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_journal ON asset_maintenance(journal_entry_id);

-- Update existing assets to have acquisition_method based on available data
UPDATE fixed_assets
SET acquisition_method = CASE
    WHEN supplier_id IS NOT NULL THEN 'PURCHASE'
    WHEN purchase_order_number IS NOT NULL THEN 'PURCHASE'
    WHEN funding_source IS NOT NULL AND funding_source != '' THEN 'PURCHASE'
    ELSE 'CASH'
END
WHERE acquisition_method IS NULL OR acquisition_method = 'CASH';

\echo 'Asset schema fixed - added GL posting columns'
\echo 'Columns added:'
\echo '  - fixed_assets: acquisition_method, journal_entry_id, posted_to_gl, posted_at'
\echo '  - asset_depreciation_schedule: period_number'
\echo '  - asset_maintenance: journal_entry_id'
\echo '  - asset_revaluations: posted_at'
\echo '  - asset_disposals: posted_at'
\echo '  - asset_impairments: posted_at'
