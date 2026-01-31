-- Add onboarding tracking columns to tenants table

ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}'::jsonb;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_tenants_onboarding_completed ON tenants(onboarding_completed);

-- Add comment
COMMENT ON COLUMN tenants.onboarding_completed IS 'Whether tenant has completed onboarding wizard';
COMMENT ON COLUMN tenants.onboarding_step IS 'Current step in onboarding process (1-5)';
COMMENT ON COLUMN tenants.onboarding_data IS 'JSON data from onboarding wizard (industry, modules, settings, etc.)';
