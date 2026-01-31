-- =====================================================
-- SUPER ADMIN & MULTI-TENANT SUPPORT PORTAL MODULE
-- =====================================================
-- Purpose: Centralized admin portal for monitoring and supporting ALL client tenants
-- Features: Tenant health monitoring, support tickets, audit logging, feature flags
-- Security: Role-based access, impersonation tracking, comprehensive audit trail
-- Created: November 13, 2025
-- =====================================================

-- =====================================================
-- 1. TENANT HEALTH METRICS
-- =====================================================
-- Purpose: Track system health, usage, and performance for each tenant
-- Updated: Daily via scheduled job
-- Used by: Super Admin Dashboard, Monitoring Alerts

CREATE TABLE IF NOT EXISTS tenant_health_metrics (
  metric_id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- System Health Indicators
  active_users INT DEFAULT 0,
  total_users INT DEFAULT 0,
  api_calls_count INT DEFAULT 0,
  error_count INT DEFAULT 0,
  error_rate DECIMAL(5,2) DEFAULT 0.00, -- Percentage
  avg_response_time_ms INT DEFAULT 0,
  slow_queries_count INT DEFAULT 0, -- Queries > 1 second
  
  -- Business Activity Metrics
  transactions_count INT DEFAULT 0,
  revenue_amount DECIMAL(15,2) DEFAULT 0.00,
  invoices_generated INT DEFAULT 0,
  orders_created INT DEFAULT 0,
  
  -- Storage & Performance
  database_size_mb DECIMAL(10,2) DEFAULT 0.00,
  storage_used_gb DECIMAL(10,2) DEFAULT 0.00,
  backup_status VARCHAR(20) DEFAULT 'OK', -- OK, FAILED, PENDING
  last_backup_at TIMESTAMP,
  
  -- Feature Adoption
  modules_active JSONB DEFAULT '[]', -- ["sales", "inventory", "hr"]
  features_used JSONB DEFAULT '{}', -- {"ai_agents": 45, "reports": 12}
  
  -- Activity Tracking
  login_count INT DEFAULT 0,
  last_activity TIMESTAMP,
  peak_concurrent_users INT DEFAULT 0,
  
  -- Health Score (calculated)
  health_score INT DEFAULT 100, -- 0-100, lower = issues
  health_status VARCHAR(20) DEFAULT 'HEALTHY', -- HEALTHY, WARNING, CRITICAL, DEGRADED
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_tenant_metric_date UNIQUE(tenant_id, metric_date)
);

CREATE INDEX idx_tenant_health_date ON tenant_health_metrics(tenant_id, metric_date DESC);
CREATE INDEX idx_health_status ON tenant_health_metrics(health_status) WHERE health_status != 'HEALTHY';
CREATE INDEX idx_metric_date ON tenant_health_metrics(metric_date DESC);

COMMENT ON TABLE tenant_health_metrics IS 'Daily health and usage metrics for each tenant';
COMMENT ON COLUMN tenant_health_metrics.health_score IS 'Composite health score: 100 = perfect, <50 = critical';
COMMENT ON COLUMN tenant_health_metrics.error_rate IS 'Percentage of API calls resulting in errors';

-- =====================================================
-- 2. SUPPORT TICKETS SYSTEM
-- =====================================================
-- Purpose: Track customer support requests with SLA monitoring
-- Integration: Links to tenants and users
-- Used by: Support agents, ticket management system

