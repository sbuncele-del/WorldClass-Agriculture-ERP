-- Fix Missing Database Tables and Columns
-- Run this on AWS RDS PostgreSQL database

-- 1. Create tenant_settings table
CREATE TABLE IF NOT EXISTS tenant_settings (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT,
  data_type VARCHAR(20) DEFAULT 'STRING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, setting_key)
);

CREATE INDEX IF NOT EXISTS idx_tenant_settings_tenant ON tenant_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_settings_key ON tenant_settings(setting_key);

-- Insert default tolerance settings
INSERT INTO tenant_settings (tenant_id, setting_key, setting_value, data_type)
SELECT 
  id as tenant_id,
  'reconciliation_amount_tolerance',
  '10.00',
  'DECIMAL'
FROM tenants
ON CONFLICT (tenant_id, setting_key) DO NOTHING;

INSERT INTO tenant_settings (tenant_id, setting_key, setting_value, data_type)
SELECT 
  id as tenant_id,
  'reconciliation_percentage_tolerance',
  '2.0',
  'DECIMAL'
FROM tenants
ON CONFLICT (tenant_id, setting_key) DO NOTHING;

INSERT INTO tenant_settings (tenant_id, setting_key, setting_value, data_type)
SELECT 
  id as tenant_id,
  'reconciliation_max_difference',
  '1000.00',
  'DECIMAL'
FROM tenants
ON CONFLICT (tenant_id, setting_key) DO NOTHING;

-- 2. Add full_name column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(200);

-- Update full_name from existing first_name and last_name if they exist
UPDATE users 
SET full_name = CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))
WHERE full_name IS NULL AND (first_name IS NOT NULL OR last_name IS NOT NULL);

-- If no first/last name, use email
UPDATE users 
SET full_name = email
WHERE full_name IS NULL OR full_name = ' ';

-- 3. Add match_status column to bank_reconciliation_matches
ALTER TABLE bank_reconciliation_matches ADD COLUMN IF NOT EXISTS match_status VARCHAR(20) DEFAULT 'MATCHED';

-- Update existing records
UPDATE bank_reconciliation_matches 
SET match_status = 'MATCHED'
WHERE match_status IS NULL;

-- 4. Verify bank_statement_lines has statement_id
-- (This should already exist, but let's make sure)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bank_statement_lines' 
        AND column_name = 'statement_id'
    ) THEN
        ALTER TABLE bank_statement_lines 
        ADD COLUMN statement_id INTEGER REFERENCES bank_statements(id) ON DELETE CASCADE;
        
        CREATE INDEX idx_bank_statement_lines_statement ON bank_statement_lines(statement_id);
    END IF;
END $$;

-- Done!
SELECT 'Database schema fixed successfully!' as status;
