-- Missing Database Tables/Columns for Cash Management
-- Run this on AWS RDS to fix endpoint errors

-- 1. Create tenant_settings table
CREATE TABLE IF NOT EXISTS tenant_settings (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT,
  data_type VARCHAR(20) DEFAULT 'string',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, setting_key)
);

CREATE INDEX idx_tenant_settings_tenant ON tenant_settings(tenant_id);
CREATE INDEX idx_tenant_settings_key ON tenant_settings(setting_key);

-- Insert default tolerance settings
INSERT INTO tenant_settings (tenant_id, setting_key, setting_value, data_type) 
SELECT 
  id as tenant_id,
  'cash_management.amount_tolerance' as setting_key,
  '10.00' as setting_value,
  'decimal' as data_type
FROM tenants
ON CONFLICT (tenant_id, setting_key) DO NOTHING;

INSERT INTO tenant_settings (tenant_id, setting_key, setting_value, data_type) 
SELECT 
  id as tenant_id,
  'cash_management.percentage_tolerance' as setting_key,
  '2.0' as setting_value,
  'decimal' as data_type
FROM tenants
ON CONFLICT (tenant_id, setting_key) DO NOTHING;

INSERT INTO tenant_settings (tenant_id, setting_key, setting_value, data_type) 
SELECT 
  id as tenant_id,
  'cash_management.max_difference' as setting_key,
  '1000.00' as setting_value,
  'decimal' as data_type
FROM tenants
ON CONFLICT (tenant_id, setting_key) DO NOTHING;

-- 2. Add full_name column to users table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE users ADD COLUMN full_name VARCHAR(200);
    -- Populate from first_name + last_name if they exist
    UPDATE users SET full_name = CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')) 
    WHERE full_name IS NULL;
  END IF;
END $$;

-- 3. Add match_status column to bank_reconciliation_matches (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bank_reconciliation_matches' AND column_name = 'match_status'
  ) THEN
    ALTER TABLE bank_reconciliation_matches 
    ADD COLUMN match_status VARCHAR(20) DEFAULT 'ACTIVE' 
    CHECK (match_status IN ('ACTIVE', 'PENDING', 'REVERSED', 'UNMATCHED'));
    
    -- Set existing records to ACTIVE
    UPDATE bank_reconciliation_matches SET match_status = 'ACTIVE' WHERE match_status IS NULL;
  END IF;
END $$;

-- 4. Verify bank_statement_lines has statement_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bank_statement_lines' AND column_name = 'statement_id'
  ) THEN
    ALTER TABLE bank_statement_lines 
    ADD COLUMN statement_id INTEGER REFERENCES bank_statements(id) ON DELETE CASCADE;
    
    CREATE INDEX idx_bank_statement_lines_statement ON bank_statement_lines(statement_id);
  END IF;
END $$;

-- Done!
SELECT 'Missing tables/columns created successfully!' as status;