CREATE TABLE IF NOT EXISTS support_tickets (
  ticket_id SERIAL PRIMARY KEY,
  ticket_number VARCHAR(20) UNIQUE NOT NULL, -- TKT-2025-001234
  tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE SET NULL,
  
  -- Ticket Content
  subject VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'GENERAL', -- TECHNICAL, BILLING, FEATURE_REQUEST, BUG, TRAINING, DATA_ISSUE
  priority VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
  severity VARCHAR(20) DEFAULT 'MINOR', -- MINOR, MAJOR, CRITICAL, BLOCKER
  
  -- Status Workflow
  status VARCHAR(20) DEFAULT 'OPEN', -- OPEN, ASSIGNED, IN_PROGRESS, WAITING_CLIENT, RESOLVED, CLOSED, REOPENED
  resolution TEXT,
  resolution_category VARCHAR(50), -- SOLVED, WORKAROUND, NOT_REPRODUCIBLE, BY_DESIGN, DUPLICATE
  
  -- Assignment & Ownership
  reported_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES users(user_id) ON DELETE SET NULL,
  assigned_team VARCHAR(50), -- SUPPORT, TECHNICAL, BILLING, DEVELOPMENT
  
  -- Context & Debugging Info
  module_name VARCHAR(100), -- Which module has the issue
  url_path TEXT, -- URL where issue occurred
  error_message TEXT,
  error_stack TEXT,
  browser_info JSONB, -- Browser, OS, screen resolution
  steps_to_reproduce TEXT,
  attachments JSONB DEFAULT '[]', -- File URLs
  
  -- SLA Tracking
  sla_priority_hours INT DEFAULT 24, -- Response time SLA based on priority
  sla_breach BOOLEAN DEFAULT false,
  sla_breach_reason TEXT,
  
  -- Timeline
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  first_response_at TIMESTAMP,
  resolved_at TIMESTAMP,
  closed_at TIMESTAMP,
  last_customer_response_at TIMESTAMP,
  
  -- Response Time Metrics
  first_response_minutes INT, -- Time to first response
  resolution_hours DECIMAL(10,2), -- Time to resolve
  
  -- Related Tickets
  parent_ticket_id INT REFERENCES support_tickets(ticket_id),
  related_ticket_ids INT[] DEFAULT '{}',
  
  -- Tags for categorization
  tags VARCHAR(50)[] DEFAULT '{}',
  
  -- Customer Satisfaction
  satisfaction_rating INT CHECK (satisfaction_rating BETWEEN 1 AND 5),
  satisfaction_comment TEXT,
  
  CONSTRAINT valid_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  CONSTRAINT valid_status CHECK (status IN ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_CLIENT', 'RESOLVED', 'CLOSED', 'REOPENED'))
);

-- Auto-generate ticket numbers
CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ticket_number := 'TKT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('ticket_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_ticket_number
  BEFORE INSERT ON support_tickets
  FOR EACH ROW
  WHEN (NEW.ticket_number IS NULL)
  EXECUTE FUNCTION generate_ticket_number();

CREATE INDEX idx_ticket_tenant ON support_tickets(tenant_id);
CREATE INDEX idx_ticket_status ON support_tickets(status) WHERE status NOT IN ('CLOSED', 'RESOLVED');
CREATE INDEX idx_ticket_assigned ON support_tickets(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_ticket_priority ON support_tickets(priority, created_at DESC);
CREATE INDEX idx_ticket_created ON support_tickets(created_at DESC);
CREATE INDEX idx_ticket_sla_breach ON support_tickets(sla_breach) WHERE sla_breach = true;

COMMENT ON TABLE support_tickets IS 'Customer support ticket tracking with SLA monitoring';
COMMENT ON COLUMN support_tickets.ticket_number IS 'Human-readable ticket identifier: TKT-2025-001234';
COMMENT ON COLUMN support_tickets.sla_breach IS 'True if ticket exceeded response time SLA';

-- =====================================================
-- 3. SUPPORT TICKET COMMENTS/UPDATES
-- =====================================================
CREATE TABLE IF NOT EXISTS support_ticket_comments (
  comment_id SERIAL PRIMARY KEY,
  ticket_id INT NOT NULL REFERENCES support_tickets(ticket_id) ON DELETE CASCADE,
  
  -- Comment Content
  comment_text TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- Internal notes not visible to customer
  is_status_update BOOLEAN DEFAULT false, -- Auto-generated status change comment
  
  -- Author
  created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
  author_role VARCHAR(50), -- CUSTOMER, SUPPORT_AGENT, DEVELOPER, SYSTEM
  
  -- Attachments
  attachments JSONB DEFAULT '[]',
  
  -- Timing
  created_at TIMESTAMP DEFAULT NOW(),
  edited_at TIMESTAMP,
  
  -- Email notification
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP
);

CREATE INDEX idx_ticket_comments_ticket ON support_ticket_comments(ticket_id, created_at);
CREATE INDEX idx_ticket_comments_author ON support_ticket_comments(created_by);

COMMENT ON TABLE support_ticket_comments IS 'Comments and updates on support tickets';
COMMENT ON COLUMN support_ticket_comments.is_internal IS 'Internal notes not visible to customers';

-- =====================================================
-- 4. ADMIN ACCESS AUDIT LOGS
-- =====================================================
-- Purpose: Track every admin/support action for security and compliance
-- Retention: Keep forever for audit trail
-- Critical: GDPR/SOC2 compliance requirement

CREATE TABLE IF NOT EXISTS admin_access_logs (
  log_id BIGSERIAL PRIMARY KEY,
  
  -- Who
  admin_user_id UUID NOT NULL REFERENCES users(user_id),
  admin_email VARCHAR(255) NOT NULL,
  admin_role VARCHAR(50) NOT NULL,
  
  -- What
  action VARCHAR(100) NOT NULL, -- IMPERSONATE_TENANT, VIEW_TENANT_DATA, MODIFY_FEATURE_FLAG, etc.
  action_category VARCHAR(50) DEFAULT 'ACCESS', -- ACCESS, MODIFICATION, DELETION, EXPORT
  
  -- Where/Which Tenant
  target_tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE SET NULL,
  target_tenant_name VARCHAR(255),
  
  -- Context
  resource_type VARCHAR(50), -- TENANT, USER, INVOICE, REPORT, etc.
  resource_id VARCHAR(100), -- ID of accessed resource
  endpoint_path TEXT, -- API endpoint accessed
  http_method VARCHAR(10), -- GET, POST, PUT, DELETE
  
  -- What was accessed/changed
  data_accessed JSONB, -- Summary of what data was viewed
  changes_made JSONB, -- Before/after values for modifications
  reason TEXT, -- Why the access was needed
  
  -- Network Info
  ip_address INET,
  user_agent TEXT,
  
  -- Session Info
  impersonation_token TEXT, -- If using impersonation
  session_duration_seconds INT,
  
  -- Result
  action_result VARCHAR(20) DEFAULT 'SUCCESS', -- SUCCESS, FAILED, DENIED
  error_message TEXT,
  
  -- Timing
  timestamp TIMESTAMP DEFAULT NOW(),
  
  -- Alerts
  flagged_for_review BOOLEAN DEFAULT false,
  review_comment TEXT,
  reviewed_by UUID REFERENCES users(user_id),
  reviewed_at TIMESTAMP
);

CREATE INDEX idx_admin_logs_admin ON admin_access_logs(admin_user_id, timestamp DESC);
CREATE INDEX idx_admin_logs_tenant ON admin_access_logs(target_tenant_id, timestamp DESC);
CREATE INDEX idx_admin_logs_timestamp ON admin_access_logs(timestamp DESC);
CREATE INDEX idx_admin_logs_action ON admin_access_logs(action, timestamp DESC);
CREATE INDEX idx_admin_logs_flagged ON admin_access_logs(flagged_for_review) WHERE flagged_for_review = true;

COMMENT ON TABLE admin_access_logs IS 'Comprehensive audit trail of all admin/support actions';
COMMENT ON COLUMN admin_access_logs.data_accessed IS 'Summary of data viewed (not full content for privacy)';
COMMENT ON COLUMN admin_access_logs.flagged_for_review IS 'Unusual access pattern detected';

-- =====================================================
-- 5. TENANT FEATURE FLAGS
-- =====================================================
-- Purpose: Control feature availability per tenant (A/B testing, gradual rollout)
-- Use cases: Beta features, paid tier features, tenant-specific customization

CREATE TABLE IF NOT EXISTS tenant_feature_flags (
  flag_id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  
  -- Feature Identification
  feature_name VARCHAR(100) NOT NULL, -- ai_agents, healthcare_module, advanced_analytics
  feature_category VARCHAR(50) DEFAULT 'GENERAL', -- MODULE, FEATURE, BETA, EXPERIMENTAL
  
  -- Flag Status
  enabled BOOLEAN DEFAULT true,
  rollout_percentage INT DEFAULT 100 CHECK (rollout_percentage BETWEEN 0 AND 100), -- Gradual rollout
  
  -- Configuration
  config JSONB, -- Feature-specific settings
  constraints JSONB, -- Usage limits, quotas
  
  -- Metadata
  enabled_by_default BOOLEAN DEFAULT false,
  requires_subscription_tier VARCHAR(50), -- FREE, BASIC, PROFESSIONAL, ENTERPRISE
  
  -- Change Tracking
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(user_id),
  enabled_at TIMESTAMP,
  disabled_at TIMESTAMP,
  
  -- Notes
  reason TEXT, -- Why feature was enabled/disabled
  expires_at TIMESTAMP, -- Auto-disable after this date (for trials)
  
  CONSTRAINT unique_tenant_feature UNIQUE(tenant_id, feature_name)
);

CREATE INDEX idx_feature_flags_tenant ON tenant_feature_flags(tenant_id);
CREATE INDEX idx_feature_flags_feature ON tenant_feature_flags(feature_name);
CREATE INDEX idx_feature_flags_enabled ON tenant_feature_flags(tenant_id, feature_name) WHERE enabled = true;

COMMENT ON TABLE tenant_feature_flags IS 'Per-tenant feature toggle control for gradual rollout and A/B testing';
COMMENT ON COLUMN tenant_feature_flags.rollout_percentage IS 'Percentage of users who see this feature (for gradual rollout)';
COMMENT ON COLUMN tenant_feature_flags.config IS 'Feature-specific configuration (limits, settings, etc.)';

-- =====================================================
-- 6. TENANT ALERTS & NOTIFICATIONS
-- =====================================================
-- Purpose: Proactive monitoring alerts for admin team
-- Triggers: Health degradation, usage spikes, errors, billing issues

CREATE TABLE IF NOT EXISTS tenant_alerts (
  alert_id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  
  -- Alert Classification
  alert_type VARCHAR(50) NOT NULL, -- HEALTH_DEGRADED, HIGH_ERROR_RATE, USAGE_SPIKE, BILLING_ISSUE, etc.
  severity VARCHAR(20) DEFAULT 'WARNING', -- INFO, WARNING, ERROR, CRITICAL
  category VARCHAR(50) DEFAULT 'SYSTEM', -- SYSTEM, PERFORMANCE, SECURITY, BILLING, USAGE
  
  -- Alert Content
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  details JSONB, -- Detailed metrics, context
  
  -- Recommendations
  recommended_action TEXT,
  auto_resolvable BOOLEAN DEFAULT false,
  
  -- Status
  status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, ACKNOWLEDGED, RESOLVED, DISMISSED
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES users(user_id),
  resolution_notes TEXT,
  
  -- Notification
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMP,
  notification_channels JSONB DEFAULT '["email"]', -- ["email", "slack", "sms"]
  
  -- Recurrence
  first_detected_at TIMESTAMP DEFAULT NOW(),
  last_detected_at TIMESTAMP DEFAULT NOW(),
  occurrence_count INT DEFAULT 1,
  
  -- Metadata
  source VARCHAR(50), -- HEALTH_CHECK, ERROR_MONITOR, USAGE_TRACKER, MANUAL
  related_metric_id INT REFERENCES tenant_health_metrics(metric_id),
  related_ticket_id INT REFERENCES support_tickets(ticket_id),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_alerts_tenant ON tenant_alerts(tenant_id, created_at DESC);
CREATE INDEX idx_alerts_status ON tenant_alerts(status) WHERE status = 'ACTIVE';
CREATE INDEX idx_alerts_severity ON tenant_alerts(severity, created_at DESC) WHERE severity IN ('ERROR', 'CRITICAL');
CREATE INDEX idx_alerts_type ON tenant_alerts(alert_type, created_at DESC);

COMMENT ON TABLE tenant_alerts IS 'Proactive monitoring alerts for admin team';
COMMENT ON COLUMN tenant_alerts.auto_resolvable IS 'Can be automatically resolved when metric returns to normal';
COMMENT ON COLUMN tenant_alerts.occurrence_count IS 'How many times this alert has triggered';

-- =====================================================
-- 7. UPDATE USERS TABLE FOR SUPER ADMIN ROLES
-- =====================================================
-- Add super admin role support to existing users table

DO $$
BEGIN
  -- Check if we need to add platform_admin and support_agent roles
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel IN ('platform_admin', 'support_agent', 'monitoring_user')
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    -- Add new enum values for super admin roles
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'platform_admin';
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'support_agent';
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'monitoring_user';
  END IF;
END $$;

COMMENT ON COLUMN users.role IS 'User role: admin, manager, employee, accountant, platform_admin, support_agent, monitoring_user';

-- =====================================================
-- 8. SYSTEM HEALTH SUMMARY VIEW
-- =====================================================
-- Purpose: Quick overview of system-wide health across all tenants

CREATE OR REPLACE VIEW system_health_summary AS
SELECT 
  COUNT(DISTINCT t.tenant_id) as total_tenants,
  COUNT(DISTINCT CASE WHEN t.status = 'ACTIVE' THEN t.tenant_id END) as active_tenants,
  COUNT(DISTINCT CASE WHEN thm.health_status = 'CRITICAL' THEN t.tenant_id END) as critical_tenants,
  COUNT(DISTINCT CASE WHEN thm.health_status = 'DEGRADED' THEN t.tenant_id END) as degraded_tenants,
  
  -- Today's metrics
  COALESCE(SUM(thm.active_users), 0) as total_active_users_today,
  COALESCE(SUM(thm.api_calls_count), 0) as total_api_calls_today,
  COALESCE(AVG(thm.error_rate), 0) as avg_error_rate,
  COALESCE(AVG(thm.avg_response_time_ms), 0) as avg_response_time_ms,
  
  -- Storage
  COALESCE(SUM(thm.database_size_mb), 0) as total_db_size_mb,
  COALESCE(SUM(thm.storage_used_gb), 0) as total_storage_gb,
  
  -- Support
  (SELECT COUNT(*) FROM support_tickets WHERE status IN ('OPEN', 'ASSIGNED', 'IN_PROGRESS')) as open_tickets,
  (SELECT COUNT(*) FROM support_tickets WHERE status IN ('OPEN', 'ASSIGNED', 'IN_PROGRESS') AND priority = 'CRITICAL') as critical_tickets,
  (SELECT COUNT(*) FROM support_tickets WHERE sla_breach = true AND status NOT IN ('CLOSED', 'RESOLVED')) as sla_breach_tickets,
  
  -- Alerts
  (SELECT COUNT(*) FROM tenant_alerts WHERE status = 'ACTIVE' AND severity = 'CRITICAL') as critical_alerts,
  (SELECT COUNT(*) FROM tenant_alerts WHERE status = 'ACTIVE') as total_active_alerts,
  
  CURRENT_TIMESTAMP as snapshot_time
FROM tenants t
LEFT JOIN tenant_health_metrics thm ON thm.tenant_id = t.tenant_id 
  AND thm.metric_date = CURRENT_DATE;

COMMENT ON VIEW system_health_summary IS 'System-wide health overview across all tenants';

-- =====================================================
-- 9. TENANT ACTIVITY SUMMARY VIEW
-- =====================================================
-- Purpose: Quick tenant overview for super admin dashboard

CREATE OR REPLACE VIEW tenant_activity_summary AS
SELECT 
  t.tenant_id,
  t.tenant_name,
  t.subscription_plan,
  t.status as tenant_status,
  t.created_at as tenant_created_at,
  
  -- User metrics
  COUNT(DISTINCT u.user_id) as total_users,
  COUNT(DISTINCT CASE WHEN u.status = 'active' THEN u.user_id END) as active_users,
  MAX(u.last_login) as last_user_activity,
  
  -- Today's health metrics
  thm.active_users as active_users_today,
  thm.api_calls_count as api_calls_today,
  thm.error_rate,
  thm.health_status,
  thm.health_score,
  thm.database_size_mb,
  
  -- Support tickets
  (SELECT COUNT(*) FROM support_tickets st WHERE st.tenant_id = t.tenant_id AND st.status NOT IN ('CLOSED', 'RESOLVED')) as open_tickets,
  
  -- Active alerts
  (SELECT COUNT(*) FROM tenant_alerts ta WHERE ta.tenant_id = t.tenant_id AND ta.status = 'ACTIVE') as active_alerts,
  
  -- Feature adoption
  thm.modules_active,
  
  CURRENT_TIMESTAMP as snapshot_time
FROM tenants t
LEFT JOIN users u ON u.tenant_id = t.tenant_id
LEFT JOIN tenant_health_metrics thm ON thm.tenant_id = t.tenant_id 
  AND thm.metric_date = CURRENT_DATE
GROUP BY t.tenant_id, t.tenant_name, t.subscription_plan, t.status, t.created_at,
         thm.active_users, thm.api_calls_count, thm.error_rate, thm.health_status, 
         thm.health_score, thm.database_size_mb, thm.modules_active;

COMMENT ON VIEW tenant_activity_summary IS 'Per-tenant activity overview for super admin dashboard';

-- =====================================================
-- 10. HELPER FUNCTIONS
-- =====================================================

-- Function to calculate tenant health score
CREATE OR REPLACE FUNCTION calculate_tenant_health_score(
  p_error_rate DECIMAL,
  p_avg_response_time_ms INT,
  p_active_users INT,
  p_total_users INT
)
RETURNS INT AS $$
DECLARE
  score INT := 100;
BEGIN
  -- Deduct points for high error rate
  IF p_error_rate > 5 THEN score := score - 30;
  ELSIF p_error_rate > 2 THEN score := score - 15;
  ELSIF p_error_rate > 1 THEN score := score - 5;
  END IF;
  
  -- Deduct points for slow response times
  IF p_avg_response_time_ms > 2000 THEN score := score - 20;
  ELSIF p_avg_response_time_ms > 1000 THEN score := score - 10;
  ELSIF p_avg_response_time_ms > 500 THEN score := score - 5;
  END IF;
  
  -- Deduct points for low user engagement
  IF p_total_users > 0 THEN
    IF (p_active_users::FLOAT / p_total_users) < 0.1 THEN score := score - 15;
    ELSIF (p_active_users::FLOAT / p_total_users) < 0.3 THEN score := score - 5;
    END IF;
  END IF;
  
  RETURN GREATEST(0, score);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_tenant_health_score IS 'Calculate composite health score (0-100) based on metrics';

-- Function to log admin access
CREATE OR REPLACE FUNCTION log_admin_access(
  p_admin_user_id UUID,
  p_action VARCHAR,
  p_target_tenant_id UUID DEFAULT NULL,
  p_data_accessed JSONB DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS INT AS $$
DECLARE
  v_log_id INT;
  v_admin_email VARCHAR(255);
  v_admin_role VARCHAR(50);
  v_tenant_name VARCHAR(255);
BEGIN
  -- Get admin details
  SELECT email, role INTO v_admin_email, v_admin_role
  FROM users WHERE user_id = p_admin_user_id;
  
  -- Get tenant name if provided
  IF p_target_tenant_id IS NOT NULL THEN
    SELECT tenant_name INTO v_tenant_name
    FROM tenants WHERE tenant_id = p_target_tenant_id;
  END IF;
  
  -- Insert log
  INSERT INTO admin_access_logs (
    admin_user_id, admin_email, admin_role,
    action, target_tenant_id, target_tenant_name,
    data_accessed, reason, ip_address
  ) VALUES (
    p_admin_user_id, v_admin_email, v_admin_role,
    p_action, p_target_tenant_id, v_tenant_name,
    p_data_accessed, p_reason, inet_client_addr()
  )
  RETURNING log_id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION log_admin_access IS 'Convenience function to log admin actions with audit trail';

-- =====================================================
-- 11. SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample feature flags for common features
INSERT INTO tenant_feature_flags (tenant_id, feature_name, feature_category, enabled, requires_subscription_tier)
SELECT 
  tenant_id,
  feature_name,
  feature_category,
  true as enabled,
  tier
FROM tenants t
CROSS JOIN (
  VALUES 
    ('ai_agents', 'MODULE', 'PROFESSIONAL'),
    ('healthcare_module', 'MODULE', 'ENTERPRISE'),
    ('advanced_analytics', 'FEATURE', 'PROFESSIONAL'),
    ('multi_entity', 'FEATURE', 'ENTERPRISE'),
    ('custom_reports', 'FEATURE', 'BASIC'),
    ('api_access', 'FEATURE', 'PROFESSIONAL'),
    ('white_label', 'FEATURE', 'ENTERPRISE'),
    ('sso_integration', 'FEATURE', 'ENTERPRISE')
) AS features(feature_name, feature_category, tier)
ON CONFLICT (tenant_id, feature_name) DO NOTHING;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Grant permissions to application user
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO worldclass_erp_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO worldclass_erp_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO worldclass_erp_readonly;

SELECT 'Super Admin Portal migration completed successfully!' as status;
