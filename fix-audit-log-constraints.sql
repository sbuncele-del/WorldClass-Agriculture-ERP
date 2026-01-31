-- Fix audit_log table constraints
-- Date: December 30, 2025

-- Make resource_type and action optional for login events
ALTER TABLE audit_log ALTER COLUMN resource_type DROP NOT NULL;
ALTER TABLE audit_log ALTER COLUMN action DROP NOT NULL;

-- Add default values for common login events
ALTER TABLE audit_log ALTER COLUMN resource_type SET DEFAULT 'auth';
ALTER TABLE audit_log ALTER COLUMN action SET DEFAULT 'login_attempt';

-- Verify the changes
\d audit_log;

SELECT 'Audit log constraints updated' AS status;