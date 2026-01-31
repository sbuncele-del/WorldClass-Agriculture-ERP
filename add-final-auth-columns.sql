-- Add final authentication columns
-- Date: December 30, 2025

ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(45);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS session_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255);

-- Verify final structure
\d users;

-- Test data 
SELECT id, email, full_name, role, failed_login_attempts, email_verified, last_login_ip
FROM users 
WHERE email = 'Sibusiso@sgbsgroup.co.za';