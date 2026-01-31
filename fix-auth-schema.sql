-- Fix Database Schema for Authentication
-- Date: December 30, 2025
-- Purpose: Align tenants table columns with auth service expectations

-- Check current structure first
\d tenants;

-- Fix column naming to match auth service expectations
-- auth.service.ts expects: t.id, t.name, t.slug

-- 1. Rename tenant_id to id
ALTER TABLE tenants RENAME COLUMN tenant_id TO id;

-- 2. Rename tenant_name to name  
ALTER TABLE tenants RENAME COLUMN tenant_name TO name;

-- 3. Add slug column and populate from tenant_code
ALTER TABLE tenants ADD COLUMN slug VARCHAR(100) UNIQUE;
UPDATE tenants SET slug = LOWER(tenant_code);

-- Optional: Drop tenant_code if no longer needed (keep for now for safety)
-- ALTER TABLE tenants DROP COLUMN tenant_code;

-- Verify the changes
\d tenants;
SELECT id, name, slug, tenant_code FROM tenants;

-- Test the exact query that auth service uses
SELECT u.*, t.id as tenant_id, t.slug as tenant_slug, t.name as tenant_name 
FROM users u 
JOIN tenants t ON u.tenant_id = t.id 
WHERE u.email = 'Sibusiso@sgbsgroup.co.za' 
LIMIT 1;