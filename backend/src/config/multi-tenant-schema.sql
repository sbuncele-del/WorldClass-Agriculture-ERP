-- ================================================
-- MULTI-TENANT DATABASE SCHEMA
-- AetherOS ERP - Production Ready
-- ================================================

-- ================================================
-- 1. TENANTS TABLE (Organizations/Companies)
-- ================================================
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL, -- URL-friendly identifier (e.g., 'acme-corp')
    domain VARCHAR(255), -- Optional custom domain
    
    -- Subscription & Billing
    status VARCHAR(50) DEFAULT 'trial', -- trial, active, suspended, cancelled
    subscription_plan VARCHAR(50) DEFAULT 'starter', -- starter, professional, enterprise
    subscription_status VARCHAR(50) DEFAULT 'trialing', -- trialing, active, past_due, cancelled
    trial_ends_at TIMESTAMP,
    subscription_starts_at TIMESTAMP,
    subscription_ends_at TIMESTAMP,
    
    -- Billing Information
    billing_email VARCHAR(255),
    billing_cycle VARCHAR(20) DEFAULT 'monthly', -- monthly, annual
    billing_day INTEGER DEFAULT 1, -- Day of month for billing
    next_billing_date TIMESTAMP,
    
    -- Limits
    max_users INTEGER DEFAULT 5,
    max_storage_gb INTEGER DEFAULT 5,
    
    -- Features (JSON flags)
    features JSONB DEFAULT '{
        "ai_automation": false,
        "multi_currency": false,
        "advanced_reporting": false,
        "api_access": false,
        "custom_branding": false
    }'::jsonb,
    
    -- Settings (JSON configuration)
    settings JSONB DEFAULT '{
        "currency": "ZAR",
        "date_format": "DD/MM/YYYY",
        "timezone": "Africa/Johannesburg",
        "financial_year_end": "02-28"
    }'::jsonb,
    
    -- Company Information
    company_info JSONB DEFAULT '{
        "registration_number": "",
        "vat_number": "",
        "address": "",
        "city": "",
        "province": "",
        "postal_code": "",
        "country": "ZA",
        "phone": "",
        "website": ""
    }'::jsonb,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP, -- Soft delete
    
    CONSTRAINT valid_status CHECK (status IN ('trial', 'active', 'suspended', 'cancelled', 'deleted')),
    CONSTRAINT valid_plan CHECK (subscription_plan IN ('starter', 'professional', 'enterprise')),
    CONSTRAINT valid_billing_cycle CHECK (billing_cycle IN ('monthly', 'annual'))
);

CREATE INDEX idx_tenants_status ON tenants(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenants_slug ON tenants(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenants_subscription_status ON tenants(subscription_status);

-- ================================================
-- 2. USERS TABLE (All users across all tenants)
-- ================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Authentication
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Profile
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    avatar_url VARCHAR(500),
    
    -- Authorization
    role VARCHAR(50) DEFAULT 'user', -- super_admin, admin, manager, user, viewer
    permissions JSONB DEFAULT '[]'::jsonb, -- Array of specific permissions
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, suspended, invited
    email_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP,
    
    -- Security
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(50),
    password_changed_at TIMESTAMP DEFAULT NOW(),
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    
    -- Tokens
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires_at TIMESTAMP,
    
    -- Preferences
    preferences JSONB DEFAULT '{
        "language": "en",
        "theme": "light",
        "notifications": {
            "email": true,
            "sms": false,
            "push": true
        }
    }'::jsonb,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,
    
    CONSTRAINT valid_role CHECK (role IN ('super_admin', 'admin', 'manager', 'user', 'viewer')),
    CONSTRAINT valid_user_status CHECK (status IN ('active', 'inactive', 'suspended', 'invited')),
    UNIQUE(tenant_id, email) -- Email unique per tenant
);

CREATE INDEX idx_users_tenant_email ON users(tenant_id, email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status ON users(tenant_id, status);
CREATE INDEX idx_users_role ON users(tenant_id, role);

-- ================================================
-- 3. DEMO TENANTS TABLE (Auto-reset demo accounts)
-- ================================================
CREATE TABLE IF NOT EXISTS demo_tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID UNIQUE NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Reset Configuration
    reset_interval_hours INTEGER DEFAULT 24,
    last_reset_at TIMESTAMP DEFAULT NOW(),
    next_reset_at TIMESTAMP,
    auto_reset_enabled BOOLEAN DEFAULT true,
    
    -- Access Configuration
    is_public BOOLEAN DEFAULT true,
    access_code VARCHAR(50), -- Optional password for demo access
    max_concurrent_users INTEGER DEFAULT 100,
    
    -- Demo Settings
    demo_type VARCHAR(50) DEFAULT 'full', -- full, limited, guided
    sample_data_size VARCHAR(20) DEFAULT 'medium', -- small, medium, large
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_demo_tenants_reset ON demo_tenants(next_reset_at) WHERE auto_reset_enabled = true;

-- ================================================
-- 4. REFRESH TOKENS TABLE (JWT refresh tokens)
-- ================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    
    -- Device Information
    device_info JSONB DEFAULT '{
        "user_agent": "",
        "ip_address": "",
        "device_type": ""
    }'::jsonb,
    
    revoked BOOLEAN DEFAULT false,
    revoked_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token) WHERE revoked = false;
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at) WHERE revoked = false;

