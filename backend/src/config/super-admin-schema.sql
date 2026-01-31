-- Super Admin Schema Extensions
-- Adds support for feature flags and enhanced tenant management

-- Feature Flags Table
-- Allows gradual rollout of new features
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_feature_flags_name ON feature_flags(name);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(enabled);

-- Add deleted_at column to tenants (for soft delete)
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Add index for deleted tenants
CREATE INDEX IF NOT EXISTS idx_tenants_deleted_at ON tenants(deleted_at) WHERE deleted_at IS NOT NULL;

-- Insert default feature flags
INSERT INTO feature_flags (name, description, enabled, rollout_percentage) VALUES
  ('advanced_reporting', 'Enable advanced reporting features', true, 100),
  ('ai_insights', 'Enable AI-powered business insights', false, 0),
  ('multi_currency', 'Enable multi-currency support', true, 100),
  ('workflow_automation', 'Enable workflow automation features', true, 50),
  ('mobile_app', 'Enable mobile app access', false, 0),
  ('api_access', 'Enable REST API access for integrations', true, 100),
  ('custom_branding', 'Allow tenants to customize branding', true, 100),
  ('white_label', 'Full white-label capabilities', false, 0),
  ('sso_integration', 'Single Sign-On (SSO) integration', false, 25),
  ('blockchain_audit', 'Blockchain-based audit trail', false, 0)
ON CONFLICT (name) DO NOTHING;

-- Add comments
COMMENT ON TABLE feature_flags IS 'Feature flags for gradual rollout and A/B testing';
COMMENT ON COLUMN feature_flags.rollout_percentage IS 'Percentage of tenants that have access (0-100)';
COMMENT ON COLUMN tenants.deleted_at IS 'Soft delete timestamp for tenant records';

-- Files table (placeholder for storage tracking)
-- This is referenced in super-admin.service.ts
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100),
  module VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for files
CREATE INDEX IF NOT EXISTS idx_files_tenant_id ON files(tenant_id);
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_module ON files(module);

COMMENT ON TABLE files IS 'Tracks uploaded files for storage quota management';
COMMENT ON COLUMN files.file_size IS 'File size in bytes';
