-- ============================================================================
-- ADMIN MODULE - DATABASE SCHEMA
-- Worldclass ERP Software
-- Created: November 13, 2025
-- ============================================================================

-- ============================================================================
-- 1. USER MANAGEMENT
-- ============================================================================

-- Users (Authentication & Profile)
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    -- Authentication
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE,
    
    -- Profile
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200),
    phone VARCHAR(50),
    avatar_url VARCHAR(500),
    
    -- Security
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    email_verified_at TIMESTAMP,
    
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    last_password_change TIMESTAMP,
    password_expires_at TIMESTAMP,
    
    -- MFA
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret VARCHAR(255),
    mfa_backup_codes TEXT[],
    
    -- Session Management
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(50),
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    
    -- Preferences
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(100) DEFAULT 'Africa/Johannesburg',
    date_format VARCHAR(50) DEFAULT 'YYYY-MM-DD',
    theme VARCHAR(20) DEFAULT 'light',
    
    -- Employee Link
    employee_id INTEGER, -- Link to HR employee if applicable
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_super_admin BOOLEAN DEFAULT false,
    account_suspended BOOLEAN DEFAULT false,
    suspension_reason TEXT,
    suspended_by UUID,
    suspended_at TIMESTAMP,
    
    -- Audit
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = true;


-- User Sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    token_hash VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255),
    
    -- Session Info
    ip_address VARCHAR(50),
    user_agent TEXT,
    device_type VARCHAR(50),
    browser VARCHAR(100),
    os VARCHAR(100),
    location VARCHAR(200),
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active, expires_at);


-- ============================================================================
-- 2. ROLES & PERMISSIONS
-- ============================================================================

-- Roles
CREATE TABLE IF NOT EXISTS roles (
    role_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    role_name VARCHAR(100) NOT NULL,
    role_code VARCHAR(50) NOT NULL,
    description TEXT,
    
    -- System/Custom
    is_system_role BOOLEAN DEFAULT false, -- Cannot be deleted
    is_admin_role BOOLEAN DEFAULT false,
    
    -- Hierarchy
    role_level INTEGER DEFAULT 1,
    
    is_active BOOLEAN DEFAULT true,
    
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_role_code_tenant UNIQUE (tenant_id, role_code)
);

CREATE INDEX IF NOT EXISTS idx_roles_tenant ON roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_roles_active ON roles(is_active) WHERE is_active = true;

-- Pre-populate system roles
INSERT INTO roles (role_name, role_code, description, is_system_role, is_admin_role, role_level) VALUES
('Super Admin', 'SUPER_ADMIN', 'Full system access', true, true, 100),
('System Admin', 'SYSTEM_ADMIN', 'System administration', true, true, 90),
('Finance Manager', 'FINANCE_MANAGER', 'Financial management', true, false, 70),
('HR Manager', 'HR_MANAGER', 'HR and payroll management', true, false, 70),
('Sales Manager', 'SALES_MANAGER', 'Sales management', true, false, 60),
('Purchase Manager', 'PURCHASE_MANAGER', 'Purchase management', true, false, 60),
('Warehouse Manager', 'WAREHOUSE_MANAGER', 'Inventory and warehouse', true, false, 60),
('Accountant', 'ACCOUNTANT', 'Accounting functions', true, false, 50),
('Sales Rep', 'SALES_REP', 'Sales representative', true, false, 30),
('Employee', 'EMPLOYEE', 'Standard employee', true, false, 10),
('Read Only', 'READ_ONLY', 'View-only access', true, false, 5)
ON CONFLICT (tenant_id, role_code) DO NOTHING;


-- Permissions
CREATE TABLE IF NOT EXISTS permissions (
    permission_id SERIAL PRIMARY KEY,
    
    permission_code VARCHAR(100) NOT NULL UNIQUE,
    permission_name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Grouping
    module VARCHAR(50) NOT NULL, -- SALES, PURCHASE, HR, FINANCE, etc.
    category VARCHAR(50), -- CRUD, APPROVAL, REPORTING, etc.
    
    -- Permission Type
    resource VARCHAR(100) NOT NULL, -- invoices, employees, products, etc.
    action VARCHAR(50) NOT NULL, -- CREATE, READ, UPDATE, DELETE, APPROVE, EXPORT, etc.
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);
CREATE INDEX IF NOT EXISTS idx_permissions_active ON permissions(is_active) WHERE is_active = true;