-- ================================================
-- 5. AUDIT LOG TABLE (Track all important actions)
-- ================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Action Details
    action VARCHAR(100) NOT NULL, -- create, update, delete, login, logout, etc.
    resource_type VARCHAR(100), -- tenant, user, invoice, journal_entry, etc.
    resource_id VARCHAR(255),
    
    -- Changes
    old_values JSONB,
    new_values JSONB,
    
    -- Context
    ip_address VARCHAR(50),
    user_agent TEXT,
    request_id VARCHAR(100),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_log_tenant ON audit_log(tenant_id, created_at DESC);
CREATE INDEX idx_audit_log_user ON audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);

-- ================================================
-- 6. FUNCTIONS & TRIGGERS
-- ================================================

-- Updated timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tenants
DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply updated_at trigger to users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 7. INITIAL DATA - CREATE DEMO TENANT
-- ================================================

-- Insert demo tenant (fixed UUID for consistency)
INSERT INTO tenants (
    id,
    name,
    slug,
    status,
    subscription_plan,
    subscription_status,
    max_users,
    features,
    settings
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'AetherOS Demo Company',
    'demo',
    'active',
    'enterprise',
    'active',
    9999,
    '{"ai_automation": true, "multi_currency": true, "advanced_reporting": true, "api_access": true, "custom_branding": true}'::jsonb,
    '{"currency": "ZAR", "date_format": "DD/MM/YYYY", "timezone": "Africa/Johannesburg", "financial_year_end": "02-28"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Create demo tenant record
INSERT INTO demo_tenants (
    tenant_id,
    reset_interval_hours,
    is_public,
    auto_reset_enabled,
    demo_type,
    sample_data_size
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    24,
    true,
    true,
    'full',
    'large'
) ON CONFLICT (tenant_id) DO NOTHING;

-- Create demo admin user
INSERT INTO users (
    id,
    tenant_id,
    email,
    password_hash,
    first_name,
    last_name,
    role,
    status,
    email_verified
) VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'demo@aetheros.co.za',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- Password: Demo123!
    'Demo',
    'User',
    'admin',
    'active',
    true
) ON CONFLICT (tenant_id, email) DO NOTHING;

-- ================================================
-- 8. VIEWS FOR COMMON QUERIES
-- ================================================

-- Active tenants view
CREATE OR REPLACE VIEW active_tenants AS
SELECT 
    t.*,
    COUNT(DISTINCT u.id) as user_count,
    MAX(u.last_login_at) as last_activity
FROM tenants t
LEFT JOIN users u ON t.id = u.tenant_id AND u.deleted_at IS NULL
WHERE t.status = 'active' AND t.deleted_at IS NULL
GROUP BY t.id;

-- Tenant subscription status view
CREATE OR REPLACE VIEW tenant_subscriptions AS
SELECT 
    t.id as tenant_id,
    t.name as tenant_name,
    t.slug,
    t.subscription_plan,
    t.subscription_status,
    t.trial_ends_at,
    t.next_billing_date,
    t.billing_cycle,
    CASE 
        WHEN t.status = 'trial' AND t.trial_ends_at < NOW() THEN 'expired_trial'
        WHEN t.status = 'trial' THEN 'in_trial'
        WHEN t.subscription_status = 'active' THEN 'active_subscription'
        WHEN t.subscription_status = 'past_due' THEN 'payment_overdue'
        ELSE 'inactive'
    END as billing_status,
    CASE 
        WHEN t.status = 'trial' THEN EXTRACT(EPOCH FROM (t.trial_ends_at - NOW())) / 86400
        ELSE NULL
    END as trial_days_remaining
FROM tenants t
WHERE t.deleted_at IS NULL;

-- ================================================
-- MIGRATION COMPLETE
-- ================================================

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Multi-tenant database schema migration completed successfully!';
    RAISE NOTICE 'Created tables: tenants, users, demo_tenants, refresh_tokens, audit_log';
    RAISE NOTICE 'Added tenant_id to all existing tables';
    RAISE NOTICE 'Created indexes for performance';
    RAISE NOTICE 'Demo tenant created with ID: 00000000-0000-0000-0000-000000000001';
    RAISE NOTICE 'Demo user: demo@aetheros.co.za (Password: Demo123!)';
END $$;
