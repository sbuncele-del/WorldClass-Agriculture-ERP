-- Fix Users Table Schema for Authentication
-- Date: December 30, 2025
-- Purpose: Add missing deleted_at column to users table

-- Check current structure first
\d users;

-- Add the missing deleted_at column that auth service expects
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Also add other common audit columns that might be missing
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Verify the changes
\d users;

-- Test the login query that auth service uses
SELECT u.*, t.id as tenant_id, t.slug as tenant_slug, t.name as tenant_name 
FROM users u 
JOIN tenants t ON u.tenant_id = t.id 
WHERE u.email = 'Sibusiso@sgbsgroup.co.za' 
AND (u.deleted_at IS NULL OR u.deleted_at > NOW())
LIMIT 1;