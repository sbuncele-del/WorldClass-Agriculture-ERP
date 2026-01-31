-- Fix Users Table - Add Security Columns
-- Date: December 30, 2025
-- Purpose: Add remaining security columns for login tracking

-- Add security-related columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP;

-- Also add common profile columns that might be needed
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS job_title VARCHAR(100);

-- Update existing user to have email verified
UPDATE users SET 
    email_verified = true, 
    email_verified_at = CURRENT_TIMESTAMP,
    failed_login_attempts = 0
WHERE email = 'Sibusiso@sgbsgroup.co.za';

-- Verify the changes
\d users;

-- Test the login query
SELECT id, email, full_name, role, tenant_id, failed_login_attempts, locked_until, email_verified 
FROM users 
WHERE email = 'Sibusiso@sgbsgroup.co.za';