-- Pre-populate permissions (examples - expand as needed)
INSERT INTO permissions (permission_code, permission_name, module, resource, action) VALUES
-- Sales
('SALES_INVOICES_CREATE', 'Create Sales Invoices', 'SALES', 'invoices', 'CREATE'),
('SALES_INVOICES_READ', 'View Sales Invoices', 'SALES', 'invoices', 'READ'),
('SALES_INVOICES_UPDATE', 'Edit Sales Invoices', 'SALES', 'invoices', 'UPDATE'),
('SALES_INVOICES_DELETE', 'Delete Sales Invoices', 'SALES', 'invoices', 'DELETE'),
('SALES_INVOICES_APPROVE', 'Approve Sales Invoices', 'SALES', 'invoices', 'APPROVE'),
-- Finance
('FINANCE_JOURNAL_CREATE', 'Create Journal Entries', 'FINANCE', 'journal_entries', 'CREATE'),
('FINANCE_JOURNAL_POST', 'Post Journal Entries', 'FINANCE', 'journal_entries', 'POST'),
('FINANCE_REPORTS_VIEW', 'View Financial Reports', 'FINANCE', 'reports', 'READ'),
-- HR
('HR_EMPLOYEES_CREATE', 'Create Employees', 'HR', 'employees', 'CREATE'),
('HR_EMPLOYEES_READ', 'View Employees', 'HR', 'employees', 'READ'),
('HR_PAYROLL_PROCESS', 'Process Payroll', 'HR', 'payroll', 'PROCESS'),
('HR_PAYROLL_APPROVE', 'Approve Payroll', 'HR', 'payroll', 'APPROVE'),
-- Admin
('ADMIN_USERS_MANAGE', 'Manage Users', 'ADMIN', 'users', 'MANAGE'),
('ADMIN_ROLES_MANAGE', 'Manage Roles', 'ADMIN', 'roles', 'MANAGE'),
('ADMIN_SETTINGS_MANAGE', 'Manage System Settings', 'ADMIN', 'settings', 'MANAGE')
ON CONFLICT (permission_code) DO NOTHING;


-- Role Permissions (Many-to-Many)
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INTEGER NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(permission_id) ON DELETE CASCADE,
    
    granted_by UUID,
    granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);


-- User Roles (Many-to-Many)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    
    assigned_by UUID,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    
    is_active BOOLEAN DEFAULT true,
    
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);


-- User Permissions (Direct user permissions override)
CREATE TABLE IF NOT EXISTS user_permissions (
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(permission_id) ON DELETE CASCADE,
    
    permission_type VARCHAR(10) NOT NULL, -- GRANT or DENY
    
    granted_by UUID,
    granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (user_id, permission_id),
    
    CONSTRAINT chk_permission_type CHECK (permission_type IN ('GRANT', 'DENY'))
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);


-- ============================================================================
-- 3. AUDIT LOGGING
-- ============================================================================

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    -- Who
    user_id UUID,
    user_email VARCHAR(255),
    user_name VARCHAR(200),
    
    -- What
    action VARCHAR(100) NOT NULL, -- CREATE, UPDATE, DELETE, LOGIN, LOGOUT, APPROVE, etc.
    resource_type VARCHAR(100) NOT NULL, -- users, invoices, employees, etc.
    resource_id VARCHAR(100),
    
    -- Details
    description TEXT,
    old_values JSONB,
    new_values JSONB,
    changes JSONB,
    
    -- Where
    ip_address VARCHAR(50),
    user_agent TEXT,
    
    -- When
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Status
    status VARCHAR(20) DEFAULT 'SUCCESS', -- SUCCESS, FAILURE, ERROR
    error_message TEXT,
    
    -- Metadata
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Partition audit logs by month for performance (optional - for large systems)
-- ALTER TABLE audit_logs PARTITION BY RANGE (timestamp);


-- ============================================================================
-- 4. SYSTEM SETTINGS
-- ============================================================================

-- System Settings
CREATE TABLE IF NOT EXISTS system_settings (
    setting_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    setting_key VARCHAR(200) NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'STRING', -- STRING, NUMBER, BOOLEAN, JSON, DATE
    
    category VARCHAR(100) NOT NULL, -- GENERAL, FINANCE, HR, SECURITY, etc.
    description TEXT,
    
    -- Validation
    is_encrypted BOOLEAN DEFAULT false,
    is_required BOOLEAN DEFAULT false,
    default_value TEXT,
    
    -- Metadata
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_setting_key_tenant UNIQUE (tenant_id, setting_key)
);

