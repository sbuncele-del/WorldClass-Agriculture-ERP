-- Migration: Add tenant settings fields and invitations table
-- Description: Adds additional fields to tenants table for company settings and creates invitations table for team management

-- Add new columns to tenants table if they don't exist
DO $$ 
BEGIN
  -- Company contact information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'company_phone') THEN
    ALTER TABLE tenants ADD COLUMN company_phone VARCHAR(20);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'address') THEN
    ALTER TABLE tenants ADD COLUMN address TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'city') THEN
    ALTER TABLE tenants ADD COLUMN city VARCHAR(100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'province') THEN
    ALTER TABLE tenants ADD COLUMN province VARCHAR(100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'postal_code') THEN
    ALTER TABLE tenants ADD COLUMN postal_code VARCHAR(20);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'country') THEN
    ALTER TABLE tenants ADD COLUMN country VARCHAR(100) DEFAULT 'South Africa';
  END IF;

  -- Registration details
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'tax_number') THEN
    ALTER TABLE tenants ADD COLUMN tax_number VARCHAR(50);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'registration_number') THEN
    ALTER TABLE tenants ADD COLUMN registration_number VARCHAR(50);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'industry') THEN
    ALTER TABLE tenants ADD COLUMN industry VARCHAR(50);
  END IF;

  -- Regional settings
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'timezone') THEN
    ALTER TABLE tenants ADD COLUMN timezone VARCHAR(50) DEFAULT 'Africa/Johannesburg';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'currency') THEN
    ALTER TABLE tenants ADD COLUMN currency VARCHAR(3) DEFAULT 'ZAR';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'fiscal_year_end') THEN
    ALTER TABLE tenants ADD COLUMN fiscal_year_end VARCHAR(5) DEFAULT '12-31';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'logo_url') THEN
    ALTER TABLE tenants ADD COLUMN logo_url TEXT;
  END IF;

  -- Module configuration flags
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'module_sales') THEN
    ALTER TABLE tenants ADD COLUMN module_sales BOOLEAN DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'module_purchase') THEN
    ALTER TABLE tenants ADD COLUMN module_purchase BOOLEAN DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'module_inventory') THEN
    ALTER TABLE tenants ADD COLUMN module_inventory BOOLEAN DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'module_financial') THEN
    ALTER TABLE tenants ADD COLUMN module_financial BOOLEAN DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'module_hr') THEN
    ALTER TABLE tenants ADD COLUMN module_hr BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'module_manufacturing') THEN
    ALTER TABLE tenants ADD COLUMN module_manufacturing BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'module_warehouse') THEN
    ALTER TABLE tenants ADD COLUMN module_warehouse BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'module_assets') THEN
    ALTER TABLE tenants ADD COLUMN module_assets BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'module_practice') THEN
    ALTER TABLE tenants ADD COLUMN module_practice BOOLEAN DEFAULT FALSE;
  END IF;

  -- User status field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'status') THEN
    ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active';
  END IF;
END $$;

-- Create invitations table for team management
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invitations_tenant_id ON invitations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON invitations(expires_at);
CREATE INDEX IF NOT EXISTS idx_tenants_tax_number ON tenants(tax_number) WHERE tax_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_country ON tenants(country);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Add comments
COMMENT ON COLUMN tenants.company_phone IS 'Company contact phone number';
COMMENT ON COLUMN tenants.address IS 'Company street address';
COMMENT ON COLUMN tenants.city IS 'Company city';
COMMENT ON COLUMN tenants.province IS 'Company province/state';
COMMENT ON COLUMN tenants.postal_code IS 'Company postal/zip code';
COMMENT ON COLUMN tenants.country IS 'Company country';
COMMENT ON COLUMN tenants.tax_number IS 'VAT or tax registration number';
COMMENT ON COLUMN tenants.registration_number IS 'Company registration number';
COMMENT ON COLUMN tenants.industry IS 'Industry sector';
COMMENT ON COLUMN tenants.timezone IS 'Default timezone for the tenant';
COMMENT ON COLUMN tenants.currency IS 'Default currency code (ISO 4217)';
COMMENT ON COLUMN tenants.fiscal_year_end IS 'Fiscal year end date (MM-DD format)';
COMMENT ON COLUMN tenants.logo_url IS 'Company logo URL or base64';
COMMENT ON COLUMN tenants.module_sales IS 'Enable Sales & CRM module';
COMMENT ON COLUMN tenants.module_purchase IS 'Enable Purchase module';
COMMENT ON COLUMN tenants.module_inventory IS 'Enable Inventory module';
COMMENT ON COLUMN tenants.module_financial IS 'Enable Financial module';
COMMENT ON COLUMN tenants.module_hr IS 'Enable HR & Payroll module';
COMMENT ON COLUMN tenants.module_manufacturing IS 'Enable Manufacturing module';
COMMENT ON COLUMN tenants.module_warehouse IS 'Enable Warehouse module';
COMMENT ON COLUMN tenants.module_assets IS 'Enable Asset Management module';
COMMENT ON COLUMN tenants.module_practice IS 'Enable Practice Management module';
COMMENT ON COLUMN users.status IS 'User account status (active, invited, suspended)';
COMMENT ON TABLE invitations IS 'Team member invitations';
