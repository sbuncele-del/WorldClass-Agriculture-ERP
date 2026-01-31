-- Migration: Add User Profile Fields
-- Description: Add additional fields for user profile management

-- Add profile fields to users table if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS avatar TEXT,
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Africa/Johannesburg',
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(45);

-- Create index for phone lookups
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;

-- Create index for timezone
CREATE INDEX IF NOT EXISTS idx_users_timezone ON users(timezone);

-- Comments
COMMENT ON COLUMN users.phone IS 'User phone number (optional)';
COMMENT ON COLUMN users.avatar IS 'User avatar URL or base64 encoded image';
COMMENT ON COLUMN users.timezone IS 'User timezone for localization';
COMMENT ON COLUMN users.language IS 'User preferred language (en, af, zu, xh)';
COMMENT ON COLUMN users.two_factor_enabled IS 'Whether 2FA is enabled for this user';
COMMENT ON COLUMN users.two_factor_secret IS 'TOTP secret for 2FA';
COMMENT ON COLUMN users.last_login_at IS 'Timestamp of last successful login';
COMMENT ON COLUMN users.last_login_ip IS 'IP address of last successful login';