CREATE INDEX IF NOT EXISTS idx_system_settings_tenant ON system_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);

-- Pre-populate common settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES
('company_name', 'Worldclass ERP', 'STRING', 'GENERAL', 'Company name'),
('base_currency', 'ZAR', 'STRING', 'FINANCE', 'Base currency code'),
('tax_rate_default', '15', 'NUMBER', 'FINANCE', 'Default VAT/tax rate'),
('fiscal_year_start', '01-01', 'STRING', 'FINANCE', 'Fiscal year start (MM-DD)'),
('password_min_length', '8', 'NUMBER', 'SECURITY', 'Minimum password length'),
('session_timeout_minutes', '60', 'NUMBER', 'SECURITY', 'Session timeout in minutes'),
('max_login_attempts', '5', 'NUMBER', 'SECURITY', 'Maximum failed login attempts before lock'),
('lock_duration_minutes', '30', 'NUMBER', 'SECURITY', 'Account lock duration'),
('email_notifications_enabled', 'true', 'BOOLEAN', 'NOTIFICATIONS', 'Enable email notifications'),
('invoice_number_prefix', 'INV', 'STRING', 'SALES', 'Invoice number prefix'),
('payroll_approval_required', 'true', 'BOOLEAN', 'HR', 'Payroll requires approval')
ON CONFLICT (tenant_id, setting_key) DO NOTHING;


-- ============================================================================
-- 5. NOTIFICATIONS
-- ============================================================================

-- Notification Templates
CREATE TABLE IF NOT EXISTS notification_templates (
    template_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    template_code VARCHAR(100) NOT NULL,
    template_name VARCHAR(200) NOT NULL,
    
    -- Channels
    supports_email BOOLEAN DEFAULT true,
    supports_sms BOOLEAN DEFAULT false,
    supports_push BOOLEAN DEFAULT false,
    supports_in_app BOOLEAN DEFAULT true,
    
    -- Email Template
    email_subject VARCHAR(500),
    email_body_html TEXT,
    email_body_text TEXT,
    
    -- SMS Template
    sms_body VARCHAR(500),
    
    -- Push Template
    push_title VARCHAR(200),
    push_body TEXT,
    
    -- In-App Template
    notification_title VARCHAR(200),
    notification_body TEXT,
    notification_icon VARCHAR(50),
    notification_color VARCHAR(20),
    
    -- Variables
    template_variables TEXT[], -- Array of variable placeholders
    
    -- Settings
    category VARCHAR(50),
    priority VARCHAR(20) DEFAULT 'NORMAL', -- LOW, NORMAL, HIGH, URGENT
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_template_code_tenant UNIQUE (tenant_id, template_code)
);

CREATE INDEX IF NOT EXISTS idx_notification_templates_tenant ON notification_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON notification_templates(is_active);


-- User Notifications
CREATE TABLE IF NOT EXISTS user_notifications (
    notification_id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Notification Content
    notification_type VARCHAR(100) NOT NULL, -- INVOICE_APPROVED, PAYROLL_READY, LEAVE_APPROVED, etc.
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    
    -- Links & Actions
    action_url VARCHAR(500),
    action_label VARCHAR(100),
    
    -- Related Resource
    resource_type VARCHAR(100),
    resource_id VARCHAR(100),
    
    -- Appearance
    icon VARCHAR(50),
    color VARCHAR(20),
    priority VARCHAR(20) DEFAULT 'NORMAL',
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    is_archived BOOLEAN DEFAULT false,
    
    -- Metadata
    metadata JSONB,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_unread ON user_notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_user_notifications_created ON user_notifications(created_at DESC);


-- Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    notification_type VARCHAR(100) NOT NULL,
    
    email_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,
    push_enabled BOOLEAN DEFAULT true,
    in_app_enabled BOOLEAN DEFAULT true,
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (user_id, notification_type)
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);


-- ============================================================================
-- 6. FEATURE FLAGS
-- ============================================================================

