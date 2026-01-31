/**
 * Password Reset Migration
 * Creates password_reset_tokens table
 */

-- Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  tenant_id UUID,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  used_at TIMESTAMP,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_user_id ON password_reset_tokens(user_id);

-- Create index on token for faster verification
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token);

-- Create index on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_password_reset_expires_at ON password_reset_tokens(expires_at);

-- Add unique constraint to ensure one active token per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_password_reset_active_user 
ON password_reset_tokens(user_id) 
WHERE used_at IS NULL;

-- Comment on table
COMMENT ON TABLE password_reset_tokens IS 'Stores password reset tokens for user authentication';
COMMENT ON COLUMN password_reset_tokens.user_id IS 'Reference to the user requesting password reset';
COMMENT ON COLUMN password_reset_tokens.tenant_id IS 'Reference to the tenant (if applicable)';
COMMENT ON COLUMN password_reset_tokens.token IS 'Unique reset token (64 character hex)';
COMMENT ON COLUMN password_reset_tokens.expires_at IS 'Token expiration timestamp (1 hour from creation)';
COMMENT ON COLUMN password_reset_tokens.used_at IS 'Timestamp when token was used (NULL if not used)';
