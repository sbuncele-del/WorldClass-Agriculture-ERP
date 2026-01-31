-- Email Preferences and Unsubscribe Management
-- Allows users to control which emails they receive

-- Email preferences table
CREATE TABLE IF NOT EXISTS email_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Email categories (all enabled by default)
  marketing_emails BOOLEAN DEFAULT TRUE,
  product_updates BOOLEAN DEFAULT TRUE,
  security_alerts BOOLEAN DEFAULT TRUE, -- Cannot be disabled
  payment_notifications BOOLEAN DEFAULT TRUE,
  subscription_notifications BOOLEAN DEFAULT TRUE,
  inventory_alerts BOOLEAN DEFAULT TRUE,
  team_notifications BOOLEAN DEFAULT TRUE,
  system_notifications BOOLEAN DEFAULT TRUE,
  
  -- Global unsubscribe (overrides all preferences)
  unsubscribed_all BOOLEAN DEFAULT FALSE,
  unsubscribed_at TIMESTAMP,
  
  -- Email frequency preferences
  digest_frequency VARCHAR(20) DEFAULT 'daily', -- instant, daily, weekly, never
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, tenant_id)
);

-- Unsubscribe tokens table (for one-click unsubscribe links)
CREATE TABLE IF NOT EXISTS unsubscribe_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  token VARCHAR(64) NOT NULL UNIQUE,
  category VARCHAR(50), -- NULL for unsubscribe all, or specific category
  expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '90 days'),
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Email send log (track what was sent to comply with regulations)
CREATE TABLE IF NOT EXISTS email_send_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE SET NULL,
  email_address VARCHAR(255) NOT NULL,
  email_type VARCHAR(50) NOT NULL, -- welcome, notification, alert, etc.
  email_category VARCHAR(50), -- marketing, transactional, security, etc.
  subject VARCHAR(255),
  sent_at TIMESTAMP DEFAULT NOW(),
  delivery_status VARCHAR(20) DEFAULT 'sent', -- sent, delivered, bounced, failed
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  
  -- Indexes for analytics
  INDEX idx_email_send_log_user_id (user_id),
  INDEX idx_email_send_log_email_address (email_address),
  INDEX idx_email_send_log_sent_at (sent_at),
  INDEX idx_email_send_log_type (email_type)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_preferences_user_id ON email_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_email_preferences_tenant_id ON email_preferences(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_preferences_unsubscribed ON email_preferences(unsubscribed_all);

CREATE INDEX IF NOT EXISTS idx_unsubscribe_tokens_token ON unsubscribe_tokens(token);
CREATE INDEX IF NOT EXISTS idx_unsubscribe_tokens_user_id ON unsubscribe_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_unsubscribe_tokens_expires_at ON unsubscribe_tokens(expires_at);

-- Comments
COMMENT ON TABLE email_preferences IS 'User email notification preferences and unsubscribe settings';
COMMENT ON TABLE unsubscribe_tokens IS 'Secure tokens for one-click unsubscribe functionality';
COMMENT ON TABLE email_send_log IS 'Audit log of all emails sent for compliance and analytics';

COMMENT ON COLUMN email_preferences.security_alerts IS 'Security alerts cannot be disabled for user safety';
COMMENT ON COLUMN email_preferences.unsubscribed_all IS 'User has unsubscribed from all non-essential emails';
COMMENT ON COLUMN email_preferences.digest_frequency IS 'How often to send digest emails: instant, daily, weekly, never';