-- Feature Flags
CREATE TABLE IF NOT EXISTS feature_flags (
    flag_id SERIAL PRIMARY KEY,
    
    flag_name VARCHAR(100) NOT NULL UNIQUE,
    flag_key VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    
    is_enabled BOOLEAN DEFAULT false,
    
    -- Rollout
    rollout_percentage INTEGER DEFAULT 0, -- 0-100
    enabled_for_tenants UUID[],
    enabled_for_users UUID[],
    
    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(is_enabled);


-- ============================================================================
-- 7. SCHEDULED JOBS
-- ============================================================================

-- Scheduled Jobs
CREATE TABLE IF NOT EXISTS scheduled_jobs (
    job_id SERIAL PRIMARY KEY,
    
    job_name VARCHAR(200) NOT NULL UNIQUE,
    job_type VARCHAR(100) NOT NULL, -- DEPRECIATION, PAYROLL, BACKUP, EMAIL_QUEUE, etc.
    
    -- Schedule (Cron format)
    cron_expression VARCHAR(100) NOT NULL,
    timezone VARCHAR(100) DEFAULT 'Africa/Johannesburg',
    
    -- Execution
    last_run_at TIMESTAMP,
    last_run_status VARCHAR(20), -- SUCCESS, FAILURE, RUNNING
    last_run_duration INTEGER, -- seconds
    last_run_message TEXT,
    
    next_run_at TIMESTAMP,
    
    -- Stats
    total_runs INTEGER DEFAULT 0,
    successful_runs INTEGER DEFAULT 0,
    failed_runs INTEGER DEFAULT 0,
    
    -- Status
    is_enabled BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_enabled ON scheduled_jobs(is_enabled) WHERE is_enabled = true;
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_next_run ON scheduled_jobs(next_run_at);


-- Job Execution History
CREATE TABLE IF NOT EXISTS job_execution_history (
    execution_id BIGSERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES scheduled_jobs(job_id),
    
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    duration INTEGER, -- seconds
    
    status VARCHAR(20) NOT NULL, -- SUCCESS, FAILURE, TIMEOUT
    message TEXT,
    error_details TEXT,
    
    records_processed INTEGER DEFAULT 0,
    
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_job_execution_job ON job_execution_history(job_id);
CREATE INDEX IF NOT EXISTS idx_job_execution_started ON job_execution_history(started_at DESC);


-- ============================================================================
-- 8. TENANT MANAGEMENT (Multi-Tenant Support)
-- ============================================================================

-- Tenants
CREATE TABLE IF NOT EXISTS tenants (
    tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Company Info
    company_name VARCHAR(200) NOT NULL,
    company_registration VARCHAR(100),
    vat_number VARCHAR(50),
    
    -- Contact
    primary_email VARCHAR(255) NOT NULL,
    primary_phone VARCHAR(50),
    website VARCHAR(200),
    
    -- Address
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    country VARCHAR(100) DEFAULT 'South Africa',
    postal_code VARCHAR(20),
    
    -- Subscription
    subscription_plan VARCHAR(50) DEFAULT 'TRIAL', -- TRIAL, BASIC, PROFESSIONAL, ENTERPRISE
    subscription_status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, SUSPENDED, CANCELLED, EXPIRED
    trial_ends_at TIMESTAMP,
    subscription_starts_at TIMESTAMP,
    subscription_ends_at TIMESTAMP,
    
    -- Limits
    max_users INTEGER DEFAULT 5,
    max_storage_gb INTEGER DEFAULT 10,
    current_user_count INTEGER DEFAULT 0,
    current_storage_gb DECIMAL(10,2) DEFAULT 0,
    
    -- Settings
    timezone VARCHAR(100) DEFAULT 'Africa/Johannesburg',
    currency VARCHAR(3) DEFAULT 'ZAR',
    language VARCHAR(10) DEFAULT 'en',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_suspended BOOLEAN DEFAULT false,
    suspension_reason TEXT,
    
    -- Onboarding
    onboarding_completed BOOLEAN DEFAULT false,
    onboarding_step INTEGER DEFAULT 1,
    
    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_subscription_status CHECK (subscription_status IN ('ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED', 'TRIAL'))
);

CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenants(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_tenants_subscription ON tenants(subscription_status);


-- ============================================================================
-- COMMENTS & DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE users IS 'User accounts with authentication and profile';
COMMENT ON TABLE roles IS 'User roles for access control';
COMMENT ON TABLE permissions IS 'Granular permissions for resources and actions';
COMMENT ON TABLE audit_logs IS 'Complete audit trail of all system actions';
COMMENT ON TABLE system_settings IS 'System-wide configuration settings';
COMMENT ON TABLE user_notifications IS 'In-app notifications for users';
COMMENT ON TABLE feature_flags IS 'Feature flags for gradual rollout';
COMMENT ON TABLE scheduled_jobs IS 'Background job scheduling';
COMMENT ON TABLE tenants IS 'Multi-tenant organization management';

-- ============================================================================
-- END OF ADMIN MODULE SCHEMA
-- ============================================================================
