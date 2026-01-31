/**
 * Email Verification Migration
 * Creates email_verification_tokens table and updates users table
 */

-- Add email verification fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP;

-- Create email_verification_tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
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
CREATE INDEX IF NOT EXISTS idx_email_verification_user_id ON email_verification_tokens(user_id);

-- Create index on token for faster verification
CREATE INDEX IF NOT EXISTS idx_email_verification_token ON email_verification_tokens(token);

-- Create index on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_email_verification_expires_at ON email_verification_tokens(expires_at);

-- Add unique constraint to ensure one active token per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_verification_active_user 
ON email_verification_tokens(user_id) 
WHERE used_at IS NULL;

-- Comment on table
COMMENT ON TABLE email_verification_tokens IS 'Stores email verification tokens for user registration';
COMMENT ON COLUMN email_verification_tokens.user_id IS 'Reference to the user being verified';
COMMENT ON COLUMN email_verification_tokens.tenant_id IS 'Reference to the tenant (if applicable)';
COMMENT ON COLUMN email_verification_tokens.token IS 'Unique verification token (64 character hex)';
COMMENT ON COLUMN email_verification_tokens.expires_at IS 'Token expiration timestamp (24 hours from creation)';
COMMENT ON COLUMN email_verification_tokens.used_at IS 'Timestamp when token was used (NULL if not used)';
